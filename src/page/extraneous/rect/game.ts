import { mod } from "../../../util/util";
import { Entity } from "./entity";
import { Player, PlayerData } from "./entity/player";
import { EMPTY_INPUT_STATE, InputState, InputTriggers } from "./input";
import { ITEMS, handleSlotUse } from "./item";
import { distance, stepPhysics } from "./physics";
import { Renderer, screenToGamePosition } from "./render";
import { Block, World } from "./world";

export class Game {
  player: Player;
  world: World;
  renderer: Renderer;

  entityCount: number;
  terrainOutOfDate: boolean;
  actionQueue: (() => void)[];

  inputState: InputState;

  constructor(player: Player, world: World, renderer: Renderer) {
    this.player = player;
    this.world = world;
    this.renderer = renderer;
    this.entityCount = 0;
    this.actionQueue = [];
    this.terrainOutOfDate = true;
    this.inputState = EMPTY_INPUT_STATE;
  }

  spawn(thing: Entity) {
    thing.id = this.entityCount;
    this.world.things.set(thing.id, thing);
    this.entityCount += 1;
  }

  setBlock(x: number, y: number, block: Block) {
    this.world.terrain.set(x, y, block);
    this.terrainOutOfDate = true;
  }

  tick() {
    //quad.shader.uniforms.wind = Math.sin(t / 30) * 2.2;
    stepPhysics(this);
    this.actionQueue.forEach(action => action());
    this.actionQueue = [];
    this.player.data.inventory.slots.forEach((slot, i) => {
      const item = slot && ITEMS[slot.id];
      item?.onTick && item.onTick({
        user: this.player,
        game: this,
        slotNumber: i
      });
      if (slot?.quantity === 0) {
        this.player.data.inventory.slots[i] = undefined;
        return;
      }
    })
    
    this.renderer.updateAmbient();
    this.renderer.updateEntities();
    this.updateTrajectory();
    this.renderer.updateInventory(this.player.data.inventory);
    if (this.terrainOutOfDate) {
      this.renderer.updateTerrain();
      this.terrainOutOfDate = false;
    }
  }

  updateTrajectory() {
    if (this.player.data.inventory.slots[this.player.data.inventory.selected]?.id === 'dynamite') {
      const aimGoal = screenToGamePosition(this.inputState.mousePosition);
      [this.player.data.aimTheta, this.player.data.aimEffort] = calculateThrowingParameters(this.player, aimGoal);
    } else {
      this.player.data.aimTheta = undefined;
    }
    this.renderer.updateThrowingTrajectory(this.player.data);
  }

  getControlInterface(inputState: InputState): InputTriggers {
    this.inputState = inputState;
    const onXChange = (_: boolean) => updateWalking(inputState, this.player);
    const onScroll = (sign: number) => (pressed: boolean) => {
      if (pressed) {
        const inventory = this.player.data.inventory;
        inventory.selected = mod((inventory.selected + sign), inventory.slots.length);
        this.renderer.updateInventory(inventory);
      }
    };

    return {
      onButtonPress: {
        useMain: (_: boolean) => { },
        useSecondary: (pressed: boolean) => {
          if (pressed) {
            this.actionQueue.push(() => {
              handleSlotUse({
                user: this.player,
                game: this,
                slotNumber: this.player.data.inventory.selected
              });
            });
          }
        },
        // onScroll: (upBy: number) => {
        //   const inventory = game.player.data.inventory;
        //   inventory.selected = mod((inventory.selected - upBy), inventory.slots.length);
        //   game.renderer.updateInventory(inventory);
        // },
        // onPointerMove: (screenX: number, screenY: number) => { },
        up: (_: boolean) => {
        },
        left: onXChange,
        right: onXChange,
        down: onXChange,
        jump: (_: boolean) => {
          this.player.data.jumping = inputState.buttonsDown.jump;
        },
        control: () => { },
        shift: () => { },
        scrollUp: onScroll(1),
        scrollDown: onScroll(-1)
      },
      onType: () => {},
      onPointerMove: ([screenX, screenY]) => {
        // console.log(screenX + ' ' + screenY);
        // const [x, y] = screenToGamePosition([screenX, screenY]);
        // const player = this.player.data;
        // const theta = Math.atan2(y - player.y, x - player.x);
        // this.updateTrajectory(theta);
        // player.aimTheta = theta;
      }
    }
  }
}

function calculateThrowingParameters(player: Player, [aimX, aimY]: [number, number]): [number, number] {
  // TODO: make this less weird
  const range = Math.min(1, distance([player.data.x, player.data.y], [aimX, aimY]) / 9);
  const strength = range * 0.7 + 0.2;
  const [dy, dx] = [aimY - player.data.y, aimX - player.data.x];
  const theta = Math.atan2(dy + 2 * range, dx - 2 * dx / 5);

  return [theta, strength];
}

function updateWalking(inputState: InputState, player: Player) {
  const netWalk = +!!inputState.buttonsDown.right - +!!inputState.buttonsDown.left;
  if (netWalk > 0) {
    player.data.walking = 'right';
  } else if (netWalk < 0) {
    player.data.walking = 'left';
  } else {
    player.data.walking = undefined;
  }
}
