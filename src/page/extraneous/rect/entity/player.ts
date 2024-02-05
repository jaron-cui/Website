import { type DefaultEntity, type EntityLogic } from "../entity";
import { PlayerInventory } from "../item";
import { GRAVITY } from "../physics";
import { Inertial, XDirection } from "../world";

// TODO: SIGNIFICANTLY REVISE/DELETE

export const PLAYER_LOGIC: EntityLogic<PlayerE> = {
  create: create,
  onTick: onTick
}

export interface PlayerE extends Inertial {
  entityType: 'player';

  walkStage: number;
  walking: XDirection | undefined;
  facing: XDirection;
  jumping: boolean;

  jumpBuffer: number;
  coyoteTimer: number;

  inventory: PlayerInventory;
}

function create(): DefaultEntity<PlayerE> {
  return {
    facing: 'right',
    walking: undefined,
    jumping: false,
    jumpBuffer: 0,
    coyoteTimer: 0,
    inventory: {
      selected: 0,
      slots: [undefined, undefined, undefined, undefined]
    },
    walkStage: 0
  };
}

function onTick(player: PlayerE) {
  player.walkStage += Math.abs(player.vx) * 8;
  player.walkStage %= 7;
  // wall jump handling should come before jump handling
  handleWallJump(player);
  handleJump(player);
  handleWalk(player);
}

// HELPER FUNCTIONS
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

function handleWallJump(player: PlayerE) {
  if (player.hittingWall && player.jumping && player.jumpBuffer === 0 && !player.onGround) {
    player.vx = player.hittingWall === 'left' ? WALL_JUMP_SPEED : -WALL_JUMP_SPEED;
    player.vy = JUMP_SPEED;
  }
}

function handleWalk(player: PlayerE) {
  if (player.walking === 'right') {
    // walk right
    player.vx = Math.min(player.vx + WALK_ACCELERATION, MAX_WALK_SPEED);
    player.facing = 'right';
  } else if (player.walking === 'left') {
    // walk left
    player.vx = Math.max(player.vx - WALK_ACCELERATION, -MAX_WALK_SPEED);
    player.facing = 'left';
  } else if (!player.walking && player.vx !== 0) {
    // friction
    const friction = player.onGround ? GROUND_FRICTION : AIR_FRICTION;
    if (player.vx > 0) {
      player.vx = Math.max(0, player.vx - friction);
    } else {
      player.vx = Math.min(0, player.vx + friction);
    }
  }
}

function handleJump(player: PlayerE) {
  // handle coyote timer and jump buffer
  player.coyoteTimer = player.onGround ? COYOTE_TIMER_TICKS : Math.max(0, player.coyoteTimer - 1);
  player.jumpBuffer = player.jumping ? JUMP_BUFFER_TICKS : Math.max(0, player.jumpBuffer - 1);
  // handle jump initiation
  if (player.jumpBuffer && player.coyoteTimer > 0) {
    player.vy = JUMP_SPEED;
    // if the player jumps while walking, boost them in that direction
    if (player.walking === 'right') {
      player.vx = Math.min(MAX_WALK_SPEED, player.vx + JUMP_WALK_BOOST);
    } else if (player.walking === 'left') {
      player.vx = Math.max(-MAX_WALK_SPEED, player.vx - JUMP_WALK_BOOST);
    }
  }
  // the player stays in the air longer if they hold the jump key or slide against a wall
  let verticalFriction = 0;
  if (player.jumping && !player.onGround) {
    verticalFriction = JUMP_HOLDING;
  }
  if (player.hittingWall && player.vy < 0 && !player.onGround) {
    verticalFriction = Math.max(verticalFriction, WALL_FRICTION);
  }
  player.vy += verticalFriction;
}