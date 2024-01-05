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
    if (y < 15) {
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