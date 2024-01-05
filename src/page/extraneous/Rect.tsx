import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';

enum Block {
  Air, Grass, Stone
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

const vertexSrc = `

    precision mediump float;

    attribute vec2 aVertexPosition;
    attribute vec2 aUvs;

    varying vec2 vUvs;
    varying vec2 vPos;

    void main() {

        vUvs = aUvs;
        gl_Position = vec4(aVertexPosition, 0.0, 1.0);
        vPos = gl_Position.xy;
    }`;

const fragmentSrc = `
//Based on this: https://www.shadertoy.com/view/wtlSWX
precision mediump float;

varying vec2 vUvs;
varying vec2 vPos;
uniform sampler2D uSampler2;
uniform vec2 uScreenSize;
uniform vec2 uBlockOffset;
uniform vec2 uGridSize;
uniform int uBlockSize;
uniform int uBlockTypes;
uniform sampler2D uTerrain;

void main() {
  vec2 pixelPos = ((vPos + 1.0) * 0.5) * uScreenSize;
  //pixelPos = vec2(pixelPos.x, uScreenSize.y - pixelPos.y);

  vec2 relativePos = pixelPos - uBlockOffset;
  vec2 blockPos = relativePos / float(uBlockSize);
  vec2 c = floor(blockPos);
  if (c.x < 0.0 || c.x >= uGridSize.x || c.y < 0.0 || c.y >= uGridSize.y) {
    discard;
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  int blockType = int(255.0 * texture2D(uTerrain, c / uGridSize).a);
  if (blockType == 0) {
    discard;
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec2 subTextureOffset = blockPos - c;

  vec2 textureOffset = vec2(subTextureOffset.x, (1.0 - subTextureOffset.y + float(blockType - 1)) / float(uBlockTypes));

    gl_FragColor = vec4(texture2D(uSampler2, textureOffset));
}`;

const WORLD_WIDTH = 48;
const WORLD_HEIGHT = 16;
const world = new Terrain(WORLD_WIDTH, WORLD_HEIGHT);
for (let x = 0; x < WORLD_WIDTH; x += 1) {
  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    if (y < 15) {
      world.set(x, y, Block.Stone);
    } else if (y < 16) {
      world.set(x, y, Block.Grass);
    } else {
      world.set(x, y, Block.Air);
    }
  }
}
const worldData = PIXI.BaseTexture.fromBuffer(world.blocks, world.w, world.h, { format: PIXI.FORMATS.ALPHA, type: PIXI.TYPES.UNSIGNED_BYTE });
worldData.wrapMode = PIXI.WRAP_MODES.CLAMP;
worldData.mipmap = PIXI.MIPMAP_MODES.OFF;
worldData.scaleMode = PIXI.SCALE_MODES.NEAREST;

const SCREEN_WIDTH = 960;
const SCREEN_HEIGHT = 540;
const BLOCK_TEXTURES = PIXI.Texture.from('blocks.png');
BLOCK_TEXTURES.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
const uniforms = {
  uSampler2: BLOCK_TEXTURES,
  uScreenSize: [SCREEN_WIDTH, SCREEN_HEIGHT],
  uBlockOffset: [0, 0],
  uGridSize: [WORLD_WIDTH, WORLD_HEIGHT],
  uBlockSize: 20,
  uBlockTypes: Object.keys(Block).length / 2 - 1,
  uTerrain: worldData
};

// Make sure repeat wrap is used and no mipmapping.

// uniforms.noise.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
// uniforms.noise.baseTexture.mipmap = PIXI.MIPMAP_MODES.OFF;

// Build the shader and the quad.
const shader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms);
const quad = new PIXI.Mesh(geometry, shader);

quad.position.set(0, 0);
quad.scale.set(2);

    

function createApp() {
  const app = new PIXI.Application<HTMLCanvasElement>({ background: '#1099bb', width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
// done.. add it to stage!
// tileMesh.position.set(400, 300);
// tileMesh.scale.set(2);
app.stage.addChild(quad);
  // create a new Sprite from an image path
  const bunny = PIXI.Sprite.from('blocks.png');
  bunny.scale.set(2)
  const sprites: any[] = [];
  for (let i = 0; i < 2; i += 1) {
    const sprite = PIXI.Sprite.from('https://pixijs.com/assets/bunny.png');
    sprite.anchor.set(0.5);
    sprites.push(sprite);
    app.stage.addChild(sprite);
  }
  class Body {
    x: number;
    y: number;
    vx: number;
    vy: number;
    constructor (x: number, y: number, xv: number, yv: number) {
        this.x = x;
        this.y = y;
        this.vx = xv;
        this.vy = yv;
    }
  }
  const bodies = [new Body(app.screen.width / 2 + 50, app.screen.height / 2 + 50, -3, 0), new Body(200, 0, 0, 2.5)]

  // center the sprite's anchor point
  bunny.anchor.set(0.5);

  // move the sprite to the center of the screen
  bunny.x = app.screen.width / 2;
  bunny.y = app.screen.height / 2;

  //app.stage.addChild(bunny);

  // Listen for animate update
  app.ticker.minFPS = 40;
  app.ticker.maxFPS = 40;
  app.ticker.add((delta: number) => {
    for (let i = 0; i < bodies.length; i += 1) {
      for (let j = i + 1; j < bodies.length; j += 1) {
        const b1 = bodies[i];
        const b2 = bodies[j];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const r = Math.sqrt(dx * dx + dy * dy);
        const theta = Math.atan2(dy, dx);
        const f = 1000 / (r * r);
        const fx = f * Math.cos(theta);
        const fy = f * Math.sin(theta);
        b1.vx += fx;
        b2.vx -= fx;
        b1.vy += fy;
        b2.vy -= fy;
      }
    }
    bodies.forEach(body => {
      body.x += body.vx;
      body.y += body.vy;
      });
    // just for fun, let's rotate mr rabbit a little
    // delta is 1 if running at 100% performance
    // creates frame-independent transformation
    bunny.rotation += -.01 * delta;
    for (let i = 0; i < bodies.length; i += 1) {
      sprites[i].x = bodies[i].x;
      sprites[i].y = bodies[i].y;
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