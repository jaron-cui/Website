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

type MouseClickInput = 'leftclick' | 'rightclick';
type MouseScrollInput = 'scrollup' | 'scrolldown';
type KeyChangeInput = {
  key: string;
  pressed: boolean;
};
type TypedInput = {
  key: string;
}
type InputType = MouseClickInput | MouseScrollInput | KeyChangeInput | TypedInput;
type InputListener = (
  [MouseClickInput, (screenPosition: [number, number], inputState: InputState) => void] |
  [MouseScrollInput, (inputState: InputState) => void] |
  [KeyChangeInput, (pressed: boolean, inputState: InputState) => void] |
  [TypedInput, (key: string, inputState: InputState) => void]
);

interface InputListenerSet {
  listeners: InputListener[];
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
  triggers: InputTriggers;
  inputState: InputState;

  constructor(app: PIXI.Application<HTMLCanvasElement>, game: Game) {
    this.app = app;
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
        shift: false,
        scrollUp: false,
        scrollDown: false
      }
    }
    this.triggers = game.getControlInterface(this.inputState);
  }

  updateHandlers(inputMap: InputMap) {
    this.clearHandlers();

    const leftClickTriggers: ButtonPressAction[] = [];
    const rightClickTriggers: ButtonPressAction[] = [];
    const scrollUpTriggers: ButtonPressAction[] = [];
    const scrollDownTriggers: ButtonPressAction[] = [];
    const keyboardTriggers: [string, ButtonPressAction][] = [];

    const mouseButtonTriggers: Record<string, ButtonPressAction[]> = {
      leftclick: leftClickTriggers,
      rightclick: rightClickTriggers,
      scrollup: scrollUpTriggers,
      scrolldown: scrollDownTriggers
    };

    let input: ButtonPressAction;
    for (input in inputMap) {
      const bindings = inputMap[input];
      bindings.forEach(binding => {
        const mouseButtonTrigger = mouseButtonTriggers[binding];
        mouseButtonTrigger ? mouseButtonTrigger.push(input) : keyboardTriggers.push([binding, input]);
      })
    }
    const mouseDown = () => leftClickTriggers.forEach(trigger => this.triggers.onButtonPress[trigger](true, this.inputState));
    const mouseUp = () => leftClickTriggers.forEach(trigger => this.triggers.onButtonPress[trigger](false, this.inputState));
    const rightDown = () => rightClickTriggers.forEach(trigger => this.triggers.onButtonPress[trigger](true, this.inputState));
    const rightUp = () => rightClickTriggers.forEach(trigger => this.triggers.onButtonPress[trigger](false, this.inputState));
    const keyDown = (event: KeyboardEvent) => {
      keyboardTriggers.forEach(([key, trigger]) => {
        if (event.key.toLowerCase() === key.toLowerCase()) {
          this.inputState.buttonsDown[trigger] = true;
          this.triggers.onButtonPress[trigger](true, this.inputState);
        }
      });
    }
    const keyUp = (event: KeyboardEvent) => {
      keyboardTriggers.forEach(([key, trigger]) => {
        if (event.key.toLowerCase() === key.toLowerCase()) {
          this.inputState.buttonsDown[trigger] = false;
          this.triggers.onButtonPress[trigger](false, this.inputState);
        }
      });
    }
    const scroll = (event: WheelEvent) => {
      const sign = Math.sign(event.deltaY);
      const triggers = sign > 0 ? scrollUpTriggers : scrollDownTriggers;
      triggers.forEach(trigger => {
        this.triggers.onButtonPress[trigger](true, this.inputState);
        this.triggers.onButtonPress[trigger](false, this.inputState);
      });
    };
    const mouseMove = (event: MouseEvent) => {
      this.inputState.mousePosition = [event.screenX, event.screenY];
      this.triggers.onPointerMove([event.screenX, event.screenY]);
    };

    this.app.stage.addEventListener('mousedown', mouseDown);
    this.app.stage.addEventListener('mouseup', mouseUp);
    this.app.stage.addEventListener('rightdown', rightDown);
    this.app.stage.addEventListener('rightup', rightUp);
    this.app.stage.addEventListener('wheel', scroll);
    this.app.stage.addEventListener('mousemove', mouseMove);
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);

    this.handlers.push([this.app.stage, 'mousedown', mouseDown]);
    this.handlers.push([this.app.stage, 'mouseup', mouseUp]);
    this.handlers.push([this.app.stage, 'rightdown', rightDown]);
    this.handlers.push([this.app.stage, 'rightup', rightUp]);
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