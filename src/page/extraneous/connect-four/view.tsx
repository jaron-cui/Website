import * as PIXI from 'pixi.js';
import { useEffect, useRef } from 'react';
import { ConnectFourRenderer } from './render';
import { ConnectFourBoard } from './connect-four';

async function createApp(): Promise<PIXI.Application<HTMLCanvasElement>> {
  const app = new PIXI.Application<HTMLCanvasElement>({ background: '#7acdeb', width: 600, height: 400 });

  // Listen for animate update
  app.ticker.minFPS = 40;
  app.ticker.maxFPS = 40;

  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  const board = ConnectFourBoard.newBoard(4, 2, 7, 6);
  await ConnectFourRenderer.loadTextures();
  const renderer = new ConnectFourRenderer(app, board);

  let boo = 6;
  let clicked = false;
  app.stage.addEventListener('click', event => {
    if (boo > 0) {
      clicked = true;
    }
    boo -= 1;
    // const [x, y]: BoardLocation = [Math.floor(event.screenX / 50), Math.floor(event.screenY / 50)] as BoardLocation;
    // if (x < 0 || x >= 8 || y < 0 || y >= 8) {
    //   return;
    // }
    // // console.log(selected);
    // if (selected) {
    //   // console.log('moveTo: ' + [x, y]);
    //   if (ChessBoard.legalMove(board, 'white', selected, [x, y])) {
    //     // console.log('legal')
    //     ChessBoard.movePiece(board, selected, [x, y]);
    //     renderer.animateMovement(selected, [x, y]);
    //   } else {
    //     // console.log('illegal')
    //   }
    //   selected = undefined;
    // } else {
    //   if (board.board[y][x].piece) {
    //     selected = [x, y];
    //   }
    // }
  })

  app.ticker.add(delta => { 
    renderer.update();
    if (clicked) {
      clicked = false;
      const player = board.playerTurn;
      const row = ConnectFourBoard.move(board, 2);
      console.log('row ' + row);
      renderer.startMoveAnimation(player, row, 2);
    }
  });
  return app;
}


export const ConnectFour = () => {
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