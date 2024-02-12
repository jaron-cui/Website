import * as PIXI from 'pixi.js';
import { Game } from './game';



export enum MouseAction {
  leftclick = 'leftclick',
  rightclick = 'rightclick',
  scrollup = 'scrollup',
  scrolldown = 'scrolldown'
}

export type InputButtonMap<T> = {
  [key in keyof T]: (MouseAction | string)[];
}

export type ActionMap<T> = {
  [key in keyof T]: (pressed: boolean, inputState: InputStatee<T>) => void;
}

// function convertActionsToListeners<T>(actionMap: ActionMap<T>, inputMap: InputButtonMap<T>): InputListenerSet<T> {
//   const bindings = Object.keys(actionMap) as (keyof T)[];
//   const buttons = {};
//   bindings.forEach(binding => {
//     inputMap[binding].forEach(input => {
//       buttons[]
//     })
//   })
//   return {
//     buttons: Object.fromEntries(bindings.map(binding => {
//       const inputs = inputMap[binding];
//       inputs.forEach(input => {

//       })
//       return [binding, inputMap[binding]];
//     }))
//   }
// }

// type InputListener<T> = {
//   type: 'leftclick' | 'rightclick';
//   handler: (pressed: boolean, inputState: InputStatee<T>) => void;
// } | {
//   type: 'scrollup' | 'scrolldown';
//   handler: (inputState: InputStatee<T>) => void;
// } | {
//   type: 'keyChange';
//   key: string;
//   handler: (pressed: boolean, inputState: InputStatee<T>) => void;
// }

export type InputStatee<T> = {
  buttons: {
    [key in keyof T]: boolean;
  };
  cursorPosition: [number, number];
}

export interface InputController<T> {
  inputButtonMap: InputButtonMap<T>;
  actions: ActionMap<T>;
  onType?: (key: string, inputState: InputStatee<T>) => void;
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

// type InputMap = {
//   [key in ButtonPressAction]: string[];
// };

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
  inputListenerSets: InputController<any>[];

  constructor(app: PIXI.Application<HTMLCanvasElement>) {
    this.app = app;
    this.handlers = [];
    this.inputListenerSets = [];
    this.initializeHandlers();
    // this.triggers = game.getControlInterface(this.inputState);
  }

  registerInputListeners(inputListenerSet: InputController<any>) {
    this.inputListenerSets.push(inputListenerSet);
  }

  // TODO: maybe perform grouping so that each controller isn't fully iterated through for every input
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
    const clickHandler = (clickType: 'leftclick' | 'rightclick', down: boolean) => () => this.inputListenerSets.forEach(controller => {
      Object.entries(controller.inputButtonMap).forEach(([binding, inputs]) => {
        inputs.forEach(input => {
          if (input === clickType) {
            controller.inputState.buttons[binding] = down;
            controller.enabled && controller.actions[binding](down, controller.inputState);
          }
        })
      });
    });
    const leftClick = clickHandler('leftclick', true);
    const leftUnClick = clickHandler('leftclick', false);
    const rightClick = clickHandler('rightclick', true);
    const rightUnClick = clickHandler('rightclick', false);
    const keyHandler = (down: boolean) => (event: KeyboardEvent) => {
      this.inputListenerSets.forEach(controller => {
        // TODO: probably move this into the proper typing handler...
        if (!down) {
          controller.enabled && controller.onType && controller.onType(event.key, controller.inputState);
        }
        Object.entries(controller.inputButtonMap).forEach(([binding, inputs]) => {
          inputs.forEach(input => {
            if (input.toLowerCase() === event.key.toLowerCase()) {
              controller.inputState.buttons[binding] = down;
              controller.enabled && controller.actions[binding](down, controller.inputState);
            }
          })
        });
      });
    }
    const keyDown = keyHandler(true);
    const keyUp = keyHandler(false);

    const scroll = (event: WheelEvent) => {
      const sign = Math.sign(event.deltaY);
      this.inputListenerSets.forEach(controller => {
        Object.entries(controller.inputButtonMap).forEach(([binding, inputs]) => {
          inputs.forEach(input => {
            if ((sign > 0 && input === MouseAction.scrollup) || (sign < 0 && input === MouseAction.scrolldown)) {
              controller.actions[binding](true, controller.inputState);
              controller.actions[binding](false, controller.inputState);
            }
          })
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