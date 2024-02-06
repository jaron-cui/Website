import { BaseEntity, Inertial } from "../entity";
import { PlayerInventory } from "../item";
import { GRAVITY } from "../physics";
import { XDirection, ArmaturePiecePose } from "../world";

const JUMP_BUFFER_TICKS = 2;
const COYOTE_TIMER_TICKS = 3;
const WALLJUMP_TIMER_TICKS = 3;
const WALLJUMP_COOLDOWN = 6;
const JUMP_SPEED = 0.4;
const JUMP_HOLDING = GRAVITY * -0.4;
const JUMP_WALK_BOOST = 0.1;

const MAX_WALK_SPEED = 0.14;
const WALK_ACCELERATION = 0.02;
const GROUND_FRICTION = 0.04;
const AIR_FRICTION = 0.005;
const WALL_FRICTION = GRAVITY * -0.9;
const WALL_JUMP_SPEED = JUMP_SPEED * 0.6;

interface PlayerData extends Inertial {
  walkStage: number;

  walking: XDirection | undefined;
  facing: XDirection;
  jumping: boolean;

  jumpBuffer: number;
  coyoteTimer: number;
  wallJumpTimer: number;
  wallJumpCooldown: number;
  lastWall: XDirection | undefined;

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
      wallJumpTimer: 0,
      wallJumpCooldown: 0,
      lastWall: undefined,
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
    this.data.lastWall = this.data.hittingWall || this.data.lastWall;
    this.data.wallJumpTimer = this.data.hittingWall ? WALLJUMP_TIMER_TICKS : Math.max(0, this.data.wallJumpTimer - 1);
    this.data.wallJumpCooldown = this.data.onGround ? WALLJUMP_COOLDOWN : Math.max(0, this.data.wallJumpCooldown - 1);
    const timely = this.data.wallJumpTimer && !this.data.wallJumpCooldown;
    const ungrounded = !this.data.coyoteTimer && this.data.jumpBuffer === 0 && !this.data.onGround;
    if (this.data.jumping && timely && ungrounded) {
      this.data.wallJumpCooldown = WALLJUMP_COOLDOWN;
      this.data.vx = this.data.lastWall === 'left' ? WALL_JUMP_SPEED : -WALL_JUMP_SPEED;
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