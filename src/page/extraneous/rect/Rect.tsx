import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';
import { World, Block, Terrain, WORLD_HEIGHT, WORLD_WIDTH } from './world';
import { Renderer, SCREEN_HEIGHT, SCREEN_WIDTH, loadTextures } from './render';
import TypingHandler from '../../../component/TypingHandler';
import { PlayerInventory, handleSlotUse } from './item';
import { mod } from '../../../util/util';
import { Game } from './game';
import { Player } from './entity/player';
import { Dynamite } from "./entity/dynamite";
import { DEFAULT_INPUT_MAP, InputHandler, InputState, InputTriggers } from './input';

const WORLD = new Terrain(WORLD_WIDTH, WORLD_HEIGHT);
for (let x = 0; x < WORLD_WIDTH; x += 1) {
  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    if (y < 10) {
      WORLD.set(x, y, Block.Soil);
    } else if (y < 15) {
      WORLD.set(x, y, Block.Stone);
    } else if (y < 16) {
      WORLD.set(x, y, Block.Grass);
    } else if (y < 17) {
      WORLD.set(x, y, Block.Grasses);
    } else {
      WORLD.set(x, y, Block.Air);
    }
  }
}
WORLD.set(17, 16, Block.Soil);
WORLD.set(22, 17, Block.Soil);
WORLD.set(22, 18, Block.Soil);
WORLD.set(22, 19, Block.Soil);
WORLD.set(22, 20, Block.Soil);

WORLD.set(19, 18, Block.Soil);
WORLD.set(19, 19, Block.Soil);
WORLD.set(19, 20, Block.Soil);
WORLD.set(19, 21, Block.Soil);
WORLD.set(19, 22, Block.Soil);
const worldData = PIXI.BaseTexture.fromBuffer(WORLD.blocks, WORLD.w, WORLD.h, { format: PIXI.FORMATS.ALPHA, type: PIXI.TYPES.UNSIGNED_BYTE });
worldData.wrapMode = PIXI.WRAP_MODES.CLAMP;
worldData.mipmap = PIXI.MIPMAP_MODES.OFF;
worldData.scaleMode = PIXI.SCALE_MODES.NEAREST;

interface UserInputs {
  // left and right click, respectively
  useMain: boolean;
  useSecondary: boolean;
  // integer representing number of scrolls where positive is up
  scroll: number;
  // pointer position on screen where 0 represents bottom or left and 1 represents top or right
  pointerX: number;
  pointerY: number;

  // directional inputs
  right: boolean;
  left: boolean;
  up: boolean;
  down: boolean;

  jump: boolean;

  // ctrl + shift
  control: boolean;
  shift: boolean;
}

async function createApp(): Promise<PIXI.Application<HTMLCanvasElement>> {
  const app = new PIXI.Application<HTMLCanvasElement>({ background: '#7acdeb', width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
  // app.renderer.addListener('mousepos', (event: MouseEvent) => console.log(event.clientX));
  let t = 0;
  // Listen for animate update
  app.ticker.minFPS = 40;
  app.ticker.maxFPS = 40;

  const world = new World(WORLD);

  await loadTextures();

  const player = new Player(16, 24);

  const renderer = new Renderer(world, app);
  renderer.updateTerrain();
  const game = new Game(player, world, renderer);

  const d = new Dynamite(14, 24);
  d.data.vx = -0.01;
  game.spawn(d);
  game.spawn(player);

  const inventory: PlayerInventory = {
    selected: 0,
    slots: [
      {
        id: 'dynamite',
        quantity: 5,
        data: {}
      },
      undefined,
      undefined,
      undefined
    ]
  };
  player.data.inventory = inventory;

  app.ticker.add((delta: number) => {
    t += 1;
    if (t % 1 !== 0) {
      return;
    }
    // renderer.updateAmbient();
    // renderer.updateEntities();
    // renderer.updateInventory(player.inventory);
    // //quad.shader.uniforms.wind = Math.sin(t / 30) * 2.2;
    // stepPhysics(world);
    game.tick();
    // if (t % 100 === 0) {
    //   (world.things.get(0) as Inertial).vy = 1;
    // }
    if (t % 10 === 0) {
      // thing.fuse += 1;
      // thing.fuse = thing.fuse % 10;
    }
    // if (t % 2 === 0) {
    //   player.walkStage += 1;
    // player.walkStage = player.walkStage % 7;
    // }
    // console.log(thing.fuse)
  });

  const inputHandler = new InputHandler(app, game.getControlInterface());
  inputHandler.updateHandlers(DEFAULT_INPUT_MAP);

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.addEventListener('wheel', (event: WheelEvent) => {
    const sign = Math.sign(event.deltaY);
    inventory.selected = mod((inventory.selected + sign), inventory.slots.length);
    renderer.updateInventory(inventory);
  });
  return app;
};

export const Rect = () => {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const myDomElement = createApp();
    
    myDomElement.then((app) => {
      gameRef.current?.appendChild(app.view);
    });
 
    return () => {
      myDomElement.then((app) => {
        gameRef.current?.removeChild(app.view);
        app.destroy();
      });
    };
  }, []);

  return (
    <div ref={gameRef} onContextMenu={e => e.preventDefault()} onMouseDown={e => e.preventDefault()}>
    </div>
  );
}