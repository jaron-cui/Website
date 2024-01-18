import { distance } from "./physics";
import { AnimatedEntity } from "./render";
import { Inertial, Explosive, ArmaturePiecePose, World, Block, explosive, mortal } from "./world";

abstract class InertialAnimatedEntity extends AnimatedEntity implements Inertial {
  id: number;

  w: number;
  h: number;

  mass: number;
  vx: number;
  vy: number;

  physical: true;
  inertial: true;

  constructor(id: number, x: number, y: number, w: number, h: number, mass: number) {
    super(x, y);
    this.id = id;
    this.w = w;
    this.h = h;
    this.mass = mass;
    this.vx = 0;
    this.vy = 0;
    this.physical = true;
    this.inertial = true;
  }
}

export class Dynamite extends InertialAnimatedEntity implements Explosive {
  explosionRadius: number;
  maxExplosionDamage: number;

  explosive: true;

  fuse: number;

  constructor(id: number, x: number, y: number) {
    super(id, x, y, 1, 1, 1);

    this.explosionRadius = 3;
    this.maxExplosionDamage = 50;

    this.explosive = true;

    this.fuse = 5;
  }

  protected specifyArmatureSprites(): Record<string, string> {
    return {
      body: 'dynamite-sprites'
    };
  }

  getArmaturePoses(): Record<string, ArmaturePiecePose> {
    return {
      body: {
        animation: 'ignition',
        frame: this.fuse
      }
    };
  }

  detonate(): void {
    throw new Error('Method not implemented.');
  }
}

type Direction = 'left' | 'right';

export class Player extends InertialAnimatedEntity {
  walkStage: number;

  walking?: Direction;

  constructor(id: number, x: number, y: number) {
    super(id, x, y, 1, 2, 1);
    this.walkStage = 0;
  }

  protected specifyArmatureSprites(): Record<string, string> {
    return {
      legs: 'player-legs'
    }
  }

  getArmaturePoses(): Record<string, ArmaturePiecePose> {
    return {
      legs: {
        animation: 'walk',
        frame: this.walking === 'right' ? Math.floor(this.walkStage / 2) : 0
      }
    }
  }

  onTick() {
    this.walkStage += 1;
    this.walkStage %= 14;
  }
}

function handleDetonation(detonated: Explosive, world: World) {
  const { x, y, explosionRadius, maxExplosionDamage } = detonated;

  // delete the detonated thing
  world.things.delete(detonated.id);

  const { terrain, things } = world;
  // handle effect on terrain
  for (let bx = x - explosionRadius; bx <= x + explosionRadius; bx += 1) {
    for (let by = y - explosionRadius; by <= y + explosionRadius; by += 1) {
      // distance from explosion to block
      const d = distance([x, y], [bx, by]);
      if (d > explosionRadius) {
        continue;
      }
      // destroy sufficiently damaged blocks
      const damage = (1 - d / explosionRadius) * maxExplosionDamage;
      const block = terrain.at(bx, by);
      if (block !== Block.Air && damage > 10) {
        terrain.set(bx, by, Block.Air);
      }
    }
  }
  // handle effect on things
  for (const thing of things.values()) {
    const d = distance([x, y], [thing.x, thing.y]);
    if (d > explosionRadius) {
      continue;
    }
    const damage = (1 - d / explosionRadius) * maxExplosionDamage;
    // detonate other explosives in range
    if (damage > 10 && explosive(thing)) {
      thing.detonate();
    }
    if (mortal(thing)) {
      thing.damage(damage);
    }
  }
}
