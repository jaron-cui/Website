import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';
import { BoardLocation, BoardSpace, ChessBoard, legalMove, movePiece, placePiece } from './chess';

class Renderer {
  board: ChessBoard;
  app: PIXI.Application<HTMLCanvasElement>;

  constructor(app: PIXI.Application<HTMLCanvasElement>, board: ChessBoard) {
    this.app = app;
    this.board = board;
  }

  update() {

  }
}

function freshBoard(): ChessBoard {
  const board = [];
  for (let y = 0; y < 8; y += 1) {
    const row = [];
    for (let x = 0; x < 8; x += 1) {
      const space: BoardSpace = {
        potentialMoves: new Set()
      }
      row.push(space);
    }
    board.push(row);
  }
  return {
    board: board
  } as ChessBoard;
}

async function createApp(): Promise<PIXI.Application<HTMLCanvasElement>> {
  const app = new PIXI.Application<HTMLCanvasElement>({ background: '#7acdeb', width: 600, height: 400 });
  // app.renderer.addListener('mousepos', (event: MouseEvent) => console.log(event.clientX));
  let t = 0;
  // Listen for animate update
  app.ticker.minFPS = 40;
  app.ticker.maxFPS = 40;

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  const board = freshBoard();
  placePiece(board, 'bishop', 'white', [3, 0]);
  let selected: BoardLocation | undefined;

  app.stage.addEventListener('click', event => {
    const [x, y]: BoardLocation = [Math.floor(event.screenX / 50), Math.floor(event.screenY / 50)] as BoardLocation;
    if (x < 0 || x >= 8 || y < 0 || y >= 8) {
      return;
    }
    console.log(selected);
    if (selected) {
      console.log('moveTo: ' + [x, y]);
      if (legalMove(board, 'white', selected, [x, y])) {
        console.log('legal')
        movePiece(board, selected, [x, y]);
      } else {
        
        console.log('illegal')
      }
      selected = undefined;
    } else {
      if (board.board[y][x].piece) {
        selected = [x, y];
      }
    }
  })

  const boardTex = PIXI.BaseTexture.from('chessboard.png');
  boardTex.scaleMode = PIXI.SCALE_MODES.NEAREST;
  const boardSprite = PIXI.Sprite.from(boardTex);
  boardSprite.scale.set(10);
  const pawnSprite = PIXI.Sprite.from('blocks.png');
  pawnSprite.scale.set(5);
  pawnSprite.anchor.set(0.5);
  app.stage.addChild(boardSprite);
  app.stage.addChild(pawnSprite);

  app.ticker.add(delta => {
    board.board.forEach((row, y) => row.forEach((space, x) => {
      if (space.piece) {
        pawnSprite.x = (x + 0.5) * 50;
        pawnSprite.y = (y + 0) * 50;
      }
    }))
  });
  return app;
}


export const Chess = () => {
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