import * as PIXI from 'pixi.js';
import { ConnectFourBoard } from './connect-four';

function frame(x: number, y: number, w: number, h: number) {
  return {
    frame: {x: x, y: y, w: w, h: h},
    spriteSourceSize: {x: 0, y: 0, w: w, h: h},
    sourceSize: {w: w, h: h}
  }
}

const TEXTURE_SCHEMA = {
  frames: {
    slot: frame(0, 0, 17, 17),
    red: frame(0, 17, 17, 17),
    blue: frame(0, 17 * 2, 17, 17)
  }, meta: {
    image: 'connect-four/tiles.png',
    format: 'RGBA8888',
    size: {w: 17, h: 17 * 3},
    scale: '1'
  }
};

const TEXTURES: Record<string, PIXI.Texture<PIXI.Resource>> = {};

function textureCheck() {
  if (!TEXTURES) {
    throw Error('Chess textures aren\'t loaded! Call ChessBoardRenderer.loadTextures() before creating a renderer.')
  }
}

function getTexture(name: string) {
  return TEXTURES[name] || PIXI.Texture.EMPTY;
}

interface PieceAnimation {
  piece: PIXI.Sprite;
  rowCoordinate: number;
  rowDestination: number;
  velocity: number;
}

export class ConnectFourRenderer {
  board: ConnectFourBoard;
  app: PIXI.Application<HTMLCanvasElement>;
  pieceSprites: (PIXI.Sprite | undefined)[][];
  slotSprites: PIXI.Sprite[];
  pieceLayer: PIXI.Container;
  slotLayer: PIXI.Container;
  ongoingAnimations: Set<PieceAnimation>;

  constructor(app: PIXI.Application<HTMLCanvasElement>, board: ConnectFourBoard) {
    textureCheck();
    this.app = app;
    this.board = board;
    this.slotSprites = [];
    this.pieceSprites = board.slots.map(row => row.map(() => undefined));

    this.pieceLayer = new PIXI.Container();
    this.slotLayer = new PIXI.Container();
    this.app.stage.addChild(this.pieceLayer, this.slotLayer);

    this.ongoingAnimations = new Set();

    // const boardTex = PIXI.BaseTexture.from('chessboard.png');
    // boardTex.scaleMode = PIXI.SCALE_MODES.NEAREST;
    // const boardSprite = PIXI.Sprite.from(boardTex);
    // boardSprite.scale.set(10);
    // app.stage.addChild(boardSprite);

    // this.layers = [0, 0, 0, 0, 0, 0, 0, 0].map(_ => new PIXI.Container());
    // this.app.stage.addChild(...this.layers);
  }

  private initSprites(board: ConnectFourBoard) {
    board.slots.forEach((row, y) => row.forEach((piece, x) => {
      const slotSprite = PIXI.Sprite.from(getTexture('slot'));
      slotSprite.anchor.set(0.5);
      slotSprite.scale.set(4);
      slotSprite.x = ((x + 0.5) * 17) * 4;
      slotSprite.y = ((y + 0.5) * 17) * 4;
      this.slotSprites.push(slotSprite);
      this.slotLayer.addChild(slotSprite);
      if (piece === undefined) {
        return;
      }
      const pieceSprite = PIXI.Sprite.from(getTexture(piece === 0 ? 'red' : 'blue'));
      pieceSprite.anchor.set(0.5);
      pieceSprite.scale.set(4);
      pieceSprite.x = slotSprite.x;
      pieceSprite.y = slotSprite.y;
      this.pieceSprites[y][x] = pieceSprite;
      this.pieceLayer.addChild(pieceSprite);
    }))
  }

  private clearSprites() {
    this.pieceSprites.forEach(row => row.forEach(sprite => sprite && this.pieceLayer.removeChild(sprite)));
    this.slotSprites.forEach(sprite => this.slotLayer.removeChild(sprite));
  }

  update() {
    const g = 0.01;
    const remove: PieceAnimation[] = [];
    this.ongoingAnimations.forEach(animation => {
      animation.rowCoordinate += animation.velocity;
      if (animation.rowCoordinate > animation.rowDestination) {
        animation.rowCoordinate = animation.rowDestination;
        if (animation.velocity < 0.02) {
          remove.push(animation);
        } else {
          animation.velocity *= -0.3;
        }
      }
      animation.velocity += g;
      animation.piece.y = ((animation.rowCoordinate + 0.5) * 17) * 4;
    });
    remove.forEach(this.ongoingAnimations.delete);
  }

  startMoveAnimation(player: number, row: number, column: number) {
    const existingSprite = this.pieceSprites[row][column];
    if (existingSprite !== undefined) {
      this.pieceLayer.removeChild(existingSprite);
    }
    const startHeight = -1;
    const sprite = PIXI.Sprite.from(getTexture(player === 0 ? 'red' : 'blue'));
    sprite.anchor.set(0.5);
    sprite.scale.set(4);
    sprite.x = ((column + 0.5) * 17) * 4;
    sprite.y = ((startHeight + 0.5) * 17) * 4;
    this.pieceLayer.addChild(sprite);
    this.pieceSprites[row][column] = sprite;

    this.ongoingAnimations.add({
      piece: sprite,
      rowCoordinate: startHeight,
      rowDestination: row,
      velocity: 0
    });
  }
}

export namespace ConnectFourRenderer {
  export async function loadTextures() {
    const textures = PIXI.BaseTexture.from(TEXTURE_SCHEMA.meta.image);
    textures.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const spritesheet = new PIXI.Spritesheet(textures, TEXTURE_SCHEMA);
    await spritesheet.parse();
    Object.entries(spritesheet.textures).forEach(([name, texture]) => {
      TEXTURES[name] = texture;
    });
  }
}
