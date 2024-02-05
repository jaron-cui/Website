import type { Player } from "./entity/player";
import type { Dynamite } from "./entity/dynamite";
import type { Game } from "./game";
import { SPRITE_TEXTURES } from "./render";
import { XDirection, ArmaturePiecePose, SpriteSet } from "./world";

export const DYNAMITE_FUSE_RATE = 1/18;
export const DYNAMITE_FUSE_TICK = 10;

export interface Physical {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Inertial extends Physical {
  vx: number;
  vy: number;
  mass: number;
  onGround?: boolean;
  hittingWall?: XDirection;
}

export interface Explosive extends Physical {
  explosionRadius: number;
  maxExplosionDamage: number;
}

export interface Mortal {
  mortal: true;
  health: number;
  maxHealth: number;
  damage(amount: number): void;
  heal(amount: number): void;
  onDeath(): void;
}

type EntityData = (Inertial);

export type Entity = Player | Dynamite;

export type EntityType = Entity['type'];

export abstract class BaseEntity<T extends EntityData> {
  id: number;
  data: T;
  readonly abstract type: string;
  armaturePieceSprites: Record<string, SpriteSet>;
  // temporary
  readonly inertial: true = true;
  readonly physical: true = true;

  protected abstract specifyArmatureSprites(): Record<string, string>;

  abstract getArmaturePoses(): Record<string, ArmaturePiecePose>;

  constructor(initialData: T) {
    this.id = -1;
    this.data = initialData;
    this.armaturePieceSprites = {};
    const armatureSpriteSpecification = this.specifyArmatureSprites();
    for (const armaturePiece in armatureSpriteSpecification) {
      const armaturePiecesTexture = SPRITE_TEXTURES[armatureSpriteSpecification[armaturePiece]];
      if (!armaturePiecesTexture) {
        console.error('Could not find the sprite set ' + armatureSpriteSpecification[armaturePiece]);
      }
      this.armaturePieceSprites[armaturePiece] = armaturePiecesTexture;
    }
  }

  abstract onTick(game: Game): void;
}
