import { Entity } from "./entity";
import { Player } from "./entity/player";
import { InputState, InputTriggers } from "./input";
import { ITEMS, handleSlotUse } from "./item";
import { stepPhysics } from "./physics";
import { Renderer } from "./render";
import { Block, World } from "./world";

export class Game {
  player: Player;
  world: World;
  renderer: Renderer;

  entityCount: number;
  terrainOutOfDate: boolean;
  actionQueue: (() => void)[];

  constructor(player: Player, world: World, renderer: Renderer) {
    this.player = player;
    this.world = world;
    this.renderer = renderer;
    this.entityCount = 0;
    this.actionQueue = [];
    this.terrainOutOfDate = true;
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
    this.renderer.updateInventory(this.player.data.inventory);
    if (this.terrainOutOfDate) {
      this.renderer.updateTerrain();
      this.terrainOutOfDate = false;
    }
  }

  getControlInterface(): InputTriggers {
    const onXChange = (_: boolean, inputState: InputState) => updateWalking(inputState, this.player);
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
              })
            });
          }
        },
        // onScroll: (upBy: number) => {
        //   const inventory = game.player.data.inventory;
        //   inventory.selected = mod((inventory.selected - upBy), inventory.slots.length);
        //   game.renderer.updateInventory(inventory);
        // },
        // onPointerMove: (screenX: number, screenY: number) => { },
        up: (pressed: boolean) => {
          
        },
        left: onXChange,
        right: () => { },
        down: onXChange,
        jump: (_: boolean, inputState: InputState) => {
          this.player.data.jumping = inputState.buttonsDown.jump;
        },
        control: () => { },
        shift: () => { },
      },
      onType: () => {}
    }
  }
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
