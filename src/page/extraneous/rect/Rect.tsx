import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';
import { fragmentShader, vertexShader } from './shaders';

enum Block {
  Air, Grass, Grasses, Stone, Soil, Placeholder
};

enum SpriteTextures {
  
}

// represents a 2D grid-based terrain
class Terrain {
  blocks: Uint8Array;
  w: number;
  h: number;
  constructor(width: number, height: number) {
    this.blocks = new Uint8Array(width * height);
    this.w = width;
    this.h = height;
  }
  
  at(x: number, y: number) {
    return this.blocks[y * this.w + x];
  }

  set(x: number, y: number, value: number) {
    this.blocks[y * this.w + x] = value;
  }
}

class World {
  terrain: Terrain;
  things: Map<number, Physical>;
  constructor(terrain: Terrain) {
    this.terrain = terrain;
    this.things = new Map();
  }
}

const BLOCK_TEXTURE_SCHEMA = {
  frames: {
    0: {
      frame: { x: 0, y: 0, w: 8, h: 8 },
      sourceSize: { w: 8, h: 8 },
      spriteSourceSize: { x: 0, y: 0, w: 8, h: 8 }
    }
  },
  meta: {
    image: 'blocks.png',
    format: 'RGBA8888',
    size: { w: 8, h: 16 },
    scale: 2
  }
};

interface Physical {
  physical: true;
  x: number;
  y: number;
  w: number;
  h: number;
  id: number;
}

function physical(thing: any): thing is Physical {
  return thing.physical;
}

interface Inertial extends Physical {
  inertial: true;
  mass: number;
  vx: number;
  vy: number;
}

function inertial(thing: any): thing is Inertial {
  return thing.inertial;
}

interface Explosive extends Physical {
  explosive: true;
  explosionRadius: number;
  maxExplosionDamage: number;
  detonate(): void;
}

function explosive(thing: any): thing is Explosive {
  return thing.explosive;
}

interface Mortal {
  mortal: true;
  health: number;
  maxHealth: number;
  damage(amount: number): void;
  heal(amount: number): void;
  onDeath(): void;
}

function mortal(thing: any): thing is Mortal {
  return thing.mortal;
}

interface Renderable {
  renderable: true;
  pieces: Map<string, AnimationFrames>;
  getPose(): Map<string, ArmaturePiecePose>;
}

function renderable(thing: any): thing is Renderable {
  return thing.renderable;
}

function range(length: number) {
  return Array(length).fill(0).map((_, i) => i);
}

interface ArmaturePiecePose {
  rx?: number;
  ry?: number;
  degreeRotation?: number;
  scale?: number;
  animation: string;
  frame: number;
}

class AnimationFrames {
  frames: PIXI.Texture[];
  animations: string[];
  animationOffsets: Map<string, number>;

  constructor(animations: Record<string, PIXI.Texture[]>) {
    this.frames = [];
    this.animations = Object.keys(animations);
    this.animationOffsets = new Map();
    for (const animationName of this.animations) {
      this.animationOffsets.set(animationName, this.frames.length);
      this.frames.push(...animations[animationName]);
    }
  }

  getFrameIndex(animation: string, frame: number) {
    const offset = this.animationOffsets.get(animation);
    return offset === undefined ? 0 : offset + frame;
  }
}

const DYNAMITE_TEXTURE_SCHEMA = {
  frames: Object.fromEntries(
    range(12).map(i => ['' + i, {
      frame: {x: 9 * i, y: 0, w: 9, h: 18},
      spriteSourceSize: {x: 9 * i, y: 0, w: 9, h: 18},
      sourceSize: {w: 9, h: 18}
    }])
  ),
  animations: {
    ignition: range(12).map(i => '' + i)
  },
  meta: {
    image: 'dynamite.png',
    format: 'RGBA8888',
    size: {w: 108, h: 18},
    scale: '1'
  }
}

// EXAMPLE OF SPRITE RIGGING WITH ANIMATION
const DYNAMITE_RIG: Renderable & { fuse: number } = {
  fuse: 0,
  pieces: new Map([
    ['dynamite', new AnimationFrames(
      new PIXI.Spritesheet(
        PIXI.BaseTexture.from(DYNAMITE_TEXTURE_SCHEMA.meta.image),
        DYNAMITE_TEXTURE_SCHEMA
      ).animations
    )]
  ]),
  getPose(): Map<string, ArmaturePiecePose> {
    return new Map([
      ['dynamite', {
        animation: 'ignition',
        frame: this.fuse
      }]
    ]);
  },
  renderable: true
}

function distance(a: [number, number], b: [number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
}

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

function calculateThingCollision(thing1: Inertial, thing2: Inertial): ThingCollisionEvent {
  const { x: x1, y: y1, w: w1, h: h1, vx: vx1, vy: vy1 } = thing1;
  const { x: x2, y: y2, w: w2, h: h2, vx: vx2, vy: vy2 } = thing2;
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
      tx = Infinity;
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
      ty = Infinity;
    }
  }

  const axis: [number, number] = [0, 0];
  if (tx < ty) {
    axis[0] = xa;
  } else {
    axis[1] = ya;
  }
  return { time: Math.min(tx, ty), id1: thing1.id, id2: thing2.id, axis };
}

function getNextThingCollision(inertials: Inertial[]): ThingCollisionEvent {
  let nextCollision: ThingCollisionEvent = { time: Infinity, id1: -1, id2: -1, axis: [0, 0] };
  for (let i = 0; i < inertials.length; i += 1) {
    const thing1 = inertials[i];
    for (let j = i + 1; j < inertials.length; j += 1) {
      const thing2 = inertials[j];
      const collision = calculateThingCollision(thing1, thing2);
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

function getNextTerrainCollision(world: World, inertials: Inertial[]): TerrainCollisionEvent {
  let nextCollision: TerrainCollisionEvent = { time: Infinity, id: -1, axis: [0, 0] };
  for (const thing of inertials) {
    const { x, y, w, h, vx, vy } = thing;
    const xa = vx < 0 ? -1 : 1;
    const ya = vy < 0 ? -1 : 1;
    let nextXBorder = xa === 1 ? Math.ceil(x + w / 2) : Math.floor(x - w / 2);
    let tx = Infinity;
    while (true) {
      let t = (nextXBorder - (x + xa * w / 2)) / vx;
      if (t > 1) {
        break;
      }
      // TODO: there is going to be some assymetry into how block corner collisions are handled
      // Fix this by explicity handling the 0.5 case, for which round has a 50/50 variability
      const bottom = y - h / 2 + t * vy;
      const top = y + h / 2 + t * vy;
      const minY = Math.round(bottom);
      const maxY = Math.round(top);
      let collision = false;
      for (let by = minY; by <= maxY; by += 1) {
        const block = world.terrain.at(nextXBorder, by);
        if (block != Block.Air && block != Block.Grasses) {
          tx = t;
          console.log("colliding with " + block);
          collision = true;
          break;
        }
      }
      if (collision) {
        break;
      }
      nextXBorder += xa;
    }

    let nextYBorder = ya === 1 ? Math.ceil(y + h / 2) : Math.floor(y - h / 2);
    let ty = Infinity;
    while (true) {
      let t = (nextYBorder - (y + ya * h / 2)) / vy;
      if (t > 1) {
        break;
      }
      // TODO: there is going to be some assymetry into how block corner collisions are handled
      // Fix this by explicity handling the 0.5 case, for which round has a 50/50 variability
      const bottom = x - w / 2 + t * vx;
      const top = x + w / 2 + t * vx;
      const minX = Math.round(bottom);
      const maxX = Math.round(top);
      let collision = false;
      for (let bx = minX; bx <= maxX; bx += 1) {
        const block = world.terrain.at(bx, nextYBorder);
        if (block === undefined) {
          console.log("undefined " + bx + ", " + nextYBorder)
        }
        if (block != Block.Air && block != Block.Grasses) {
          ty = t;
          console.log("colliding y with " + block + " at " + bx + ", " + nextYBorder);
          collision = true;
          break;
        }
      }
      if (collision) {
        break;
      }
      nextYBorder += ya;
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
    if (inertial(thing)) {
      thing.x += thing.vx * time;
      thing.y += thing.vy * time;
    }
  }
}

function processTerrainCollision(collision: TerrainCollisionEvent, world: World) {
  const thing = world.things.get(collision.id);
  if (!thing || !inertial(thing)) {
    console.error("Tried to process a collision involving a nonexistent or nonintertial thing.");
    return;
  }
  // TODO: make more complex collision interactions such as bounce
  if (collision.axis[0] !== 0) {
    thing.x += collision.time * thing.vx;
    thing.vx = 0;
  } else {
    thing.y += collision.time * thing.vy;
    thing.vy = 0;
  }
  stepEverythingBy(collision.time, world, collision.id);
} 

function stepPhysics(world: World) {
  const inertials: Inertial[] = [];
  for (const thing of world.things.values()) {
    if (inertial(thing)) {
      inertials.push(thing);
      thing.vy -= 0.08;
      // console.log(JSON.stringify(thing));
      world.things.set(thing.id, thing);
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


// Create the SpriteSheet from data and image
const spritesheet = new PIXI.Spritesheet(
  PIXI.BaseTexture.from(BLOCK_TEXTURE_SCHEMA.meta.image),
  BLOCK_TEXTURE_SCHEMA
);

// Generate all the Textures asynchronously
spritesheet.parse().then(() => {
  console.log('done');
  // Create a new Sprite from the Texture
  const block = new PIXI.Sprite(spritesheet.textures['0']);
  block.scale.set(2);
  block.x = 0;
  block.y = 0;
  //app.stage.addChild(block);
});

const geometry = new PIXI.Geometry()
    .addAttribute('aVertexPosition', // the attribute name
        [-1, -1, // x, y
            1, -1, // x, y
            1, 1,
            -1, 1], // x, y
        2) // the size of the attribute
    .addAttribute('aUvs', // the attribute name
        [0, 0, // u, v
            1, 0, // u, v
            1, 1,
            0, 1], // u, v
        2) // the size of the attribute
    .addIndex([0, 1, 2, 0, 2, 3]);

const WORLD_WIDTH = 48;
const WORLD_HEIGHT = 32;
const WORLD = new Terrain(WORLD_WIDTH, WORLD_HEIGHT);
for (let x = 0; x < WORLD_WIDTH; x += 1) {
  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    if (y < 10) {
      WORLD.set(x, y, Block.Soil);
    } else if (y < 15) {
      WORLD.set(x, y, Block.Stone);
    } else if (y < 16) {
      WORLD.set(x, y, Block.Grass);
    } else if (y < 17) {
      WORLD.set(x, y, Block.Grasses);
    } else {
      WORLD.set(x, y, Block.Air);
    }
  }
}
const worldData = PIXI.BaseTexture.fromBuffer(WORLD.blocks, WORLD.w, WORLD.h, { format: PIXI.FORMATS.ALPHA, type: PIXI.TYPES.UNSIGNED_BYTE });
worldData.wrapMode = PIXI.WRAP_MODES.CLAMP;
worldData.mipmap = PIXI.MIPMAP_MODES.OFF;
worldData.scaleMode = PIXI.SCALE_MODES.NEAREST;

function convertTerrainDataToTexture(terrain: Terrain): PIXI.BaseTexture<PIXI.BufferResource, PIXI.IAutoDetectOptions> {
  const data = PIXI.BaseTexture.fromBuffer(terrain.blocks, terrain.w, terrain.h, { format: PIXI.FORMATS.ALPHA, type: PIXI.TYPES.UNSIGNED_BYTE });
  data.wrapMode = PIXI.WRAP_MODES.CLAMP;
  data.mipmap = PIXI.MIPMAP_MODES.OFF;
  data.scaleMode = PIXI.SCALE_MODES.NEAREST;
  return data;
}

const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 540;

function createInitialUniforms() {
  const blockTextures = PIXI.Texture.from('blocks2.png');
  blockTextures.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  return {
    uBlockTextures: blockTextures,
    uScreenSize: [SCREEN_WIDTH, SCREEN_HEIGHT],
    uBlockOffset: [0, 0],
    uGridSize: [WORLD_WIDTH, WORLD_HEIGHT],
    uBlockSize: 20,
    uBlockTypes: Object.keys(Block).length / 2 - 1,
    uTerrain: null,
    wind: 0
  };
}

class Armature {
  x!: number;
  y!: number;
  pieces: Map<string, PIXI.Sprite>;

  constructor(x: number, y: number, template: Map<string, AnimationFrames>, app: PIXI.Application<HTMLCanvasElement>) {
    this.pieces = new Map<string, PIXI.Sprite>();
    for (const [name, animationFrames] of template.entries()) {
      const sprite = new PIXI.AnimatedSprite(animationFrames.frames);
      this.pieces.set(name, sprite);
      app.stage.addChild(sprite);
    }
    // initial default pose
    this.pose(x, y, new Map([...[...template.entries()].map(entry => [entry[0], {
      rx: 0,
      ry: 0,
      animation: entry[1].animations[0],
      frame: 0
    }] as [string, ArmaturePiecePose])]));
  }

  pose(x: number, y: number, poses: Map<string, ArmaturePiecePose>) {
    this.x = x;
    this.y = y;
    for (const [id, pose] of poses) {
      const piece = this.pieces.get(id);
      if (!piece) {
        continue;
      }
      piece.x = pose.rx === undefined ? piece.x : (this.x + pose.rx + 1) * 20;
      piece.y = pose.ry === undefined ? piece.y : SCREEN_HEIGHT - (this.y + pose.ry + 1) * 20;
    }
  }

  // TODO: implement
  // deleteSprites() {
    
  // }
}

class Renderer {
  app: PIXI.Application<HTMLCanvasElement>;

  time: number;
  world: World;
  terrainLayer: PIXI.Mesh<PIXI.Shader>;
  entityArmatures: Map<number, Armature>;

  constructor(world: World, app: PIXI.Application<HTMLCanvasElement>) {
    this.app = app;
    this.world = world;

    this.time = 0;

    const shader = PIXI.Shader.from(vertexShader, fragmentShader, createInitialUniforms());
    this.terrainLayer = new PIXI.Mesh(geometry, shader);
    this.terrainLayer.position.set(0, 0);
    this.terrainLayer.scale.set(2);
    this.app.stage.addChild(this.terrainLayer);

    this.entityArmatures = new Map();
  }

  updateTerrain() {
    this.terrainLayer.shader.uniforms.uTerrain = convertTerrainDataToTexture(this.world.terrain);
  }

  updateEntities() {
    for (const i of this.entityArmatures.keys()) {
      const thing = this.world.things.get(i);
      if (!thing) {
        this.entityArmatures.delete(i);
        // TODO: delete unused sprites after
        continue;
      }
      if (!renderable(thing)) {
        continue;
      }
      let armature = this.entityArmatures.get(i);
      if (!armature) {
        armature = new Armature(thing.x, thing.y, thing.pieces, this.app);
        this.entityArmatures.set(i, armature);
      }
      armature.pose(thing.x, thing.y, thing.getPose());
    }
  }

  updateAmbient() {
    this.time += 1;
    this.terrainLayer.shader.uniforms.wind = Math.sin(this.time / 30) * 2.2;
  }
}

function createApp() {
  const app = new PIXI.Application<HTMLCanvasElement>({ background: '#1099bb', width: SCREEN_WIDTH, height: SCREEN_HEIGHT });

  // app.stage.addChild(quad);
  let t = 0;
  // Listen for animate update
  app.ticker.minFPS = 40;
  app.ticker.maxFPS = 40;

  const world = new World(WORLD);
  world.things.set(0, {...DYNAMITE_RIG, x: 10, y: 20, w: 1, h: 1, physical: true, id: 0});
  const obj: Inertial = {
    inertial: true,
    physical: true,
    id: 0,
    x: 10,
    y: 26,
    vx: 0,
    vy: 0,
    w: 1,
    h: 2,
    mass: 1
  }
  world.things.set(0, obj);

  const sprite = PIXI.Sprite.from('https://pixijs.com/assets/bunny.png');
  sprite.anchor.set(0.5);
  app.stage.addChild(sprite);

  const renderer = new Renderer(world, app);
  renderer.updateTerrain();

  app.ticker.add((delta: number) => {
    t += 1;
    renderer.updateAmbient();
    //quad.shader.uniforms.wind = Math.sin(t / 30) * 2.2;
    stepPhysics(world);
    sprite.x = (world.things.get(0)?.x as number + 1) * 20;
    sprite.y = SCREEN_HEIGHT - (world.things.get(0)?.y as number + 1) * 20;
    if (t % 100 === 0) {
      (world.things.get(0) as Inertial).vy = 1;
    }
  });
  return app;
};

export const Rect = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const myDomElement = createApp().view;

    if (ref.current) {
      ref.current.appendChild(myDomElement);
    }
  }, []);

  return <div ref={ref}></div>;
}