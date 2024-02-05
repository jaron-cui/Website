import { mod } from "../../../util/util";
import { PLAYER_LOGIC, PlayerE } from "./entity/player";
import type { Game } from "./game";
import type { PlayerInventory } from "./item";
import { GRAVITY, distance } from "./physics";
import { AnimatedEntity, DYNAMITE_FUSE_STATES } from "./render";
import { Inertial, XDirection, Explosive, ArmaturePiecePose, World, Block, explosive, mortal, physical } from "./world";

abstract class InertialAnimatedEntity extends AnimatedEntity implements Inertial {
  id: number;

  w: number;
  h: number;

  mass: number;
  vx: number;
  vy: number;

  physical: true;
  inertial: true;

  onGround?: boolean;
  hittingWall?: XDirection | undefined;

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

export const DYNAMITE_FUSE_RATE = 1/18;
export const DYNAMITE_FUSE_TICK = 10;
export class Dynamite extends InertialAnimatedEntity implements Explosive {
  explosionRadius: number;
  maxExplosionDamage: number;

  explosive: true;

  fuse: number;
  fuseTick: number;

  constructor(x: number, y: number, fuse?: number, fuseTick?: number) {
    super(0, x, y, 0.5, 1, 1);

    this.explosionRadius = 3;
    this.maxExplosionDamage = 50;

    this.explosive = true;

    this.fuse = fuse === undefined ? 1 : fuse;
    this.fuseTick = fuseTick === undefined ? DYNAMITE_FUSE_TICK : fuseTick;
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
        frame: Math.floor(DYNAMITE_FUSE_STATES * (1 - this.fuse))
      }
    };
  }

  onTick(game: Game) {
    this.fuseTick = mod(this.fuseTick - 1, DYNAMITE_FUSE_TICK);
    if (this.fuseTick === 0) {
      if (this.fuse > 0){
        this.fuse -= DYNAMITE_FUSE_RATE;
        return;
      }
    }
    if (this.fuse <= 0) {
      handleDetonation(this, game);
    }
  }

  detonate(): void {
    throw new Error('Method not implemented.');
  }
}

// BEGIN EXPERIMENTS
interface Physical {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Inertiall extends Physical {
  vx: number;
  vy: number;
  mass: number;
  onGround?: boolean;
  hittingWall?: XDirection;
}

type EntityData = Inertiall;

type Entityy = Playerr | Dynamitee;

type EntityTypee = Entityy['type'];

abstract class BaseEntity<T extends EntityData> {
  data: T;
  readonly abstract type: string;
  // temporary
  readonly inertial: true = true;
  readonly physical: true = true;

  constructor(initialData: T) {
    this.data = initialData;
  }

  abstract onTick(game: Game): void;
}

interface PlayerData extends Inertiall {
  walkStage: number;

  walking: XDirection | undefined;
  facing: XDirection;
  jumping: boolean;

  jumpBuffer: number;
  coyoteTimer: number;

  inventory: PlayerInventory;
}

interface DynamiteData extends Inertiall {
  fuse: number;
  fuseTick: number;
}

class Playerr extends BaseEntity<PlayerData> {
  type: 'player' = 'player';
  onTick(game: Game): void {
    throw new Error("Method not implemented.");
  }
  constructor() {
    super({
      x: 0,
      y: 0,
      w: 0,
      h: 0,
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
}

class Dynamitee extends BaseEntity<DynamiteData> {
  type: 'dynamite' = 'dynamite';
  onTick(game: Game): void {
    throw new Error("Method not implemented.");
  }
  
}

const d: Entityy = (0 as any) as Entityy;

export interface DynamiteE extends Inertial, Explosive {
  entityType: 'dynamite';
  fuse: number;
}

export type Entity = PlayerE | DynamiteE;

export type EntityType = Entity['entityType'];

type PresetEntityFields = 'id' | 'entityType' | 'x' | 'y' | 'vx' | 'vy' | 'w' | 'h' | 'mass' | 'inertial' | 'physical';
export type DefaultEntity<T extends Entity> = Omit<T, PresetEntityFields>;
export interface EntityLogic<T extends Entity> {
  create(game: Game): DefaultEntity<T>;
  onTick(entity: T, game: Game): void;
}

const HITBOXES: Record<EntityType, {x: number, y: number, vx: number, vy: number, w: number, h: number, mass: number}> = {
  player: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    w: 0.875,
    h: 2,
    mass: 1
  },
  dynamite: {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    w: 0,
    h: 0,
    mass: 0
  }
}

const ENTITY_SPECS: Record<EntityType, EntityLogic<any>> = {
  player: PLAYER_LOGIC,
  dynamite: {
    create: function (): DefaultEntity<DynamiteE> {
      return {
        fuse: 1,
        explosive: true,
        explosionRadius: 3,
        maxExplosionDamage: 50,
        detonate: () => 0
      };
    },
    onTick: function (): void {
      throw new Error("Function not implemented.");
    }
  }
}

function onTick(entity: Entity, game: Game) {
  ENTITY_SPECS[entity.entityType].onTick(entity, game);
}

function create(type: EntityType, id: number, game: Game): Entity {
  return {
    id: id,
    entityType: type,
    ...HITBOXES[type],
    ...ENTITY_SPECS[type].create(game)
  } as Entity;
}


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
export class Player extends InertialAnimatedEntity {
  walkStage: number;

  walking: XDirection | undefined;
  facing: XDirection;
  jumping: boolean;

  jumpBuffer: number;
  coyoteTimer: number;

  inventory: PlayerInventory;

  constructor(x: number, y: number) {
    super(0, x, y, 0.875, 2, 1);
    this.walkStage = 0;
    this.jumping = false;
    this.facing = 'right';

    this.jumpBuffer = 0;
    this.coyoteTimer = 0;
    this.inventory = {
      selected: 0,
      slots: [
        undefined, undefined, undefined, undefined
      ]
    }
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
        frame: this.walking && this.onGround ? Math.floor(this.walkStage) : 0,
        scaleX: this.facing === 'right' ? 1 : -1
      }
    }
  }

  onTick() {
    this.walkStage += Math.abs(this.vx) * 8;
    this.walkStage %= 7;
    // wall jump handling should come before jump handling
    this.handleWallJump();
    this.handleJump();
    this.handleWalk();
  }

  private handleWallJump() {
    if (this.hittingWall && this.jumping && this.jumpBuffer === 0 && !this.onGround) {
      this.vx = this.hittingWall === 'left' ? WALL_JUMP_SPEED : -WALL_JUMP_SPEED;
      this.vy = JUMP_SPEED;
    }
  }

  private handleWalk() {
    if (this.walking === 'right') {
      // walk right
      this.vx = Math.min(this.vx + WALK_ACCELERATION, MAX_WALK_SPEED);
      this.facing = 'right';
    } else if (this.walking === 'left') {
      // walk left
      this.vx = Math.max(this.vx - WALK_ACCELERATION, -MAX_WALK_SPEED);
      this.facing = 'left';
    } else if (!this.walking && this.vx !== 0) {
      // friction
      const friction = this.onGround ? GROUND_FRICTION : AIR_FRICTION;
      if (this.vx > 0) {
        this.vx = Math.max(0, this.vx - friction);
      } else {
        this.vx = Math.min(0, this.vx + friction);
      }
    }
  }

  private handleJump() {
    // handle coyote timer and jump buffer
    this.coyoteTimer = this.onGround ? COYOTE_TIMER_TICKS : Math.max(0, this.coyoteTimer - 1);
    this.jumpBuffer = this.jumping ? JUMP_BUFFER_TICKS : Math.max(0, this.jumpBuffer - 1);
    // handle jump initiation
    if (this.jumpBuffer && this.coyoteTimer > 0) {
      this.vy = JUMP_SPEED;
      // if the player jumps while walking, boost them in that direction
      if (this.walking === 'right') {
        this.vx = Math.min(MAX_WALK_SPEED, this.vx + JUMP_WALK_BOOST);
      } else if (this.walking === 'left') {
        this.vx = Math.max(-MAX_WALK_SPEED, this.vx - JUMP_WALK_BOOST);
      }
    }
    // the player stays in the air longer if they hold the jump key or slide against a wall
    let verticalFriction = 0;
    if (this.jumping && !this.onGround) {
      verticalFriction = JUMP_HOLDING;
    }
    if (this.hittingWall && this.vy < 0 && !this.onGround) {
      verticalFriction = Math.max(verticalFriction, WALL_FRICTION);
    }
    this.vy += verticalFriction;
  }
}

export function handleDetonation(detonated: Explosive, game: Game) {
  const { x, y, explosionRadius, maxExplosionDamage } = detonated;

  // delete the detonated thing
  game.world.things.delete(detonated.id);

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
