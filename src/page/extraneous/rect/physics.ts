import { Entity, EntityType, Inertial } from "./entity";
import { Game } from "./game";
import { World, Block } from "./world";

export const GRAVITY = -0.05;

export function distance(a: [number, number], b: [number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

type CollisionResponse = 'bounce' | 'block' | 'stick';
// terrain collision will usually be 'block'
// combinations:
// bounce + bounce -> bounce off each other w some threshold
// bounce + block ->  bounce off each other (bounce overrides block)
// bounce + stick ->  stick to each other (stick overrides bounce)
// block + block ->   block each other - inelastic collision, pushing
// block + stick  ->  stick to each other (stick overrides block)
// stick + stick   -> stick to each other

type ThingCollisionEvent = {
  time: number;
  id1: number;
  id2: number;
  axis: [number, number];
};

type TerrainCollisionEvent = {
  time: number;
  id: number;
  axis: [number, number];
};

function exclusiveBetween(x: number, lo: number, hi: number): boolean {
  return x > lo && x < hi;
}

function rangesOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
  return (
    exclusiveBetween(a0, b0, b1) ||
    exclusiveBetween(a1, b0, b1) ||
    exclusiveBetween(b0, a0, a1) ||
    exclusiveBetween(b1, a0, a1)
  );
}

function cornersTouch(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 === b1 || a1 === b0;
}

function calculateThingCollision(id1: number, thing1: Inertial, id2: number, thing2: Inertial): ThingCollisionEvent {
  const { x: x1, y: y1, w: w1, h: h1, vx: vx1, vy: vy1 } = thing1;
  const { x: x2, y: y2, w: w2, h: h2, vx: vx2, vy: vy2 } = thing2;
  let cornerCollision = false;
  // difference in velocity on x and y axes
  const dvx = vx2 - vx1;
  const dvy = vy2 - vy1;
  // sign of direction along x and y axes
  const xa = dvx < 0 ? 1 : -1;
  const ya = dvy < 0 ? 1 : -1;

  // time until x surfaces collide
  // x1 + xa * w1 / 2 + t * vx1 = x2 - xa * w2 / 2 + t * vx2
  // -> t = (x2 - x1 - xa * w2 / 2 - xa * w1 / 2) / (vx1 - vx2)
  let tx = dvx === 0 ? Infinity : (x2 - x1 - xa * w2 / 2 - xa * w1 / 2) / (vx1 - vx2);
  // collision only occurs if the objects are also aligned on the y axis
  {
    const lo1 = y1 - h1 / 2 + tx * vy1;
    const hi1 = y1 + h1 / 2 + tx * vy1;
    const lo2 = y2 - h2 / 2 + tx * vy2;
    const hi2 = y2 + h2 / 2 + tx * vy2;
    if(!rangesOverlap(lo1, hi1, lo2, hi2)) {
      if (cornersTouch(lo1, hi1, lo2, hi2)) {
        cornerCollision = true;
      } else {
        tx = Infinity;
      }
    }
  }

  // time until y surfaces collide
  // y1 + ya * h1 / 2 + t * vy1 = y2 - ya * h2 / 2 + t * vy2
  // -> t = (y2 - y1 - ya * h2 / 2 - ya * h1 / 2) / (vy1 - vy2)
  let ty = dvy === 0 ? Infinity : (y2 - y1 - ya * h2 / 2 - ya * h1 / 2) / (vy1 - vy2);
  // collision only occurs if the objects are also aligned on the x axis
  {
    const lo1 = x1 - w1 / 2 + ty * vx1;
    const hi1 = x1 + w1 / 2 + ty * vx1;
    const lo2 = x2 - w2 / 2 + ty * vx2;
    const hi2 = x2 + w2 / 2 + ty * vx2;
    if(!rangesOverlap(lo1, hi1, lo2, hi2)) {
      if (cornersTouch(lo1, hi1, lo2, hi2)) {
        cornerCollision = true;
      } else {
        ty = Infinity;
      }
    }
  }

  const axis: [number, number] = [0, 0];
  if (tx == ty) {
    if (Math.abs(dvx) < Math.abs(dvy)) {
      ty = Infinity;
    } else {
      tx = Infinity;
    }
  }
  if (tx < ty) {
    axis[0] = xa;
  } else {
    axis[1] = ya;
  }
  return { time: Math.min(tx, ty), id1: id1, id2: id2, axis };
}

function getNextThingCollision(inertials: Entity[]): ThingCollisionEvent {
  let nextCollision: ThingCollisionEvent = { time: Infinity, id1: -1, id2: -1, axis: [0, 0] };
  for (let i = 0; i < inertials.length; i += 1) {
    const thing1 = inertials[i];
    for (let j = i + 1; j < inertials.length; j += 1) {
      const thing2 = inertials[j];
      const collision = calculateThingCollision(thing1.id, thing1.data, thing2.id, thing2.data);
      if (collision.time < 0 || collision.time === Infinity) {
        continue;
      }
      if (collision.time < nextCollision.time) {
        nextCollision = collision;
      }
    }
  }
  return nextCollision;
}

function solidBlock(block: Block): boolean {
  return block != Block.Air && block != Block.Grasses;
}

function getNextTerrainCollision(world: World, inertials: Entity[]): TerrainCollisionEvent {
  let nextCollision: TerrainCollisionEvent = { time: Infinity, id: -1, axis: [0, 0] };
  for (const thing of inertials) {
    const { x, y, w, h, vx, vy } = thing.data;
    const xa = vx < 0 ? -1 : 1;
    const ya = vy < 0 ? -1 : 1;
    let tx = Infinity;
    if (vx !== 0) {
      const hitboxEdge = x + xa * w / 2;
      let nextBlock = xa === 1 ? Math.ceil(hitboxEdge + 0.5) : Math.floor(hitboxEdge - 0.5);
      while (true) {
        let t = (nextBlock - xa * 0.5 - hitboxEdge) / vx;
        let collision = false;
        if (t > 1) {
          break;
        }
        const bottom = y - h / 2 + t * vy;
        const top = y + h / 2 + t * vy;

        if (bottom - Math.floor(bottom) === 0.5) {
          const block = world.terrain.at(nextBlock, Math.floor(bottom));
          if (Math.abs(vx) < Math.abs(vy) && solidBlock(block)) {
            tx = t;
            collision = true;
            break;
          } 
        }
        if (top - Math.floor(top) === 0.5) {
          const block = world.terrain.at(nextBlock, Math.ceil(top));
          if (Math.abs(vx) < Math.abs(vy) && solidBlock(block)) {
            tx = t;
            collision = true;
            break;
          }
        }

        const minY = Math.round(bottom);
        const maxY = -Math.round(-top);
        for (let by = minY; by <= maxY; by += 1) {
          const block = world.terrain.at(nextBlock, by);
          if (solidBlock(block)) {
            tx = t;
            collision = true;
            break;
          }
        }
        if (collision) {
          break;
        }
        nextBlock += xa;
      }
    }

    let ty = Infinity;
    if (vy !== 0) {
      const hitboxEdge = y + ya * h / 2;
      let nextBlock = ya === 1 ? Math.ceil(hitboxEdge + 0.5) : Math.floor(hitboxEdge - 0.5);
      while (true) {
        let t = (nextBlock - ya * 0.5 - hitboxEdge) / vy;
        let collision = false;
        if (t > 1) {
          break;
        }
        const bottom = x - w / 2 + t * vx;
        const top = x + w / 2 + t * vx;

        if (bottom - Math.floor(bottom) === 0.5) {
          const block = world.terrain.at(nextBlock, Math.floor(bottom));
          if (Math.abs(vx) >= Math.abs(vy) && solidBlock(block)) {
            ty = t;
            collision = true;
            break;
          } 
        }
        if (top - Math.floor(top) === 0.5) {
          const block = world.terrain.at(nextBlock, Math.ceil(top));
          if (Math.abs(vx) >= Math.abs(vy) && solidBlock(block)) {
            ty = t;
            collision = true;
            break;
          }
        }

        const minX = Math.round(bottom);
        const maxX = -Math.round(-top);
        for (let bx = minX; bx <= maxX; bx += 1) {
          const block = world.terrain.at(bx, nextBlock);
          if (block != Block.Air && block != Block.Grasses) {
            ty = t;
            collision = true;
            break;
          }
        }
        if (collision) {
          break;
        }
        nextBlock += ya;
      }
    }
      
    if ((tx !== Infinity || ty!== Infinity) && vy > 0) {
      console.log(tx + ' ' + ty);
    }
    if (tx < ty) {
      if (tx < nextCollision.time) {
        nextCollision = { time: tx, id: thing.id, axis: [xa, 0] };
      }
    } else {
      if (ty < nextCollision.time) {
        nextCollision = { time: ty, id: thing.id, axis: [0, ya]};
      }
    }
  }
  return nextCollision;
}

function stepEverythingBy(time: number, world: World, exclude?: number) {
  for (const thing of world.things.values()) {
    if (thing.inertial) {
      thing.data.x += thing.data.vx * time;
      thing.data.y += thing.data.vy * time;
    }
  }
}

function processTerrainCollision(collision: TerrainCollisionEvent, world: World) {
  const thing = world.things.get(collision.id);
  if (!thing) {
    console.error("Tried to process a collision involving a nonexistent thing.");
    return;
  }
  if (!thing.inertial) {
    console.error("Tried to process a collision involving a  nonintertial thing.");
    return;
  }
  // TODO: make more complex collision interactions such as bounce
  if (collision.axis[0] !== 0) {
    thing.data.x += collision.time * thing.data.vx;
    thing.data.hittingWall = collision.axis[0] === -1 ? 'left' : 'right';
    thing.data.vx = 0;
  } else {
    thing.data.y += collision.time * thing.data.vy;
    thing.data.vy = 0;
    thing.data.onGround = collision.axis[1] === -1;
  }
  stepEverythingBy(collision.time, world, collision.id);
}

export function stepPhysics(game: Game) {
  const world = game.world;
  for (const thing of world.things.values()) {
    if (thing.onTick) {
      thing.onTick(game);
    }
  }
  const inertials: Entity[] = [];
  for (const thing of world.things.values()) {
    if (thing.inertial) {
      inertials.push(thing);
      thing.data.vy += GRAVITY;
      thing.data.onGround = false;
      thing.data.hittingWall = undefined;
    }
  }
  let timeLeft = 1.0;
  while (timeLeft > 0) {
    const nextThingCollision = getNextThingCollision(inertials);
    const nextTerrainCollision = getNextTerrainCollision(world, inertials);

    // TODO: replace
    if (nextTerrainCollision.time <= timeLeft) {
      // console.log("colliding")
      processTerrainCollision(nextTerrainCollision, world);
    } else {
      stepEverythingBy(timeLeft, world);
    }
    // TODO: update when thing collisions are enabled
    timeLeft -= nextTerrainCollision.time;
    // if (nextThingCollision.time < nextTerrainCollision.time) {
    //   processThingCollision
    // }
  }
}