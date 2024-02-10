import * as PIXI from 'pixi.js';
import { Entity } from './entity';

export const WORLD_WIDTH = 64;
export const WORLD_HEIGHT = 64;

export enum Block {
  Air, Grass, Grasses, Stone, Soil, Sand, Brick
};

// represents a 2D grid-based terrain
export class Terrain {
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

export class World {
  terrain: Terrain;
  things: Map<number, Entity>;
  constructor(terrain: Terrain) {
    this.terrain = terrain;
    this.things = new Map();
  }
}

export type XDirection = 'left' | 'right';

export class SpriteSet {
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

export interface ArmaturePiecePose {
  rx?: number;
  ry?: number;
  degreeRotation?: number;
  scaleX?: number;
  scaleY?: number;
  animation: string;
  frame: number;
}
