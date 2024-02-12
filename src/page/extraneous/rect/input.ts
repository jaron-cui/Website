import * as PIXI from 'pixi.js';
import { Game } from './game';

export const DEFAULT_INPUT_MAP: InputMap = {
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
  scrollDown: ['scrolldown', 'ArrowLeft']
};

type InputListener<T> = {
  type: 'leftclick' | 'rightclick';
  handler: (clickEnded: boolean, inputState: InputStatee<T>) => void;
} | {
  type: 'scrollup' | 'scrolldown';
  handler: (inputState: InputStatee<T>) => void;
} | {
  type: 'keyChange';
  key: string;
  handler: (pressed: boolean, inputState: InputStatee<T>) => void;
} | {
  type: 'typed';
  key: string;
  handler: (key: string, inputState: InputStatee<T>) => void;
}

type InputMapp<T> = {
  [key in keyof T]: InputListener<T>;
}

type InputStatee<T> = {
  buttons: {
    [key in keyof T]: boolean;
  };
  cursorPosition: [number, number];
}

interface InputListenerSet<T> {
  listeners: InputMapp<T>;
  inputState: InputStatee<T>;
  enabled: boolean;
}

export const EMPTY_INPUT_STATE: InputState = {
  leftClick: false,
  rightClick: false,
  mousePosition: [0, 0],
  buttonsDown: {
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
    scrollDown: false
  }
};

export interface InputState {
  leftClick: boolean;
  rightClick: boolean;
  mousePosition: [number, number];
  buttonsDown: {
    [key in ButtonPressAction]: boolean;
  }
}

type ButtonPressAction = 'useMain' | 'useSecondary' | 'up' | 'left' | 'down' | 'right' | 'jump' | 'control' | 'shift' | 'scrollUp' | 'scrollDown';

type InputMap = {
  [key in ButtonPressAction]: string[];
};

export type InputTriggers = {
  onButtonPress: {
    [key in ButtonPressAction]: (buttonDown: boolean, inputState: InputState) => void;
  }
  onType: (key: string) => void;
  onPointerMove: (screenPosition: [number, number]) => void;
}

export class InputHandler {
  app: PIXI.Application<HTMLCanvasElement>
  handlers: [any, string, (event: any) => void][];
  // triggers: InputTriggers;
  inputListenerSets: InputListenerSet<any>[];

  constructor(app: PIXI.Application<HTMLCanvasElement>) {
    this.app = app;
    this.handlers = [];
    this.inputListenerSets = [];
    this.initializeHandlers();
    // this.triggers = game.getControlInterface(this.inputState);
  }

  registerInputListeners(inputListenerSet: InputListenerSet<unknown>) {
    this.inputListenerSets.push(inputListenerSet);
  }

  private initializeHandlers() {
    this.clearHandlers();

    // const leftClickTriggers: ButtonPressAction[] = [];
    // const rightClickTriggers: ButtonPressAction[] = [];
    // const scrollUpTriggers: ButtonPressAction[] = [];
    // const scrollDownTriggers: ButtonPressAction[] = [];
    // const keyboardTriggers: [string, ButtonPressAction][] = [];

    // const mouseButtonTriggers: Record<string, ButtonPressAction[]> = {
    //   leftclick: leftClickTriggers,
    //   rightclick: rightClickTriggers,
    //   scrollup: scrollUpTriggers,
    //   scrolldown: scrollDownTriggers
    // };

    // let input: ButtonPressAction;
    // for (input in inputMap) {
    //   const bindings = inputMap[input];
    //   bindings.forEach(binding => {
    //     const mouseButtonTrigger = mouseButtonTriggers[binding];
    //     mouseButtonTrigger ? mouseButtonTrigger.push(input) : keyboardTriggers.push([binding, input]);
    //   })
    // }
    const clickHandler = (clickType: 'leftclick' | 'rightclick', down: boolean) => () => this.inputListenerSets.forEach(inputListenerSet => {
      Object.entries(inputListenerSet.listeners).forEach(([binding, listener]) => {
        if (listener.type === clickType) {
          inputListenerSet.inputState.buttons[binding] = down;
          inputListenerSet.enabled && listener.handler(!down, inputListenerSet.inputState);
        }
      });
    });
    const leftClick = clickHandler('leftclick', true);
    const leftUnClick = clickHandler('leftclick', false);
    const rightClick = clickHandler('rightclick', true);
    const rightUnClick = clickHandler('rightclick', false);
    const keyHandler = (down: boolean) => (event: KeyboardEvent) => {
      this.inputListenerSets.forEach(inputListenerSet => {
        Object.entries(inputListenerSet.listeners).forEach(([binding, listener]) => {
          if (listener.type === 'keyChange' && listener.key.toLowerCase() === event.key.toLowerCase()) {
            inputListenerSet.inputState.buttons[binding] = down;
            inputListenerSet.enabled && listener.handler(down, inputListenerSet.inputState);
          }
          // TODO: probably move this into the proper typing handler...
          if (!down && listener.type === 'typed') {
            inputListenerSet.enabled && listener.handler(event.key, inputListenerSet.inputState);
          }
        });
      });
    }
    const keyDown = keyHandler(true);
    const keyUp = keyHandler(false);

    const scroll = (event: WheelEvent) => {
      const sign = Math.sign(event.deltaY);
      this.inputListenerSets.forEach(inputListenerSet => {
        Object.entries(inputListenerSet.listeners).forEach(([binding, listener]) => {
          sign > 0 && listener.type === 'scrollup' && listener.handler(inputListenerSet.inputState);
          sign < 0 && listener.type === 'scrolldown' && listener.handler(inputListenerSet.inputState);
        })
      })
    };
    const mouseMove = (event: MouseEvent) => {
      this.inputListenerSets.forEach(inputSet => inputSet.inputState.cursorPosition = [event.screenX, event.screenY])
    };

    this.app.stage.addEventListener('mousedown', leftClick);
    this.app.stage.addEventListener('mouseup', leftUnClick);
    this.app.stage.addEventListener('rightdown', rightClick);
    this.app.stage.addEventListener('rightup', rightUnClick);
    this.app.stage.addEventListener('wheel', scroll);
    this.app.stage.addEventListener('mousemove', mouseMove);
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);

    this.handlers.push([this.app.stage, 'mousedown', leftClick]);
    this.handlers.push([this.app.stage, 'mouseup', leftUnClick]);
    this.handlers.push([this.app.stage, 'rightdown', rightClick]);
    this.handlers.push([this.app.stage, 'rightup', rightUnClick]);
    this.handlers.push([this.app.stage, 'wheel', scroll]);
    this.handlers.push([this.app.stage, 'mousemove', mouseMove]);
    this.handlers.push([document, 'keydown', keyDown]);
    this.handlers.push([document, 'keyup', keyUp]);
  }

  clearHandlers() {
    this.handlers.forEach(([container, trigger, handler]) => container.removeEventListener(trigger, handler));
    this.handlers = [];
  }
}