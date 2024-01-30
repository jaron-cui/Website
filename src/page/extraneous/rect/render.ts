import * as PIXI from 'pixi.js';
import { SpriteSet, Renderable, ArmaturePiecePose, World, renderable, Terrain, Block, WORLD_WIDTH, WORLD_HEIGHT, Entity } from "./world";
import { vertexShader, fragmentShader } from './shaders';
import { ItemStack, PlayerInventory } from './item';

export const SCREEN_WIDTH = 960;
export const SCREEN_HEIGHT = 540;
export const GRAPHICAL_SCALE = 20/8;
export const SPRITE_TEXTURES: Record<string, SpriteSet> = {};
const ITEM_TEXTURES: Record<string, SpriteSet> = {};
const GUI_TEXTURES: Record<string, SpriteSet> = {};

export const DYNAMITE_FUSE_STATES = 9;

const BLOCK_TEXTURE_SCHEMA = {
  frames: {
    0: {
      frame: { x: 0, y: 0, w: 8, h: 8 },
      sourceSize: { w: 8, h: 8 },
      spriteSourceSize: { x: 0, y: 0, w: 8, h: 8 }
    }
  },
  meta: {
    image: 'blocks.png',
    format: 'RGBA8888',
    size: { w: 8, h: 16 },
    scale: 2
  }
};

export abstract class AnimatedEntity implements Renderable {
  x: number;
  y: number;
  renderable: true;
  armaturePieceSprites: Record<string, SpriteSet>;
  
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;

    this.armaturePieceSprites = {};
    const armatureSpriteSpecification = this.specifyArmatureSprites();
    for (const armaturePiece in armatureSpriteSpecification) {
      const armaturePiecesTexture = SPRITE_TEXTURES[armatureSpriteSpecification[armaturePiece]];
      if (!armaturePiecesTexture) {
        console.error('Could not find the sprite set ' + armatureSpriteSpecification[armaturePiece]);
      }
      this.armaturePieceSprites[armaturePiece] = armaturePiecesTexture;
    }

    this.renderable = true;
  }

  protected abstract specifyArmatureSprites(): Record<string, string>;

  abstract getArmaturePoses(): Record<string, ArmaturePiecePose>;
}

function getItemFrame(item: ItemStack | undefined): number {
  const sprites = ITEM_TEXTURES[''];
  if (!item) {
    return sprites.getFrameIndex('none', 0);
  }
  switch(item.id) {
    case 'dynamite':
      const fuseMax = 9;
      const fuseState = item.data['fuse'] === undefined ? 0 : Math.floor(fuseMax * (1 - item.data['fuse']));
      console.log(fuseState + ' ' + item.data['fuse'])
      return sprites.getFrameIndex('dynamite', Math.max(0, Math.min(fuseMax, fuseState)));
    default:
      return sprites.getFrameIndex('unknown', 0);
  }
}

export function range(length: number) {
  return Array(length).fill(0).map((_, i) => i);
}

function frame(x: number, y: number, w: number, h: number) {
  return {
    frame: {x: x, y: y, w: w, h: h},
    spriteSourceSize: {x: 0, y: 0, w: w, h: h},
    sourceSize: {w: w, h: h}
  }
}

const DYNAMITE_TEXTURE_SCHEMA = {
  frames: Object.fromEntries(
    range(10).map(i => ['' + i, frame(0, 8 * i, 8, 8)])
  ),
  animations: {
    ignition: range(10).map(i => '' + i)
  },
  meta: {
    image: 'dynamite.png',
    format: 'RGBA8888',
    size: {w: 8, h: 8 * 10},
    scale: '1'
  }
};

const CHAR_COUNT = 95;

const PLAYER_TEXTURE_SCHEMA = {
  frames: Object.fromEntries(
    range(7).map(i => ['' + i, frame(12 * i, 0, 12, 16)])
  ),
  animations: {
    walk: range(7).map(i => '' + i)
  },
  meta: {
    image: 'player-legs.png',
    format: 'RGBA8888',
    size: {w: 108, h: 18},
    scale: '1'
  }
};

const GUI_TEXTURE_SCHEMA = {
  frames: {
    'unselected-slot': frame(0, 0, 10, 10),
    'selected-slot': frame(0, 10, 10, 10)
  },
  animations: {
    selected: ['selected-slot'],
    unselected: ['unselected-slot']
  },
  meta: {
    image: 'inventory.png',
    format: 'RGBA8888',
    size: {w: 8, h: 16},
    scale: '1'
  }
}

export async function loadTextures() {
  // async function loadFromSchema(spriteSet: string, schema: any) {
  //   const sprites = new PIXI.Spritesheet(PIXI.BaseTexture.from(schema.meta.image), schema);
  //   await sprites.parse();
  //   SPRITE_TEXTURES[spriteSet] = sprites.animations
  // }
  const texture = PIXI.BaseTexture.from(DYNAMITE_TEXTURE_SCHEMA.meta.image);
  texture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  const dynamiteSprites = new PIXI.Spritesheet(texture, DYNAMITE_TEXTURE_SCHEMA);
  await dynamiteSprites.parse();
  SPRITE_TEXTURES['dynamite-sprites'] = new SpriteSet({
    ignition: dynamiteSprites.animations.ignition
  });
  PIXI.utils.clearTextureCache();

  const playerLegsTex = PIXI.BaseTexture.from(PLAYER_TEXTURE_SCHEMA.meta.image);
  playerLegsTex.scaleMode = PIXI.SCALE_MODES.NEAREST;
  const playerlegSprites = new PIXI.Spritesheet(playerLegsTex, PLAYER_TEXTURE_SCHEMA);
  await playerlegSprites.parse();
  SPRITE_TEXTURES['player-legs'] = new SpriteSet({
    walk: playerlegSprites.animations.walk
  });
  PIXI.utils.clearTextureCache();

  const inventoryTex = PIXI.BaseTexture.from(GUI_TEXTURE_SCHEMA.meta.image);
  inventoryTex.scaleMode = PIXI.SCALE_MODES.NEAREST;
  const inventorySprites = new PIXI.Spritesheet(inventoryTex, GUI_TEXTURE_SCHEMA);
  await inventorySprites.parse();
  GUI_TEXTURES['inventory'] = new SpriteSet({
    selected: inventorySprites.animations.selected,
    unselected: inventorySprites.animations.unselected
  });
  PIXI.utils.clearTextureCache();

  const itemSprites = new SpriteSet({
    dynamite: dynamiteSprites.animations.ignition,
    unknown: [PIXI.Texture.from('unknown.png')],
    none: [PIXI.Texture.EMPTY]
  });
  ITEM_TEXTURES[''] = itemSprites;
}

function convertTerrainDataToTexture(terrain: Terrain): PIXI.BaseTexture<PIXI.BufferResource, PIXI.IAutoDetectOptions> {
  const data = PIXI.BaseTexture.fromBuffer(terrain.blocks, terrain.w, terrain.h, { format: PIXI.FORMATS.ALPHA, type: PIXI.TYPES.UNSIGNED_BYTE });
  data.wrapMode = PIXI.WRAP_MODES.CLAMP;
  data.mipmap = PIXI.MIPMAP_MODES.OFF;
  data.scaleMode = PIXI.SCALE_MODES.NEAREST;
  return data;
}

function createInitialUniforms() {
  const blockTextures = PIXI.Texture.from('blocks2.png');
  blockTextures.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  return {
    uBlockTextures: blockTextures,
    uScreenSize: [SCREEN_WIDTH, SCREEN_HEIGHT],
    uBlockOffset: [0, 0],
    uGridSize: [WORLD_WIDTH, WORLD_HEIGHT],
    uBlockSize: 20,
    uBlockTypes: Object.keys(Block).length / 2 - 1,
    uTerrain: null,
    wind: 0
  };
}

const geometry = new PIXI.Geometry()
  .addAttribute('aVertexPosition', // the attribute name
    [-1, -1, // x, y
      1, -1, // x, y
      1, 1,
      -1, 1], // x, y
    2) // the size of the attribute
  .addAttribute('aUvs', // the attribute name
    [0, 0, // u, v
      1, 0, // u, v
      1, 1,
      0, 1], // u, v
    2) // the size of the attribute
.addIndex([0, 1, 2, 0, 2, 3]);

class Armature {
  x!: number;
  y!: number;
  pieces: Record<string, PIXI.AnimatedSprite>;
  template: Record<string, SpriteSet>;

  constructor(
    x: number, y: number, template: Record<string, SpriteSet>, app: PIXI.Application<HTMLCanvasElement>
  ) {
    this.pieces = {};
    this.template = template;
    for (const bone in template) {
      const sprite = new PIXI.AnimatedSprite(template[bone].frames, false);
      sprite.anchor.set(0.5);
      sprite.scale.set(20/8);
      this.pieces[bone] = sprite;
      app.stage.addChild(sprite);
    }
    // initial default pose
    this.pose(x, y, Object.fromEntries([...Object.keys(template).map(bone => [bone, {
      rx: 0,
      ry: 0,
      animation: template[bone].animations[0],
      frame: 0
    }] as [string, ArmaturePiecePose])]));
  }

  pose(x: number, y: number, poses: Record<string, ArmaturePiecePose>) {
    this.x = x;
    this.y = y;
    for (const bone in poses) {
      const piece = this.pieces[bone];
      if (!piece) {
        continue;
      }
      const pose = poses[bone];

      piece.x = (this.x + (pose.rx || 0) + 0.5) * 20;
      piece.y = SCREEN_HEIGHT - (this.y + (pose.ry || 0) + 0.5) * 20;

      piece.currentFrame = this.template[bone].getFrameIndex(pose.animation, pose.frame);

      piece.scale.set(
        pose.scaleX === undefined ? piece.scale.x : pose.scaleX * GRAPHICAL_SCALE,
        pose.scaleY === undefined ? piece.scale.y : pose.scaleY * GRAPHICAL_SCALE
      );
    }
  }

  // TODO: implement
  // deleteSprites() {
    
  // }
}

interface InventorySlotSprites {
  slot: PIXI.AnimatedSprite;
  item: PIXI.AnimatedSprite;
}

export class Renderer {
  app: PIXI.Application<HTMLCanvasElement>;

  time: number;
  world: World;
  terrainLayer: PIXI.Mesh<PIXI.Shader>;
  entityArmatures: Map<number, Armature>;
  inventorySlots: InventorySlotSprites[];

  constructor(world: World, app: PIXI.Application<HTMLCanvasElement>) {
    this.app = app;
    this.world = world;

    this.time = 0;

    const shader = PIXI.Shader.from(vertexShader, fragmentShader, createInitialUniforms());
    this.terrainLayer = new PIXI.Mesh(geometry, shader);
    this.terrainLayer.position.set(0, 0);
    this.terrainLayer.scale.set(2);
    this.app.stage.addChild(this.terrainLayer);

    this.entityArmatures = new Map();
    this.inventorySlots = [];
  }

  updateInventory(inventory: PlayerInventory) {
    const SLOT_SIZE = 10;
    const scale = 3;
    // console.log(JSON.stringify(inventory));
    // remove extraneous inventory slots
    for (let i = this.inventorySlots.length - 1; i >= inventory.slots.length; i -= 1) {
      this.app.stage.removeChild(this.inventorySlots[i].slot);
      this.app.stage.removeChild(this.inventorySlots[i].item);
      this.inventorySlots.pop();
    }
    for (let i = 0; i < inventory.slots.length; i += 1) {
      // add missing inventory slots
      if (i >= this.inventorySlots.length) {
        const slotSprite = new PIXI.AnimatedSprite(GUI_TEXTURES['inventory'].frames, false);
        const itemSprite = new PIXI.AnimatedSprite(ITEM_TEXTURES[''].frames);
        slotSprite.x = scale * SLOT_SIZE * (i + 0.5);
        slotSprite.y = scale * SLOT_SIZE * (0.5);
        slotSprite.scale.set(scale);
        slotSprite.anchor.set(0.5);
        itemSprite.x = scale * SLOT_SIZE * (i + 0.5);
        itemSprite.y = scale * SLOT_SIZE * (0.5);
        itemSprite.scale.set(scale);
        itemSprite.anchor.set(0.5);
        this.app.stage.addChild(slotSprite, itemSprite);
        this.inventorySlots.push({ slot: slotSprite, item: itemSprite });
      }
      // set selection indicator
      const selection = i === inventory.selected ? 'selected' : 'unselected';
      const sprites = this.inventorySlots[i];
      sprites.slot.currentFrame = GUI_TEXTURES['inventory'].getFrameIndex(selection, 0);
      sprites.item.currentFrame = getItemFrame(inventory.slots[i]);
    }
  }

  updateTerrain() {
    this.terrainLayer.shader.uniforms.uTerrain = convertTerrainDataToTexture(this.world.terrain);
  }

  updateEntities() {
    for (const i of this.entityArmatures.keys()) {
      const thing = this.world.things.get(i);
      if (!thing) {
        const removedArmature = this.entityArmatures.get(i) as Armature;
        for (const bone in removedArmature.pieces) {
          this.app.stage.removeChild(removedArmature.pieces[bone]);
        }
        this.entityArmatures.delete(i);
        continue;
      }
    }
    for (const i of this.world.things.keys()) {
      const thing = this.world.things.get(i) as Entity;
      if (!renderable(thing)) {
        continue;
      }
      let armature = this.entityArmatures.get(i);
      if (!armature) {
        armature = new Armature(thing.x, thing.y, thing.armaturePieceSprites, this.app);
        this.entityArmatures.set(i, armature);
      }
      armature.pose(thing.x, thing.y, thing.getArmaturePoses());
    }
  }

  updateAmbient() {
    this.time += 1;
    this.terrainLayer.shader.uniforms.wind = Math.sin(this.time / 30) * 2.2;
  }
}
