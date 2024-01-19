import { GRAVITY, distance } from "./physics";
import { AnimatedEntity } from "./render";
import { Inertial, XDirection, Explosive, ArmaturePiecePose, World, Block, explosive, mortal } from "./world";

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

export class Dynamite extends InertialAnimatedEntity implements Explosive {
  explosionRadius: number;
  maxExplosionDamage: number;

  explosive: true;

  fuse: number;

  constructor(id: number, x: number, y: number) {
    super(id, x, y, 1, 1, 1);

    this.explosionRadius = 3;
    this.maxExplosionDamage = 50;

    this.explosive = true;

    this.fuse = 5;
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
        frame: this.fuse
      }
    };
  }

  detonate(): void {
    throw new Error('Method not implemented.');
  }
}

const JUMP_BUFFER_TICKS = 2;
const COYOTE_TIMER_TICKS = 5;
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

  constructor(id: number, x: number, y: number) {
    super(id, x, y, 1, 2, 1);
    this.walkStage = 0;
    this.jumping = false;
    this.facing = 'right';

    this.jumpBuffer = 0;
    this.coyoteTimer = 0;
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
