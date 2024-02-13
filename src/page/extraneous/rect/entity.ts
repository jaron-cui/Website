import type { Player } from "./entity/player";
import type { Dynamite } from "./entity/dynamite";
import type { Game } from "./game";
import { SPRITE_TEXTURES } from "./render";
import { XDirection, ArmaturePiecePose, SpriteSet } from "./world";

export const DYNAMITE_FUSE_RATE = 1/18;
export const DYNAMITE_FUSE_TICK = 10;

export type Physical = {
  implements: {
    physical: true
  },
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Inertial = Physical & {
  implements: {
    inertial: true
  },
  vx: number;
  vy: number;
  mass: number;
  netForce: [number, number];
  // coefficient of friction
  // this will be averaged with that of colliding surface
  surfaceFriction?: number;
  airFriction?: number;

  onGround?: boolean;
  hittingWall?: XDirection;
}

export type Explosive = Physical & {
  implements: {
    explosive: true
  }
  explosionRadius: number;
  maxExplosionDamage: number;
}

export type Mortal = {
  implements: {
    mortal: true
  },
  health: number;
  maxHealth: number;
}

export namespace EntityType {
  export function physical(entity: EntityData): entity is Physical {
    return (entity as any).implements.physical;
  }
  export function inertial(entity: EntityData): entity is Inertial {
    return (entity as any).implements.inertial;
  }
  export function explosive(entity: EntityData): entity is Explosive {
    return (entity as any).implements.explosive;
  }
  export function mortal(entity: EntityData): entity is Mortal {
    return (entity as any).implements.mortal;
  }
}

export type EntityData = Physical | Inertial | Explosive | Mortal;

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
