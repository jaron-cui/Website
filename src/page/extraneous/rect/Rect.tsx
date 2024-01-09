import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';
import { fragmentShader, vertexShader } from './shaders';

enum Block {
  Air, Grass, Grasses, Stone, Soil, Placeholder
};

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
  constructor() {
    this.terrain = new Terrain(48, 20);
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
  interial: true;
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

function calculateThingCollision(thing1: Inertial, thing2: Inertial): ThingCollisionEvent {
  const { x: x1, y: y1, w: w1, h: h1, vx: vx1, vy: vy1 } = thing1;
  const { x: x2, y: y2, w: w2, h: h2, vx: vx2, vy: vy2 } = thing2;
  const dvx = vx2 - vx1;
  const dvy = vy2 - vy1;
  const xa = dvx < 0 ? 1 : -1;
  const ya = dvy < 0 ? 1 : -1;
  // x1 + xa * w1 / 2 + t * vx1 = x2 - xa * w2 / 2 + t * vx2
  // -> t = (x2 - x1 - xa * w2 / 2 - xa * w1 / 2) / (vx1 - vx2)
  const tx = dvx === 0 ? Infinity : (x2 - x1 - xa * w2 / 2 - xa * w1 / 2) / (vx1 - vx2);

  // y1 + ya * h1 / 2 + t * vy1 = y2 - ya * h2 / 2 + t * vy2
  // -> t = (y2 - y1 - ya * h2 / 2 - ya * h1 / 2) / (vy1 - vy2)
  const ty = dvy === 0 ? Infinity : (y2 - y1 - ya * h2 / 2 - ya * h1 / 2) / (vy1 - vy2);

  const t = Math.min(tx, ty);

  const axis: [number, number] = [0, 0];
  if (tx < ty) {
    axis[0] = xa;
  } else {
    axis[1] = ya;
  }
  return { time: t, id1: thing1.id, id2: thing2.id, axis };
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

function getNextTerrainCollision(world: World, inertials: Inertial[]): TerrainCollisionEvent | any {
  let nextCollision: TerrainCollisionEvent = { time: Infinity, id: -1, axis: [0, 0] };
  for (const thing of inertials) {
    const { x, y, w, h, vx, vy } = thing;
    const xa = vx < 0 ? -1 : 1;
    const ya = vy < 0 ? -1 : 1;
    let nextXBorder = xa === 1 ? Math.ceil(x + w / 2) : Math.floor(x - w / 2);
    let tx = Infinity;
    while (true) {
      let t = (nextXBorder - (x + xa * w / 2)) / vx;
     // const sad = 0;
    }
  }
}

function stepPhysics(world: World) {
  const inertials: Inertial[] = [];
  for (const thing of world.things.values()) {
    if (inertial(thing)) {
      inertials.push(thing);
    }
  }
  let timeLeft = 1.0;
  while (timeLeft > 0) {
    const nextThingCollision = getNextThingCollision(inertials);
    const nextTerrainCollision = getNextTerrainCollision(world, inertials);

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

// const shader = PIXI.Shader.from(`
//   precision mediump float;
//   void main() {
//       // Vertex shader output
//       gl_Position = vec4(position, 0.0, 1.0);
//   }`, `
//   precision mediump float;
//   //attribute vec2 position;
//   //varying vec2 vUvs;

//   //uniform sampler2D uSampler2;

//   void main() {
//     //gl_Position = vec4(position, 0.0, 0.0);
//     gl_FragColor = vec4(position, 0.0, 1.0);
//   }

// `,
// {
//     //uSampler2: PIXI.Texture.from('blocks.png'),
// });

// const geometry = new PIXI.Geometry()
//     .addAttribute('position', [-100, -100, // x, y
//     100, -100, // x, y
//     100, 100,
//     -100, 100], 2);

//     const tileMesh = new PIXI.Mesh(geometry, shader);
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
const WORLD_HEIGHT = 20;
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

const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 540;
const BLOCK_TEXTURES = PIXI.Texture.from('blocks2.png');
BLOCK_TEXTURES.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
const uniforms = {
  uBlockTextures: BLOCK_TEXTURES,
  uScreenSize: [SCREEN_WIDTH, SCREEN_HEIGHT],
  uBlockOffset: [0, 0],
  uGridSize: [WORLD_WIDTH, WORLD_HEIGHT],
  uBlockSize: 20,
  uBlockTypes: Object.keys(Block).length / 2 - 1,
  uTerrain: worldData,
  wind: 0
};
// Build the shader and the quad.
const shader = PIXI.Shader.from(vertexShader, fragmentShader, uniforms);
const quad = new PIXI.Mesh(geometry, shader);

quad.position.set(0, 0);
quad.scale.set(2);

function createApp() {
  const app = new PIXI.Application<HTMLCanvasElement>({ background: '#1099bb', width: SCREEN_WIDTH, height: SCREEN_HEIGHT });

  app.stage.addChild(quad);
  let t = 0;
  // Listen for animate update
  app.ticker.minFPS = 40;
  app.ticker.maxFPS = 40;
  app.ticker.add((delta: number) => {
    t += 1;
    quad.shader.uniforms.wind = Math.sin(t / 30) * 2.2;
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