import { mod } from "../../../util/util";
import { Entity } from "./entity";
import { Player } from "./entity/player";
import { ActionMap, InputButtonMap, InputController, InputHandler, InputState } from "./input";
import { ITEMS, handleSlotUse } from "./item";
import { MenuController, navigateMain } from "./menu";
import { distance, stepPhysics } from "./physics";
import { Renderer, screenToGamePosition } from "./render";
import { Block, World } from "./world";

export type ButtonPressAction = 'useMain' | 'useSecondary' | 'up' | 'left' | 'down' | 'right' | 'jump' | 'control' | 'shift' | 'scrollUp' | 'scrollDown' | 'pause';

const DEFAULT_INPUT_MAP: InputButtonMap<Record<ButtonPressAction, never>> = {
  useMain: ['leftclick'],
  useSecondary: ['rightclick'],
  up: ['w'],
  left: ['a'],
  down: ['s'],
  right: ['d'],
  jump: ['w', ' '],
  control: ['Control'],
  shift: ['Shift'],
  scrollUp: ['scrollup', 'ArrowRight'],
  scrollDown: ['scrolldown', 'ArrowLeft'],
  pause: ['Escape']
};

type MenuPressAction = 'select' | 'resume' | 'type';

const MENU_NAVIGATION_INPUTS: InputButtonMap<Record<MenuPressAction, never>> = {
  select: ['leftclick', 'rightclick'],
  resume: ['Escape', 'Enter'],
  type: ['any']
}

export class Game {
  player: Player;
  world: World;
  renderer: Renderer;

  entityCount: number;
  terrainOutOfDate: boolean;
  actionQueue: (() => void)[];

  inputHandler: InputHandler;

  playerInput: InputController<Record<ButtonPressAction, never>>;
  menuInput: InputController<Record<MenuPressAction, never>>;

  menu: MenuController;

  constructor(player: Player, world: World, renderer: Renderer, inputHandler: InputHandler) {
    this.player = player;
    this.world = world;
    this.renderer = renderer;
    this.menu = new MenuController(() => {
      this.menuInput.enabled = false;
      this.playerInput.enabled = true;
    });
    this.renderer.menuLayer.addChild(this.menu);
    this.entityCount = 0;
    this.actionQueue = [];
    this.terrainOutOfDate = true;
    this.inputHandler = inputHandler;
    this.playerInput = {
      inputButtonMap: DEFAULT_INPUT_MAP,
      actions: this.initializePlayerControls(),
      inputState: {
        buttons: {
          useMain: false,
          useSecondary: false,
          up: false,
          left: false,
          down: false,
          right: false,
          jump: false,
          control: false,
          shift: false,
          scrollUp: false,
          scrollDown: false,
          pause: false
        },
        cursorPosition: [0, 0]
      },
      enabled: true
    };
    this.menuInput = {
      inputButtonMap: MENU_NAVIGATION_INPUTS,
      actions: this.menu,
      inputState: {
        buttons: {
          select: false,
          resume: false,
          type: false
        },
        cursorPosition: [0, 0]
      },
      enabled: true
    }
    this.inputHandler.registerInputListeners(this.playerInput);
    this.inputHandler.registerInputListeners(this.menuInput);
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
    this.inputHandler.processInput();
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
      const aimGoal = screenToGamePosition(this.playerInput.inputState.cursorPosition);
      [this.player.data.aimTheta, this.player.data.aimEffort] = calculateThrowingParameters(this.player, aimGoal);
    } else {
      this.player.data.aimTheta = undefined;
    }
    this.renderer.updateThrowingTrajectory(this.player.data);
  }

  // private initializeMenuControls(): ActionMap<Record<MenuPressAction, never>> {
  //   return {
  //     select: (pressed: boolean, i) => {
  //       console.log('selecttt')
  //       if (pressed) {
  //         // this.renderer.menu.s(i.cursorPosition);
  //       }
  //     },
  //     escape: (pressed: boolean) => {
  //       if (pressed) {
  //         this.menuInput.enabled = false;
  //         this.playerInput.enabled = true;
  //         this.renderer.closeMenu();
  //       }
  //     }
  //   }
  // }

  private initializePlayerControls(): ActionMap<Record<ButtonPressAction, never>> {
    const onXChange = (_: boolean, inputState: InputState<Record<ButtonPressAction, never>>) => updateWalking(inputState, this.player);
    const onScroll = (sign: number) => (pressed: boolean) => {
      if (pressed) {
        const inventory = this.player.data.inventory;
        inventory.selected = mod((inventory.selected + sign), inventory.slots.length);
        this.renderer.updateInventory(inventory);
      }
    };

    return {
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
        jump: (_: boolean, inputState) => {
          this.player.data.jumping = inputState.buttons.jump;
        },
        control: () => { },
        shift: () => { },
        scrollUp: onScroll(1),
        scrollDown: onScroll(-1),
        pause: (pressed: boolean) => {
          if (pressed) {
            console.log('pause')
            this.playerInput.enabled = false;
            this.menuInput.enabled = true;
            navigateMain(this.menu);
          }
        }
    };
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

function updateWalking(inputState: InputState<Record<ButtonPressAction, never>>, player: Player) {
  const netWalk = +!!inputState.buttons.right - +!!inputState.buttons.left;
  if (netWalk > 0) {
    player.data.walking = 'right';
  } else if (netWalk < 0) {
    player.data.walking = 'left';
  } else {
    player.data.walking = undefined;
  }
}
