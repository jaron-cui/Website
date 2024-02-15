import * as PIXI from 'pixi.js';

export enum MouseAction {
  leftclick = 'leftclick',
  rightclick = 'rightclick',
  scrollup = 'scrollup',
  scrolldown = 'scrolldown'
}

export type InputButtonMap<T> = {
  [key in keyof T]: (MouseAction | string | 'any')[];
}

export type ActionMap<T> = {
  [key in keyof T]: (pressed: boolean, inputState: InputState<T>) => void;
}

export type InputState<T> = {
  buttons: {
    [key in keyof T]: boolean;
  };
  cursorPosition: [number, number];
}

export interface InputController<T> {
  inputButtonMap: InputButtonMap<T>;
  actions: ActionMap<T>;
  onType?: (key: string, inputState: InputState<T>) => void;
  onPointerMove?: (inputState: InputState<T>) => void;
  inputState: InputState<T>;
  enabled: boolean;
}

export class InputHandler {
  app: PIXI.Application<HTMLCanvasElement>
  handlers: [any, string, (event: any) => void][];
  // triggers: InputTriggers;
  inputListenerSets: InputController<any>[];
  cachedActions: [boolean, InputState<any>, (down: boolean, input: InputState<any>) => void][];
  cachedMouseMove: [InputState<any>, (input: InputState<any>) => void][];

  previousMousePosition: [number, number];
  currentMousePosition: [number, number];

  constructor(app: PIXI.Application<HTMLCanvasElement>) {
    this.app = app;
    this.handlers = [];
    this.inputListenerSets = [];
    this.cachedActions = [];
    this.cachedMouseMove = [];
    this.previousMousePosition = [0, 0];
    this.currentMousePosition = [0, 0];
    this.initializeHandlers();
  }

  registerInputListeners(inputListenerSet: InputController<any>) {
    this.inputListenerSets.push(inputListenerSet);
  }

  processInput() {
    this.cachedActions.forEach(([down, input, action]) => action(down, input));
    this.cachedActions = [];
    this.inputListenerSets.forEach(inputSet => inputSet.inputState.cursorPosition = this.currentMousePosition);
    this.cachedMouseMove.forEach(([input, action]) => action(input));
    this.cachedMouseMove = [];
  }

  // TODO: maybe perform grouping so that each controller isn't fully iterated through for every input
  private initializeHandlers() {
    this.clearHandlers();

    const clickHandler = (clickType: 'leftclick' | 'rightclick', down: boolean) => () => this.inputListenerSets.forEach(controller => {
      Object.entries(controller.inputButtonMap).forEach(([binding, inputs]) => {
        inputs.forEach(input => {
          if (input === clickType) {
            controller.inputState.buttons[binding] = down;
            controller.enabled && this.cachedActions.push([down, controller.inputState, controller.actions[binding]]);
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
            if (input === 'any' || (input.toLowerCase() === event.key.toLowerCase()) && controller.inputState.buttons[binding] !== down) {
              controller.inputState.buttons[binding] = down;
              controller.enabled && this.cachedActions.push([down, controller.inputState, controller.actions[binding]]);
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
              this.cachedActions.push([true, controller.inputState, controller.actions[binding]]);
              this.cachedActions.push([false, controller.inputState, controller.actions[binding]]);
            }
          })
        })
      });
    };
    const mouseMove = (event: MouseEvent) => {
      this.currentMousePosition = [event.screenX, event.screenY];
      // this.inputListenerSets.forEach(controller => {
      //   controller.onPointerMove && this.cachedMouseMove.push([controller.inputState, controller.onPointerMove]);
      // });
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