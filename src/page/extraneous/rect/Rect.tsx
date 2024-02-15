import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';
import { World, Block, Terrain, WORLD_HEIGHT, WORLD_WIDTH } from './world';
import { Renderer, loadTextures } from './render';
import { PlayerInventory } from './item';
import { Game } from './game';
import { Player } from './entity/player';
import { InputHandler } from './input';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from './constants';

const template = [
  '            x                               ',
  '            x                   t           ',
  '            x                   g             ',
  '        t   x                   bbbbbbx       ',
  '   g   ggg  x                    b            ',
  '   x     d  x            x       b     t tt   ',
  '   xx    d  x         x        x b xbbxggxggxx',
  '         b  x                  x b xsx        ',
  '         b                     x b ssx        ',
  ' xbbb    b     t   g           x b xxx        ',
  '  xxd       x xg   s           x b xxx        ',
  '  xdx              xt          x b xxx        ',
  's xdx               g          x b xdd        ',
  'x  xx               d          x b xbd        ',
  'x  xx               x          x b xbb        ',
  'xd xx                x         x b bbx        ',
  'xd                   d        tx   bbb        ',
  'xx    tt  t     ttt  d    t  ggx   bbb        ',
  'xxssxgggddsgxdxggxsdxdssxxgssssxxxxxxxxxxxxxx'
]

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

const blocks: Record<string, Block> = {
  ' ': Block.Air,
  'x': Block.Stone,
  'd': Block.Soil,
  'g': Block.Grass,
  't': Block.Grasses,
  's': Block.Sand,
  'b': Block.Brick
}

for (let y = 0; y < template.length; y += 1) {
  for (let x = 0; x < template[y].length; x += 1) {
    const block = blocks[template[template.length - y - 1][x]];
    WORLD.set(x + 5, y + 6, block);
  }
}
// WORLD.set(17, 16, Block.Soil);
// WORLD.set(22, 17, Block.Soil);
// WORLD.set(22, 18, Block.Soil);
// WORLD.set(22, 19, Block.Soil);
// WORLD.set(22, 20, Block.Soil);

// WORLD.set(19, 18, Block.Soil);
// WORLD.set(19, 19, Block.Soil);
// WORLD.set(19, 20, Block.Soil);
// WORLD.set(19, 21, Block.Soil);
// WORLD.set(19, 22, Block.Soil);
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

  const player = new Player(2, 17);

  const renderer = new Renderer(world, app);
  renderer.updateTerrain();
  const inputHandler = new InputHandler(app);
  const game = new Game(player, world, renderer, inputHandler);

  game.spawn(player);

  const inventory: PlayerInventory = {
    selected: 0,
    slots: [
      undefined,
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
    <div ref={gameRef} onContextMenu={e => e.preventDefault()} onMouseDown={e => e.preventDefault()} style={{overflowY: 'hidden'}}>
    </div>
  );
}