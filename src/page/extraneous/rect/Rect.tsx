import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';
import { Inertial, World, Block, Terrain, WORLD_HEIGHT, WORLD_WIDTH } from './world';
import { Renderer, SCREEN_HEIGHT, SCREEN_WIDTH, loadTextures } from './render';
import { stepPhysics } from './physics';
import { Dynamite, Player } from './entity';

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
const worldData = PIXI.BaseTexture.fromBuffer(WORLD.blocks, WORLD.w, WORLD.h, { format: PIXI.FORMATS.ALPHA, type: PIXI.TYPES.UNSIGNED_BYTE });
worldData.wrapMode = PIXI.WRAP_MODES.CLAMP;
worldData.mipmap = PIXI.MIPMAP_MODES.OFF;
worldData.scaleMode = PIXI.SCALE_MODES.NEAREST;


async function createApp() {
  const app = new PIXI.Application<HTMLCanvasElement>({ background: '#1099bb', width: SCREEN_WIDTH, height: SCREEN_HEIGHT });

  // app.stage.addChild(quad);
  let t = 0;
  // Listen for animate update
  app.ticker.minFPS = 40;
  app.ticker.maxFPS = 40;

  const world = new World(WORLD);
  const obj: Inertial = {
    inertial: true,
    physical: true,
    id: 0,
    x: 10,
    y: 26,
    vx: 0,
    vy: 0,
    w: 1,
    h: 2,
    mass: 1
  }
  world.things.set(0, obj);

  const sprite = PIXI.Sprite.from('player.png');
  sprite.anchor.set(0.5);
  sprite.scale.set(20/8);
  sprite.texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  app.stage.addChild(sprite);

  await loadTextures();
  
  const thing = new Dynamite(1, 14, 24);
  world.things.set(1, thing);

  const player = new Player(2, 16, 24);
  world.things.set(2, player);

  const renderer = new Renderer(world, app);
  renderer.updateTerrain();

  app.ticker.add((delta: number) => {
    t += 1;
    renderer.updateAmbient();
    renderer.updateEntities();
    //quad.shader.uniforms.wind = Math.sin(t / 30) * 2.2;
    stepPhysics(world);
    sprite.x = (world.things.get(0)?.x as number + 1) * 20;
    sprite.y = SCREEN_HEIGHT - (world.things.get(0)?.y as number + 1) * 20;
    if (t % 100 === 0) {
      (world.things.get(0) as Inertial).vy = 1;
    }
    if (t % 10 === 0) {
      thing.fuse += 1;
      thing.fuse = thing.fuse % 12;
    }
    if (t % 2 === 0) {
      player.walkStage += 1;
    player.walkStage = player.walkStage % 7;
    }
    // console.log(thing.fuse)
  });
  return app;
};

export const Rect = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const myDomElement = createApp();
    
    myDomElement.then(app => {
      ref.current?.appendChild(app.view);
    });
 
    return () => {
      myDomElement.then(app => {
        ref.current?.removeChild(app.view);
        app.destroy();
      });
    };
  }, []);

  return <div ref={ref}></div>;
}