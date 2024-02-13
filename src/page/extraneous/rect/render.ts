import * as PIXI from 'pixi.js';
import { SpriteSet, ArmaturePiecePose, World, Terrain, Block, WORLD_WIDTH, WORLD_HEIGHT } from "./world";
import { vertexShader, fragmentShader } from './shaders';
import { ItemStack, PlayerInventory } from './item';
// BEGIN EXPERIMENT IMPORTS
import { Entity } from './entity';
import { GRAVITY } from './physics';
import { PlayerData } from './entity/player';
import { ActionMap, InputState } from './input';
import { MenuController, navigateMain } from './menu';
import { GRAPHICAL_SCALE, SCREEN_HEIGHT, SCREEN_WIDTH } from './constants';
// END EXPERIMENT IMPORTS

export const SPRITE_TEXTURES: Record<string, SpriteSet> = {};
const ITEM_TEXTURES: Record<string, SpriteSet> = {};
export const GUI_TEXTURES: Record<string, SpriteSet> = {};

export const DYNAMITE_FUSE_STATES = 9;

export function gameToScreenPosition([x, y]: [number, number]): [number, number] {
  return [(x + 0.5) * 20, SCREEN_HEIGHT - (y + 0.5) * 20];
}
export function screenToGamePosition([x, y]: [number, number]): [number, number] {
  return [x / 20 - 0.5, (SCREEN_HEIGHT - y) / 20 - 0.5];
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
      // console.log(fuseState + ' ' + item.data['fuse'])
      return sprites.getFrameIndex('dynamite', Math.max(0, Math.min(fuseMax, fuseState)));
    case 'pickaxe':
      return sprites.getFrameIndex('pickaxe', 0);
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
const FONT_TEXTURE_SCHEMA = {
  frames: Object.fromEntries(
    range(CHAR_COUNT).map(i => ['' + i, frame(0, 9 * i, 7, 9)])
  ),
  animations: {
    characters: range(CHAR_COUNT).map(i => '' + i)
  },
  meta: {
    image: 'font.png',
    format: 'RGBA8888',
    size: {w: 7, h: CHAR_COUNT * 9},
    scale: '1'
  }
};

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

const TOOL_TEXTURE_SCHEMA = {
  frames: {
    'pickaxe': frame(0, 0, 8, 8),
    'spear': frame(0, 8, 8, 8),
    'knife': frame(0, 16, 8, 8),
    'rapier': frame(0, 24, 8, 8),
    'broadsword': frame(0, 32, 8, 8)
  },
  meta: {
    image: 'tool.png',
    format: 'RGBA8888',
    size: {w: 8, h: 40},
    scale: '1'
  }
}

const MENU_TEXTURE_SCHEMA = {
  frames: {
    largeButton: frame(0, 0, 32, 8),
    addButton: frame(0, 8, 7, 7),
    minusButton: frame(7, 8, 7, 7)
  },
  meta: {
    image: 'menubuttons.png',
    format: 'RGBA8888',
    size: {w: 32, h: 32},
    scale: '1'
  }
}

export async function loadTextures() {
  // PIXI.settings.ROUND_PIXELS = true;
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

  const fontText = PIXI.BaseTexture.from(FONT_TEXTURE_SCHEMA.meta.image);
  fontText.scaleMode = PIXI.SCALE_MODES.NEAREST;
  const fontSprites = new PIXI.Spritesheet(fontText, FONT_TEXTURE_SCHEMA);
  await fontSprites.parse();
  GUI_TEXTURES['font'] = new SpriteSet({
    characters: fontSprites.animations.characters
  });
  PIXI.utils.clearTextureCache();

  const toolTex = PIXI.BaseTexture.from(TOOL_TEXTURE_SCHEMA.meta.image);
  toolTex.scaleMode = PIXI.SCALE_MODES.NEAREST;
  const toolSprites = new PIXI.Spritesheet(toolTex, TOOL_TEXTURE_SCHEMA);
  await toolSprites.parse();

  const itemSprites = new SpriteSet({
    dynamite: dynamiteSprites.animations.ignition,
    pickaxe: [toolSprites.textures['pickaxe']],
    spear: [toolSprites.textures['spear']],
    knife: [toolSprites.textures['knife']],
    rapier: [toolSprites.textures['rapier']],
    broadsword: [toolSprites.textures['broadsword']],
    unknown: [PIXI.Texture.from('unknown.png')],
    none: [PIXI.Texture.EMPTY]
  });
  ITEM_TEXTURES[''] = itemSprites;

  const menuTex = PIXI.BaseTexture.from(MENU_TEXTURE_SCHEMA.meta.image);
  menuTex.scaleMode = PIXI.SCALE_MODES.NEAREST;
  const menuSprites = new PIXI.Spritesheet(menuTex, MENU_TEXTURE_SCHEMA);
  await menuSprites.parse();
  GUI_TEXTURES['menu'] = new SpriteSet(Object.fromEntries(Object.entries(menuSprites.textures).map(([name, texture]) => [name, [texture]])))
}

function convertTerrainDataToTexture(terrain: Terrain): PIXI.BaseTexture<PIXI.BufferResource, PIXI.IAutoDetectOptions> {
  const data = PIXI.BaseTexture.fromBuffer(terrain.blocks, terrain.w, terrain.h, { format: PIXI.FORMATS.ALPHA, type: PIXI.TYPES.UNSIGNED_BYTE });
  data.wrapMode = PIXI.WRAP_MODES.CLAMP;
  data.mipmap = PIXI.MIPMAP_MODES.OFF;
  data.scaleMode = PIXI.SCALE_MODES.NEAREST;
  return data;
}

function createInitialUniforms() {
  const blockTextures = PIXI.Texture.from('blocks3.png');
  blockTextures.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  return {
    uBlockTextures: blockTextures,
    uScreenSize: [SCREEN_WIDTH, SCREEN_HEIGHT],
    uBlockOffset: [0, 0],
    uGridSize: [WORLD_WIDTH, WORLD_HEIGHT],
    uBlockSize: 20,
    uBlockTypes: 5,
    uTerrain: null,
    wind: 0
  };
}

export class TextBox {
  x: number;
  y: number;
  scale: number;
  text: string;
  sprites: PIXI.Sprite[];
  layer: PIXI.Container;

  constructor(x: number, y: number, text: string, layer: PIXI.Container, scale?: number) {
    this.x = x;
    this.y = y;
    this.scale = scale || 1;
    this.text = text;
    this.sprites = [];
    this.layer = layer;
    this.rerender();
  }

  modify(newText?: string, x?: number, y?: number, scale?: number) {
    let modified = false;
    if (newText !== undefined) {
      this.text = newText;
      modified = true;
    }
    if (x !== undefined) {
      this.x = x;
      modified = true;
    }
    if (y !== undefined) {
      this.y = y;
      modified = true;
    }
    if (scale !== undefined) {
      this.scale = scale;
      modified = true;
    }
    if (modified) {
      this.rerender();
    }
  }

  private rerender() {
    this.deleteSprites();
    for (let i = 0; i < this.text.length; i += 1) {
      const character = this.text.charCodeAt(i);
      const sprite = PIXI.Sprite.from(GUI_TEXTURES['font'].frames[character - 32]);
      sprite.x = this.x + this.scale * 7 * i;
      sprite.y = this.y;
      sprite.scale.set(this.scale);
      this.layer.addChild(sprite);
      this.sprites.push(sprite);
    }
  }

  deleteSprites() {
    this.sprites.forEach(sprite => this.layer.removeChild(sprite));
    this.sprites = [];
  }
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
      const [screenX, screenY] = gameToScreenPosition([this.x + (pose.rx || 0), this.y + (pose.ry || 0)]);
      piece.x = screenX;
      piece.y = screenY;

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

interface TrajectoryParameters {
  x: number;
  y: number;
  pointCount: number;
  function: (i: number, count: number) => [number, number];
}

interface TrajectorySprites {
  spriteGroup: PIXI.ParticleContainer;
  sprites: PIXI.Sprite[];
}

function getThrowingTrajectory(theta: number, strength: number): (i: number, count: number) => [number, number] {
  const maxTime = 24;
  return (i: number, count: number) => {
    const fraction = i / count;
    const t = fraction * maxTime;
    // console.log(i + ' ' + t + ' ' + (strength * t * Math.cos(theta)) + ' ' + (GRAVITY * t * t / 2 + strength * t * Math.sin(theta)));
    return [strength * t * Math.cos(theta), GRAVITY * t * t / 2 + strength * t * Math.sin(theta)];
  }
}

interface InventorySlotSprites {
  slot: PIXI.AnimatedSprite;
  item: PIXI.AnimatedSprite;
  count: TextBox;
}

export class Renderer {
  app: PIXI.Application<HTMLCanvasElement>;

  time: number;
  world: World;
  terrainLayer: PIXI.Mesh<PIXI.Shader>;
  menuLayer: PIXI.Container;
  entityArmatures: Map<number, Armature>;
  inventorySlots: InventorySlotSprites[];
  trajectorySprites: TrajectorySprites;

  constructor(world: World, app: PIXI.Application<HTMLCanvasElement>) {
    this.app = app;
    this.world = world;

    this.time = 0;
    const baseFilter = new PIXI.Filter();
    const filter = new PIXI.ColorMatrixFilter();
    filter.desaturate();
    const filter2 = new PIXI.BlurFilter(2);
    this.app.stage.filters = [baseFilter, filter, filter2];
    filter.enabled = false;
    filter2.enabled = false;
    this.app.stage.filterArea = this.app.renderer.screen;

    const shader = PIXI.Shader.from(vertexShader, fragmentShader, createInitialUniforms());
    this.terrainLayer = new PIXI.Mesh(geometry, shader);
    this.terrainLayer.position.set(0, 0);
    this.terrainLayer.scale.set(2);
    const terrainLayer = new PIXI.Container();
    this.app.stage.addChild(terrainLayer);
    terrainLayer.addChild(this.terrainLayer);
    // terrainLayer.filters = [filter];

    this.entityArmatures = new Map();
    this.inventorySlots = [];
    // testing
    const text = new TextBox(100, 100, 'Hey! This text is a test of my {([<custom font>]})! 100% $!^.":=+', app.stage, 1.4);
    
    const particles = new PIXI.ParticleContainer();
    this.app.stage.addChild(particles);
    this.trajectorySprites = {
      sprites: [],
      spriteGroup: particles
    }
    this.menuLayer = new PIXI.Container();
    this.app.stage.addChild(this.menuLayer);
  }

  updateThrowingTrajectory(player: PlayerData) {
    this.updateTrajectory({
      x: player.x,
      y: player.y,
      pointCount: player.aimTheta === undefined ? 0 : 10,
      function: getThrowingTrajectory(player.aimTheta || 0, player.aimEffort)
    })
  }

  updateTrajectory(trajectory: TrajectoryParameters) {
    for (let i = this.trajectorySprites.sprites.length; i < trajectory.pointCount; i += 1) {
      const sprite = PIXI.Sprite.from('point.png');
      this.trajectorySprites.spriteGroup.addChild(sprite);
      this.trajectorySprites.sprites.push(sprite);
    }
    for (let i = this.trajectorySprites.sprites.length - 1; i >= trajectory.pointCount; i -= 1) {
      const sprite = this.trajectorySprites.sprites.pop();
      sprite && this.trajectorySprites.spriteGroup.removeChild(sprite);
    }
    this.trajectorySprites.sprites.forEach((sprite, i) => {
      const [x, y] = trajectory.function(i, trajectory.pointCount);
      const [screenX, screenY] = gameToScreenPosition([x + trajectory.x, y + trajectory.y]);
      sprite.x = screenX;
      sprite.y = screenY;
    });
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
        const slotCenterX = scale * SLOT_SIZE * (i + 0.5);
        const slotCenterY = scale * SLOT_SIZE * (0.5);
        const textOffsetX = scale * SLOT_SIZE * 0.1;
        const textOffsetY = scale * SLOT_SIZE * 0.1;
        slotSprite.x = slotCenterX;
        slotSprite.y = slotCenterY;
        slotSprite.scale.set(scale);
        slotSprite.anchor.set(0.5);
        itemSprite.x = slotCenterX;
        itemSprite.y = slotCenterY
        itemSprite.scale.set(scale);
        itemSprite.anchor.set(0.5);
        this.app.stage.addChild(slotSprite, itemSprite);
        this.inventorySlots.push({
          slot: slotSprite,
          item: itemSprite,
          count: new TextBox(slotCenterX + textOffsetX, slotCenterY + textOffsetY, '', this.app.stage, 2)
        });
      }
      // set selection indicator
      const selection = i === inventory.selected ? 'selected' : 'unselected';
      const sprites = this.inventorySlots[i];
      const count = inventory.slots[i]?.quantity;
      sprites.slot.currentFrame = GUI_TEXTURES['inventory'].getFrameIndex(selection, 0);
      sprites.item.currentFrame = getItemFrame(inventory.slots[i]);
      sprites.count.modify((count || 0) > 1 ? count + '' : '');
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
      // if (!renderable(thing)) {
      //   continue;
      // }
      let armature = this.entityArmatures.get(i);
      if (!armature) {
        armature = new Armature(thing.data.x, thing.data.y, thing.armaturePieceSprites, this.app);
        this.entityArmatures.set(i, armature);
      }
      armature.pose(thing.data.x, thing.data.y, thing.getArmaturePoses());
    }
  }

  updateAmbient() {
    this.time += 1;
    this.terrainLayer.shader.uniforms.wind = Math.floor(((this.time % 400) / 400) * 30) / 30;
  }
}
