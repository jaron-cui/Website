import * as PIXI from 'pixi.js';
import { type ButtonPressAction } from "./game";
import { ActionMap, InputButtonMap, InputState } from "./input";
import { GUI_TEXTURES, TextBox } from "./render";
import { SCREEN_WIDTH } from './constants';

interface Settings {
  setKeybindings(inputMap: InputButtonMap<Record<ButtonPressAction, never>>): void;
}

interface Button {
  inBounds([x, y]: [number, number]): boolean;
  onClick(): void;
}
type MenuScreen = 'pause' | 'controls';

type Entry = {
  type: 'button',
  title: string;
  onClick: () => void;
} | {
  type: 'keybind',
  title: string;
  bindings: string[];
  editing?: number;
  onAdd: () => void;
} | {
  type: 'slider',
  title: string;
  setting: number;
}

interface MScreen {
  title: string;
  entries: Entry[];
}

type Blah = 'select' | 'resume' | 'type';

interface ClickBox {
  x: number;
  y: number;
  w: number;
  h: number;
  onClick: () => void;
}

interface MenuDimensions {
  buttonWidth: number;
  buttonHeight: number;
}

// function makeClickBoxes(entries: Entry[]): ClickBox[] {
//   return entries.map(entry => {
//     if (entry.type ===)
//   })
// }


const MENU_BUTTON_HEIGHT = 50;
const MENU_VERTICAL_OFFSET = 200;
const MENU_BUTTON_WIDTH = 200;
const LABEL_WIDTH = 50;
const KEYBIND_BUTTON_WIDTH = 50;
const KEYBIND_X_WIDTH = 20;
const MAX_BINDS = 3;
const screenCenter = SCREEN_WIDTH / 2;

export class MenuController implements ActionMap<Record<Blah, never>> {
  screen?: MScreen;
  clickBoxes: ClickBox[];
  layer: PIXI.Container;
  sprites: PIXI.Sprite[];

  constructor(layer: PIXI.Container) {
    this.clickBoxes = [];
    this.layer = layer;
    this.sprites = [];
    this.navigateMain();
  }

  rerender() {
    this.clickBoxes = [];
    this.sprites.forEach(sprite => this.layer.removeChild(sprite));
    if (!this.screen) {
      return;
    }
    const reload = () => this.rerender();
    const largeButtonTexture = GUI_TEXTURES['menu'].frames[GUI_TEXTURES['menu'].getFrameIndex('largeButton', 0)];
    const addButtonTexture = GUI_TEXTURES['menu'].frames[GUI_TEXTURES['menu'].getFrameIndex('addButton', 0)];
    const minusButtonTexture = GUI_TEXTURES['menu'].frames[GUI_TEXTURES['menu'].getFrameIndex('minusButton', 0)];

    this.screen.entries.forEach((entry, i) => {
      const yOffset = i * MENU_BUTTON_HEIGHT + MENU_VERTICAL_OFFSET;
      const leftMargin = screenCenter - MENU_BUTTON_WIDTH / 2;
      if (entry.type === 'button') {
        // this.clickBoxes.push({
        //   x: leftMargin,
        //   y: yOffset,
        //   w: MENU_BUTTON_WIDTH,
        //   h: MENU_BUTTON_HEIGHT,
        //   onClick() {
        //     entry.onClick();
        //   }
        // });
        const buttonSprite = PIXI.AnimatedSprite.from(largeButtonTexture);
        buttonSprite.scale.set(4);
        buttonSprite.x = leftMargin;
        buttonSprite.y = yOffset;

        buttonSprite.onclick = entry.onClick;
        this.layer.addChild(buttonSprite);
        this.sprites.push(buttonSprite);
      } else if (entry.type === 'keybind') {
        const buttonStart = leftMargin + LABEL_WIDTH;
        // keybind buttons
        entry.bindings.forEach((_, i) => {
          // editing and delete buttons
          const buttonLeft = buttonStart + KEYBIND_BUTTON_WIDTH * i;
          const keybindButton = PIXI.AnimatedSprite.from(largeButtonTexture);
          keybindButton.scale.set(4);
          keybindButton.x = buttonLeft;
          keybindButton.y = yOffset;
          keybindButton.onclick = () => entry.editing = i;
          this.layer.addChild(keybindButton);
          this.sprites.push(keybindButton);
          const deleteButton = PIXI.AnimatedSprite.from(minusButtonTexture);
          deleteButton.scale.set(4);
          deleteButton.x = buttonLeft + KEYBIND_BUTTON_WIDTH - KEYBIND_X_WIDTH;
          deleteButton.y = yOffset;
          deleteButton.onclick = () => {
            entry.bindings.splice(i, 1);
            reload();
          }
          this.layer.addChild(keybindButton);
          this.sprites.push(keybindButton);

          this.clickBoxes.push({
            x: buttonLeft,
            y: yOffset,
            w: KEYBIND_BUTTON_WIDTH,
            h: MENU_BUTTON_HEIGHT,
            onClick() {
              entry.editing = i;
            }
          }, {
            x: buttonLeft + KEYBIND_BUTTON_WIDTH - KEYBIND_X_WIDTH,
            y: yOffset,
            w: KEYBIND_X_WIDTH,
            h: MENU_BUTTON_HEIGHT,
            onClick() {
              entry.bindings.splice(i, 1);
              reload();
            }
          });
        });
        // add button
        const addButton = PIXI.AnimatedSprite.from(addButtonTexture);
        addButton.scale.set(4);
        addButton.x = buttonStart + KEYBIND_BUTTON_WIDTH * entry.bindings.length;
        addButton.y = yOffset;
        addButton.onclick = () => {
          if (entry.bindings.length < MAX_BINDS) {
            entry.bindings.push('');
            reload();
          }
        };
        this.layer.addChild(addButton);
        this.sprites.push(addButton);

        this.clickBoxes.push({
          x: buttonStart + KEYBIND_BUTTON_WIDTH * entry.bindings.length,
          y: yOffset,
          w: KEYBIND_BUTTON_WIDTH,
          h: MENU_BUTTON_HEIGHT,
          onClick() {
            if (entry.bindings.length < MAX_BINDS) {
              entry.bindings.push('');
              reload();
            }
          }
        });
      }
    });
  }

  navigateMain() {
    this.screen = {
      title: 'Options',
      entries: [
        {
          type: 'button',
          title: 'Resume',
          onClick: () => this.close()
        }, {
          type: 'button',
          title: 'Controls',
          onClick: () => this.navigateControls()
        }
      ]
    }
    this.rerender();
  }

  navigateControls() {
    this.screen = {
      title: 'Controls',
      entries: [
        {
          type: 'keybind',
          title: 'Walk',
          bindings: ['w'],
          editing: undefined,
          onAdd() {
            this.bindings.push('');
            this.editing = this.bindings.length - 1;
          }
        }
      ]
    }
    this.rerender();
  }

  close() {
    this.screen = undefined;
    this.rerender();
  }

  select(pressed: boolean, inputState: InputState<Record<Blah, never>>) {
    if (pressed) {
      return;
    }
    const [x, y] = inputState.cursorPosition;
    this.clickBoxes.forEach(clickBox => {
      if (x > clickBox.x && x < clickBox.x + clickBox.w && y > clickBox.y && y < clickBox.y + clickBox.x) {
        // clickBox.onClick();
      }
    });
  }

  resume(pressed: boolean, inputState: InputState<Record<Blah, never>>) {
    if (pressed) {
      this.close();
    }
  }

  type(pressed: boolean, inputState: InputState<Record<Blah, never>>) {

  }
}

class Menu {
  layer: PIXI.Container;
  buttons: [PIXI.Sprite, TextBox, () => void][];
  onClose: () => void;

  constructor(layer: PIXI.Container, onClose: () => void) {
    this.layer = layer;
    this.buttons = [];
    this.onClose = onClose;
  }

  handleClick([x, y]: [number, number]) {
    this.buttons.forEach(([sprite, _, onClick]) => {
      console.log('detected click...')
      if (x >= sprite.x - sprite.anchor.x * sprite.width && x < sprite.x + (1 - sprite.anchor.x) * sprite.width
        && y >= sprite.y - sprite.anchor.y * sprite.height && y < sprite.y + (1 - sprite.anchor.y) * sprite.height) {
          console.log('activating a handler!');
          onClick();
        }
    })
  }

  setScreen(screen: MenuScreen) {
    this.clearButtons();
    const largeButton = GUI_TEXTURES['menu'].frames[GUI_TEXTURES['menu'].getFrameIndex('largeButton', 0)];
    if (screen === 'pause') {
      this.setButtons([
        [PIXI.Sprite.from(largeButton), 'Resume', () => this.close()],
        [PIXI.Sprite.from(largeButton), 'Controls', () => this.setScreen('controls')]
      ]);
    } else if (screen === 'controls') {
      this.setButtons([
        [PIXI.Sprite.from(largeButton), 'Back', () => this.setScreen('pause')],
        [PIXI.Sprite.from(largeButton), 'Bind', () => alert('idk man')]
      ]);
    }
  }

  private setButtons(buttons: [PIXI.Sprite, string, () => void][]) {
    this.buttons = buttons.map(([sprite, text, onClick], i) => {
      this.layer.addChild(sprite);
      sprite.anchor.set(0.5);
      sprite.scale.set(6);
      sprite.x = SCREEN_WIDTH / 2;
      sprite.y = 100 + 50 * i;
      const textbox = new TextBox(sprite.x - 60, sprite.y - 8, text, this.layer, 2);
      return [sprite, textbox, onClick];
    });
  }

  private clearButtons() {
    this.buttons.forEach(([sprite, text, _]) => {
      this.layer.removeChild(sprite);
      text.deleteSprites();
    });
    this.buttons = [];
  }

  close() {
    this.clearButtons();
    this.onClose();
  }
}