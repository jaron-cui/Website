import * as PIXI from 'pixi.js';

export const WORLD_WIDTH = 48;
export const WORLD_HEIGHT = 32;

export enum Block {
  Air, Grass, Grasses, Stone, Soil, Placeholder
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
  things: Map<number, Physical | Inertial | Renderable>;
  constructor(terrain: Terrain) {
    this.terrain = terrain;
    this.things = new Map();
  }
}

export interface Physical {
  physical: true;
  x: number;
  y: number;
  w: number;
  h: number;
  id: number;
  onTick?: () => void;
}

export function physical(thing: any): thing is Physical {
  return thing.physical;
}

export type XDirection = 'left' | 'right';

export interface Inertial extends Physical {
  inertial: true;
  mass: number;
  vx: number;
  vy: number;
  onGround?: boolean;
  hittingWall?: XDirection;
}

export function inertial(thing: any): thing is Inertial {
  return thing.inertial;
}

export interface Explosive extends Physical {
  explosive: true;
  explosionRadius: number;
  maxExplosionDamage: number;
  detonate(): void;
}

export function explosive(thing: any): thing is Explosive {
  return thing.explosive;
}

export interface Mortal {
  mortal: true;
  health: number;
  maxHealth: number;
  damage(amount: number): void;
  heal(amount: number): void;
  onDeath(): void;
}

export function mortal(thing: any): thing is Mortal {
  return thing.mortal;
}

export interface Renderable {
  x: number;
  y: number;
  renderable: true;
  armaturePieceSprites: Record<string, SpriteSet>;
  getArmaturePoses(): Record<string, ArmaturePiecePose>;
}

export function renderable(thing: any): thing is Renderable {
  return thing.renderable;
}

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
