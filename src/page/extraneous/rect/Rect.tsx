import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';
import { World, Block, Terrain, WORLD_HEIGHT, WORLD_WIDTH } from './world';
import { Renderer, SCREEN_HEIGHT, SCREEN_WIDTH, loadTextures } from './render';
import { PlayerInventory } from './item';
import { Game } from './game';
import { Player } from './entity/player';
import { Dynamite } from "./entity/dynamite";
import { DEFAULT_INPUT_MAP, InputHandler } from './input';

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

async function createApp(): Promise<PIXI.Application<HTMLCanvasElement>> {
  const app = new PIXI.Application<HTMLCanvasElement>({ background: '#7acdeb', width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
  // app.renderer.addListener('mousepos', (event: MouseEvent) => console.log(event.clientX));
  let t = 0;
  // Listen for animate update
  app.ticker.minFPS = 40;
  app.ticker.maxFPS = 40;

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  const world = new World(WORLD);

  await loadTextures();

  const player = new Player(16, 24);

  const renderer = new Renderer(world, app);
  renderer.updateTerrain();
  const game = new Game(player, world, renderer);

  const inputHandler = new InputHandler(app, game);
  inputHandler.updateHandlers(DEFAULT_INPUT_MAP);

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
      {
        id: 'pickaxe',
        quantity: 1,
        data: {}
      },
      undefined,
      undefined
    ]
  };
  player.data.inventory = inventory;

  app.ticker.add((delta: number) => {
    game.tick();
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