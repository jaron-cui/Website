import { mod } from "../../../util/util";
import type { Game } from "./game";
import type { PlayerInventory } from "./item";
import { GRAVITY, distance } from "./physics";
import { DYNAMITE_FUSE_STATES, SPRITE_TEXTURES } from "./render";
import { XDirection, ArmaturePiecePose, World, Block, SpriteSet } from "./world";

// abstract class InertialAnimatedEntity extends AnimatedEntity implements Inertial {
//   id: number;

//   w: number;
//   h: number;

//   mass: number;
//   vx: number;
//   vy: number;

//   physical: true;
//   inertial: true;

//   onGround?: boolean;
//   hittingWall?: XDirection | undefined;

//   constructor(id: number, x: number, y: number, w: number, h: number, mass: number) {
//     super(x, y);
//     this.id = id;
//     this.w = w;
//     this.h = h;
//     this.mass = mass;
//     this.vx = 0;
//     this.vy = 0;
//     this.physical = true;
//     this.inertial = true;
//   }
// }

export const DYNAMITE_FUSE_RATE = 1/18;
export const DYNAMITE_FUSE_TICK = 10;

// BEGIN EXPERIMENTS
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

abstract class BaseEntity<T extends EntityData> {
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

interface PlayerData extends Inertial {
  walkStage: number;

  walking: XDirection | undefined;
  facing: XDirection;
  jumping: boolean;

  jumpBuffer: number;
  coyoteTimer: number;

  inventory: PlayerInventory;
}

export class Player extends BaseEntity<PlayerData> {
  type: 'player' = 'player';
  constructor(x: number, y: number) {
    super({
      x: x,
      y: y,
      w: 0.875,
      h: 2,
      vx: 0,
      vy: 0,
      mass: 1,
      walkStage: 0,
      walking: undefined,
      facing: 'right',
      jumping: false,
      jumpBuffer: 0,
      coyoteTimer: 0,
      inventory: {
        selected: 0,
        slots: [undefined, undefined, undefined, undefined, undefined]
      }
    });
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
        frame: this.data.walking && this.data.onGround ? Math.floor(this.data.walkStage) : 0,
        scaleX: this.data.facing === 'right' ? 1 : -1
      }
    }
  }

  onTick() {
    this.data.walkStage += Math.abs(this.data.vx) * 8;
    this.data.walkStage %= 7;
    // wall jump handling should come before jump handling
    this.handleWallJump();
    this.handleJump();
    this.handleWalk();
  }

  private handleWallJump() {
    if (this.data.hittingWall && this.data.jumping && this.data.jumpBuffer === 0 && !this.data.onGround) {
      this.data.vx = this.data.hittingWall === 'left' ? WALL_JUMP_SPEED : -WALL_JUMP_SPEED;
      this.data.vy = JUMP_SPEED;
    }
  }

  private handleWalk() {
    if (this.data.walking === 'right') {
      // walk right
      this.data.vx = Math.min(this.data.vx + WALK_ACCELERATION, MAX_WALK_SPEED);
      this.data.facing = 'right';
    } else if (this.data.walking === 'left') {
      // walk left
      this.data.vx = Math.max(this.data.vx - WALK_ACCELERATION, -MAX_WALK_SPEED);
      this.data.facing = 'left';
    } else if (!this.data.walking && this.data.vx !== 0) {
      // friction
      const friction = this.data.onGround ? GROUND_FRICTION : AIR_FRICTION;
      if (this.data.vx > 0) {
        this.data.vx = Math.max(0, this.data.vx - friction);
      } else {
        this.data.vx = Math.min(0, this.data.vx + friction);
      }
    }
  }

  private handleJump() {
    // handle coyote timer and jump buffer
    this.data.coyoteTimer = this.data.onGround ? COYOTE_TIMER_TICKS : Math.max(0, this.data.coyoteTimer - 1);
    this.data.jumpBuffer = this.data.jumping ? JUMP_BUFFER_TICKS : Math.max(0, this.data.jumpBuffer - 1);
    // handle jump initiation
    if (this.data.jumpBuffer && this.data.coyoteTimer > 0) {
      this.data.vy = JUMP_SPEED;
      // if the player jumps while walking, boost them in that direction
      if (this.data.walking === 'right') {
        this.data.vx = Math.min(MAX_WALK_SPEED, this.data.vx + JUMP_WALK_BOOST);
      } else if (this.data.walking === 'left') {
        this.data.vx = Math.max(-MAX_WALK_SPEED, this.data.vx - JUMP_WALK_BOOST);
      }
    }
    // the player stays in the air longer if they hold the jump key or slide against a wall
    let verticalFriction = 0;
    if (this.data.jumping && !this.data.onGround) {
      verticalFriction = JUMP_HOLDING;
    }
    if (this.data.hittingWall && this.data.vy < 0 && !this.data.onGround) {
      verticalFriction = Math.max(verticalFriction, WALL_FRICTION);
    }
    this.data.vy += verticalFriction;
  }
}

interface DynamiteData extends Inertial {
  explosionRadius: number;
  maxExplosionDamage: number;

  fuse: number;
  fuseTick: number;
}

export class Dynamite extends BaseEntity<DynamiteData> {
  type: 'dynamite' = 'dynamite';

  constructor(x: number, y: number, fuse?: number, fuseTick?: number) {
    super({
      explosionRadius: 3,
      maxExplosionDamage: 50,
      fuse: fuse === undefined ? 1 : fuse,
      fuseTick: fuseTick === undefined ? DYNAMITE_FUSE_TICK : fuseTick,
      vx: 0,
      vy: 0,
      mass: 1,
      x: x,
      y: y,
      w: 0.5,
      h: 1
    });
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
        frame: Math.floor(DYNAMITE_FUSE_STATES * (1 - this.data.fuse))
      }
    };
  }

  onTick(game: Game) {
    this.data.fuseTick = mod(this.data.fuseTick - 1, DYNAMITE_FUSE_TICK);
    if (this.data.fuseTick === 0) {
      if (this.data.fuse > 0){
        this.data.fuse -= DYNAMITE_FUSE_RATE;
        return;
      }
    }
    if (this.data.fuse <= 0) {
      handleDetonation(this.id, this.data, game);
    }
  }
}

const d: Entity = (0 as any) as Entity;

// END EXPERIMENTS
const JUMP_BUFFER_TICKS = 2;
const COYOTE_TIMER_TICKS = 3;
const JUMP_SPEED = 0.4;
const JUMP_HOLDING = GRAVITY * -0.4;
const JUMP_WALK_BOOST = 0.1;

const MAX_WALK_SPEED = 0.2;
const WALK_ACCELERATION = 0.02;
const GROUND_FRICTION = 0.04;
const AIR_FRICTION = 0.005;
const WALL_FRICTION = GRAVITY * -0.9;
const WALL_JUMP_SPEED = JUMP_SPEED * 0.6;

export function handleDetonation(id: number, data: Explosive, game: Game) {
  const { x, y, explosionRadius, maxExplosionDamage } = data;

  // delete the detonated thing
  game.world.things.delete(id);

  const { terrain, things } = game.world;
  // handle effect on terrain
  for (let bx = Math.floor(x - explosionRadius); bx <= x + explosionRadius; bx += 1) {
    for (let by = Math.floor(y - explosionRadius); by <= y + explosionRadius; by += 1) {
      // distance from explosion to block
      const d = distance([x, y], [bx, by]);
      if (d > explosionRadius) {
        continue;
      }
      // destroy sufficiently damaged blocks
      const damage = (1 - d / explosionRadius) * maxExplosionDamage;
      const block = terrain.at(bx, by);
      if (block !== Block.Air && damage > 10) {
        game.setBlock(bx, by, Block.Air);
      }
    }
  }
  // handle effect on things
  // for (const thing of things.values()) {
  //   if (!physical(thing)) {
  //     continue;
  //   }
  //   const d = distance([x, y], [thing.x, thing.y]);
  //   if (d > explosionRadius) {
  //     continue;
  //   }
  //   const damage = (1 - d / explosionRadius) * maxExplosionDamage;
  //   // detonate other explosives in range
  //   if (damage > 10 && explosive(thing)) {
  //     thing.detonate();
  //   }
  //   if (mortal(thing)) {
  //     thing.damage(damage);
  //   }
  // }
}
