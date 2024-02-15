import * as PIXI from 'pixi.js';
import { ButtonPressAction, Game } from "./game";
import { MenuController } from "./menu";
import { ActionMap, InputButtonMap, InputController, InputState } from "./input";
import { GUI_TEXTURES, Renderer } from "./render";

export class Controller {
  game?: Game;
  gameRenderer?: Renderer;
  menu?: MenuController;
  titleScreen?: any;

  constructor() {
    
  }
}

export interface Settings {
  keybinds: InputButtonMap<Record<ButtonPressAction, never>>;
}

// data
interface MenuContext {
  navigate: (to: string | undefined) => void;
  settings: Settings;
  focus: () => void;
  rebuildMenu: () => void;
}


type MenuItem = {
  // where in the row do you start?
  tileX: number;
  // how many squares wide are you?
  tileWidth: number;
  text?: string;
  onSelect?: (tileX: number, context: MenuContext) => void;
} & (
  {
    type: 'label';
  } | {
    type: 'large-button';
  } | {
    type: 'slider';
    getValue: (settings: Settings) => number;
  } | {
    type: 'x-button';
  } | {
    type: 'keybind-button';
    getValue: (settings: Settings) => string;
  }
);

interface MenuRow {
  items: MenuItem[];
}

interface MenuScreen {
  title: string;
  rows: MenuRow[];
}

// renderer


// controller
interface InteractRegion {
  x: number,
  y: number,
  w: number,
  h: number,
  onClick: (position: [number, number]) => void;
  onPointer: (inside: boolean) => void;
}

const MENU_SCREENS: Record<string, (settings: Settings) => MenuScreen> = {
  options: () => ({
    title: 'Options',
    rows: [{
      items: [{
        type: 'large-button',
        text: 'Resume',
        tileX: 0,
        tileWidth: 12,
        onSelect: (_, context) => {console.log('resume bt');context.navigate(undefined)}
      }]
    }, {
      items: [{
        type: 'large-button',
        text: 'Controls',
        tileX: 0,
        tileWidth: 12,
        onSelect: (_, context) => {console.log('control but');context.navigate('controls')}
      }]
    }, {
      items: [{
        type: 'large-button',
        text: 'Exit Game',
        tileX: 0,
        tileWidth: 12,
        onSelect: (_, context) => {console.log('exit game but');context.navigate(undefined)}
      }]
    }]
  }),
  controls: settings => ({
    title: 'Controls',
    rows: Object.entries(settings.keybinds).map(entry => {
      const [binding, keys] = entry as [ButtonPressAction, string[]];
      const keyButtons: MenuItem[] = [];
      keys.forEach((key, i) => {
        keyButtons.push({
          type: 'keybind-button',
          text: key,
          tileX: 4 + i * 3,
          tileWidth: 2,
          getValue: settings => settings.keybinds[binding][i],
          onSelect: (_, context) => {
            console.log('keybind button')
            context.focus();
          }
        }, {
          type: 'x-button',
          tileX: 6 + i * 3,
          tileWidth: 0.5,
          onSelect: (_, context) => {
            console.log('X button')
            context.settings.keybinds[binding].slice(i, 1);
            context.rebuildMenu();
          }
        });
      })
      return {
        items: [
          {
            type: 'label',
            text: binding,
            tileX: 0,
            tileWidth: 3
          }, ...keyButtons
        ]
      }
    })
  })
}

function getMenuItemTexture(type: MenuItem['type']): PIXI.Texture<PIXI.Resource> {
  const largeButtonTexture = GUI_TEXTURES['menu'].frames[GUI_TEXTURES['menu'].getFrameIndex('largeButton', 0)];
  const addButtonTexture = GUI_TEXTURES['menu'].frames[GUI_TEXTURES['menu'].getFrameIndex('addButton', 0)];
  const minusButtonTexture = GUI_TEXTURES['menu'].frames[GUI_TEXTURES['menu'].getFrameIndex('minusButton', 0)];
  switch(type) {
    case 'large-button':
      return largeButtonTexture;
    case 'keybind-button':
      return largeButtonTexture;
    case 'label':
      return PIXI.Texture.EMPTY;
    case 'x-button':
      return minusButtonTexture;
    default:
      return PIXI.Texture.EMPTY;
  }
}

function inRegion(box: InteractRegion, [x, y]: [number, number]) {
  return x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h
}

export type MenuAction = 'select' | 'toggle';

export class OptionsMenuController implements ActionMap<Record<MenuAction, never>> {
  currentScreenID: string | undefined;
  boundingBoxes: InteractRegion[];
  renderer: MenuRenderer;
  settings: Settings;
  menuScreen: any;
  focusCoordinate?: [number, number];

  constructor(renderer: MenuRenderer, settings: Settings) {
    this.currentScreenID = undefined;
    this.boundingBoxes = [];
    this.renderer = renderer;
    this.settings = settings;
  }

  select = (pressed: boolean, inputState: InputState<Record<MenuAction, never>>) => {
    if (!pressed) {
      return;
    }
    this.boundingBoxes.forEach(box => {
      if (inRegion(box, inputState.cursorPosition)) {
        box.onClick(inputState.cursorPosition);
      } else {
        // console.log(JSON.stringify(box) + ' ' + JSON.stringify(box))
      }
    });
  }

  toggle = (pressed: boolean, inputState: InputState<Record<MenuAction, never>>) => {
    // console.log('ey')
    if (!pressed) {
      return;
    }
    if (this.currentScreenID) {
      console.log('we togglin')
      this.close();
      return;
    }
    // console.log('we set')
    this.setScreen('options');
  }

  handlePointerMove(position: [number, number]) {
    if (!this.menuScreen) {
      return;
    }
    this.boundingBoxes.forEach(box => box.onPointer(inRegion(box, position)));
  }

  setScreen = (screen: string) => {
    this.currentScreenID = screen;
    this.boundingBoxes = [];
    this.focusCoordinate = undefined;
    const menuScreen = MENU_SCREENS[screen](this.settings);
    console.log('loading rows ' + menuScreen.rows.length);
    menuScreen.rows.forEach((row, i) => row.items.forEach((item, j) => {
      const x = item.tileX * 50;
      const y = i * 50;
      this.boundingBoxes.push({
        x: x,
        y: y,
        w: item.tileWidth * 50,
        h: 50,
        onClick: ([cx, _]) => {
          item.onSelect && item.onSelect((cx - x) / 50, {
            navigate: screen => screen ? this.setScreen(screen) : this.close('navigate'),
            settings: this.settings,
            focus: () => this.focusCoordinate = [i, j],
            rebuildMenu: () => this.renderer.rebuildMenu(MENU_SCREENS[screen](this.settings))
          });
        },
        onPointer: inside => 0
      })
    }))
    this.renderer.rebuildMenu(menuScreen);
  }

  close(who?: string) {
    console.log('close ' + who)
    this.currentScreenID = undefined;
    this.boundingBoxes = [];
    this.focusCoordinate = undefined;
    this.renderer.rebuildMenu();
  }
}

const HMM: InputController<Record<MenuAction, never>> = {
  inputButtonMap: {
    select: ['Enter', 'leftclick', 'rightclick'],
    toggle: ['Escape']
  },
  actions: {
    select: (pressed, inputState) => {

    },
    toggle: (pressed, inputState) => {

    }
  },
  inputState: {
    buttons: {
      select: false,
      toggle: false
    },
    cursorPosition: [0, 0]
  },
  enabled: true
}

export class MenuRenderer {
  layer: PIXI.Container;
  sprites: PIXI.Sprite[];

  constructor(layer: PIXI.Container, settings: Settings) {
    this.layer = layer;
    this.sprites = [];
  }

  rebuildMenu(menu?: MenuScreen) {
    this.sprites.forEach(sprite => this.layer.removeChild(sprite));
    this.sprites = [];
    console.log('rebuild!')
    if (!menu) {
      console.log('no men...')
      return;
    }
    menu.rows.forEach((row, i) => row.items.forEach(item => {
      const y = i * 50;
      const x = item.tileX * 50;
      const sprite = PIXI.AnimatedSprite.from(getMenuItemTexture(item.type));
      sprite.x = x;
      sprite.y = y;
      sprite.scale.set(4);
      this.layer.addChild(sprite);
      this.sprites.push(sprite);
    }));
  }
}