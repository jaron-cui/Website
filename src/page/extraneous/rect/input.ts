import * as PIXI from 'pixi.js';

export const DEFAULT_INPUT_MAP: InputMap = {
  useMain: 'leftclick',
  useSecondary: 'rightclick',
  up: 'w',
  left: 'a',
  down: 's',
  right: 'd',
  jump: 'w',
  control: 'Control',
  shift: 'Shift'
};

export interface InputState {
  leftClick: boolean;
  rightClick: boolean;
  mousePosition: [number, number];
  buttonsDown: {
    [key in ButtonPressAction]: boolean;
  }
}

type ButtonPressAction = 'useMain' | 'useSecondary' | 'up' | 'left' | 'down' | 'right' | 'jump' | 'control' | 'shift';

type InputMap = {
  [key in ButtonPressAction]: string;
};

export type InputTriggers = {
  onButtonPress: {
    [key in ButtonPressAction]: (buttonDown: boolean, inputState: InputState) => void;
  }
  onType: (key: string) => void;
}

export class InputHandler {
  app: PIXI.Application<HTMLCanvasElement>
  handlers: [any, string, (event: any) => void][];
  triggers: InputTriggers;
  inputState: InputState;

  constructor(app: PIXI.Application<HTMLCanvasElement>, triggers: InputTriggers) {
    this.app = app;
    this.triggers = triggers;
    this.handlers = [];
    this.inputState = {
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
        shift: false
      }
    }
  }

  updateHandlers(inputMap: InputMap) {
    this.clearHandlers();

    const leftClickTriggers: ButtonPressAction[] = [];
    const rightClickTriggers: ButtonPressAction[] = [];
    const keyboardTriggers: [string, ButtonPressAction][] = [];

    let input: ButtonPressAction;
    for (input in inputMap) {
      const binding = inputMap[input];
      const mouseTriggers = {leftclick: leftClickTriggers, rightclick: rightClickTriggers}[binding];
      mouseTriggers ? mouseTriggers.push(input) : keyboardTriggers.push([binding, input]);
    }
    const mouseDown = () => leftClickTriggers.forEach(trigger => this.triggers.onButtonPress[trigger](true, this.inputState));
    const mouseUp = () => leftClickTriggers.forEach(trigger => this.triggers.onButtonPress[trigger](false, this.inputState));
    const rightDown = () => rightClickTriggers.forEach(trigger => this.triggers.onButtonPress[trigger](true, this.inputState));
    const rightUp = () => rightClickTriggers.forEach(trigger => this.triggers.onButtonPress[trigger](false, this.inputState));
    const keyDown = (event: KeyboardEvent) => {
      keyboardTriggers.forEach(([key, trigger]) => {
        if (event.key === key) {
          this.inputState.buttonsDown[trigger] = true;
          this.triggers.onButtonPress[trigger](true, this.inputState);
        }
      });
    }
    const keyUp = (event: KeyboardEvent) => {
      keyboardTriggers.forEach(([key, trigger]) => {
        if (event.key === key) {
          this.inputState.buttonsDown[trigger] = false;
          this.triggers.onButtonPress[trigger](false, this.inputState);
        }
      });
    }

    this.app.stage.addEventListener('mousedown', mouseDown);
    this.app.stage.addEventListener('mouseup', mouseUp);
    this.app.stage.addEventListener('rightdown', rightDown);
    this.app.stage.addEventListener('rightup', rightUp);
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);

    this.handlers.push([this.app.stage, 'mousedown', mouseDown]);
    this.handlers.push([this.app.stage, 'mouseup', mouseUp]);
    this.handlers.push([this.app.stage, 'rightdown', rightDown]);
    this.handlers.push([this.app.stage, 'rightup', rightUp]);
    this.handlers.push([document, 'keydown', keyDown]);
    this.handlers.push([this.app.stage, 'keyup', keyUp]);
  }

  clearHandlers() {
    this.handlers.forEach(([container, trigger, handler]) => container.removeEventListener(trigger, handler));
    this.handlers = [];
  }
}