import { useEffect, useState } from "react";
import { CENTERED, UNSELECTABLE } from "../../util/styles";
import TypingHandler from "../../component/TypingHandler";

type Position = {
  x: number;
  y: number;
}

type Tile = undefined | 'red' | 'green' | 'blue';

type Grid = Tile[][];

type Piece = {
  tiles: Grid;
  origin: Position;
}

type GameState = {
  board: Grid;
  fallingPiece: Piece | undefined;
}

type Direction = 'left' | 'right';

const PIECE_GRIDS: boolean[][][] = [
  [
    [true, true, true],
    [false, true, false]
  ], [
    [true, true, true, true]
  ], [
    [true, true, true],
    [true, false, false]
  ], [
    [true, true, true],
    [false, false, true]
  ], [
    [true, true],
    [true, true]
  ], [
    [true, false],
    [true, true],
    [false, true]
  ], [
    [false, true],
    [true, true],
    [true, false]
  ]
];

function rotateGrid(grid: Grid, direction: Direction): Grid {
  const height = grid.length;
  const width = grid[0].length;
  const rotated = [];
  for (let x = 0; x < width; x += 1) {
    const row: Tile[] = [];
    for (let y = 0; y < height; y += 1) {
      row.push(grid[y][x]);
    }
    if (direction === 'right') {
      row.reverse();
    }
    rotated.push(row);
  }
  if (direction === 'left') {
    rotated.reverse();
  }
  return rotated;
}

function rotatePosition(position: Position, grid: Grid, direction: Direction): Position {
  const height = grid.length;
  const width = grid[0].length;
  return direction === 'left' ? {
    x: position.y,
    y: width - position.x - 1
  } : {
    x: height - position.y - 1,
    y: position.x
  }
}

function rotatePieceAround(piece: Piece, pivot: Position, direction: Direction): Piece {
  const rotatedPivot = rotatePosition(pivot, piece.tiles, direction);
  const rotatedGrid = rotateGrid(piece.tiles, direction);
  return {
    tiles: rotatedGrid,
    origin: piece.origin/*{
      x: piece.origin.x - (rotatedPivot.x - pivot.x),
      y: piece.origin.y - (rotatedPivot.y - pivot.y)
    }*/
  }
}

function centerOf(grid: Grid): Position {
  const height = grid.length;
  const width = grid[0].length;
  return {
    x: Math.floor((width - 1) / 2),
    y: Math.floor((height - 1) / 2)
  }
}

function filledPositions(grid: Grid): Position[] {
  const positions: Position[] = [];
  grid.forEach((row, y) => row.forEach((tile, x) => {
    if (tile !== undefined) {
      positions.push({ x: x, y: y });
    }
  }))
  return positions;
}

function parallelPositionOperation(combine: (v1: number, v2: number) => number): ((a: Position, b: Position) => Position) {
  return (a: Position, b: Position) => {
    return {
      x: combine(a.x, b.x),
      y: combine(a.y, b.y)
    }
  }
}

const addPositions = parallelPositionOperation((v1, v2) => v1 + v2);

function inBounds(position: Position, grid: Grid): boolean {
  const height = grid.length;
  const width = grid[0].length;
  return position.x >= 0 && position.x < width && position.y >= 0 && position.y < height;
}

function pieceFits(piece: Piece, grid: Grid): boolean {
  for (let localPosition of filledPositions(piece.tiles)) {
    const gridPosition = addPositions(localPosition, piece.origin);
    if (!inBounds(gridPosition, grid) || grid[gridPosition.y][gridPosition.x] !== undefined) {
      return false;
    }
  }
  return true;
}

function handleRotateFallingPiece(gameState: GameState, direction: Direction): GameState {
  const piece = gameState.fallingPiece;
  if (piece === undefined) {
    return gameState;
  }

  const pieceCenter = centerOf(piece.tiles);
  const potentialPivots = [pieceCenter, ...filledPositions(piece.tiles)];
  //const potentialPivots = [...filledPositions(piece.tiles)];
  for (let pivot of potentialPivots) {
    const rotatedPiece = rotatePieceAround(piece, pivot, direction);
    if (pieceFits(rotatedPiece, gameState.board)) {
      console.log(pivot)
      return {
        board: gameState.board,
        fallingPiece: rotatedPiece
      }
    }
  }

  return gameState;
}

function copyGrid(grid: Grid): Grid {
  return grid.map(row => row.slice()).slice();
}

function overlayPiece(piece: Piece | undefined, grid: Grid): Grid {
  if (piece === undefined) {
    return grid;
  }

  const newGrid = copyGrid(grid);
  for (let localPosition of filledPositions(piece.tiles)) {
    const gridPosition = addPositions(localPosition, piece.origin);
    if (inBounds(gridPosition, newGrid)) {
      newGrid[gridPosition.y][gridPosition.x] = piece.tiles[localPosition.y][localPosition.x];
    }
  }
  return newGrid;
}

function solidifyFallingPiece(gameState: GameState): GameState {
  return {
    board: overlayPiece(gameState.fallingPiece, gameState.board),
    fallingPiece: undefined
  };
}

function handleMovePiece(gameState: GameState, offset: Position): GameState {
  const piece = gameState.fallingPiece;
  if (piece === undefined) {
    return gameState;
  }
  const movedPiece = {
    tiles: piece.tiles,
    origin: addPositions(piece.origin, offset)
  };
  return pieceFits(movedPiece, gameState.board) ? {
    board: gameState.board,
    fallingPiece: movedPiece
  } : gameState;
}

function randomElement<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

function randomPiece(): Piece {
  const grid = randomElement(PIECE_GRIDS);
  const color: Tile = randomElement(['red', 'green', 'blue']);
  return {
    tiles: grid.map(row => row.map(filled => filled ? color : undefined)),
    origin: { x: 0, y: 0 }
  }
}

function removeFullRows(grid: Grid): Grid {
  let newGrid = copyGrid(grid);
  for (let y = newGrid.length - 1; y >= 0; y -= 1) {
    if (newGrid[y].every(tile => tile !== undefined)) {
      // shift all rows down 1
      newGrid[0] = newGrid[0].map(_ => undefined);
      for (let shifted = y; shifted > 0; shifted -= 1) {
        newGrid[shifted] = newGrid[shifted - 1];
      }
    }
  }
  return newGrid;
}

function handleTick(gameState: GameState): GameState {
  let updated = gameState;
  if (gameState.fallingPiece === undefined) {
    return {
      board: removeFullRows(gameState.board),
      fallingPiece: randomPiece()
    }
  }
  updated = handleMovePiece(gameState, { x: 0, y: 1 });
  if (updated === gameState) {
    updated = solidifyFallingPiece(gameState);
  }
  return updated;
}

const Box = ({ tile }: { tile: Tile }) => (
  <div
    style={{
      float: 'left',
      borderRadius: 5,
      backgroundColor: tile,
      height: 40,
      width: 40,
      fontSize: 30,
      fontWeight: 'bold',
      margin: 2,
      ...CENTERED,
      ...UNSELECTABLE
    }}
  >
  </div>
)

const Row = ({ row }: { row: Tile[] }) => (
  <div style={{overflow: 'hidden'}} key={undefined}>
    {row.map((tile, i) => (
        <Box tile={tile} key={i}/>
      ))}
  </div>
)

const Tetris = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: [[undefined, undefined, undefined, undefined, undefined],
    [undefined, undefined, undefined, undefined, undefined],
    [undefined, undefined, undefined, undefined, undefined],
    [undefined, undefined, undefined, undefined, undefined],
    [undefined, undefined, undefined, undefined, undefined],
    [undefined, undefined, undefined, undefined, undefined]],
    fallingPiece: {
      tiles: [['red', 'red', 'red'], [undefined, 'red', undefined]],
      origin: { x: 0, y: 0 }
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setGameState(gameState => handleTick(gameState));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function onKey(key: string) {
    console.log(key);
    if (key === 'ArrowUp') {
      setGameState(handleRotateFallingPiece(gameState, 'left'));
    } else if (key === 'ArrowDown') {
      setGameState(handleRotateFallingPiece(gameState, 'right'));
    } else if (key === 'ArrowLeft') {
      setGameState(handleMovePiece(gameState, { x: -1, y: 0 }));
    } else if (key === 'ArrowRight') {
      setGameState(handleMovePiece(gameState, { x: 1, y: 0 }));
    }
  }

  return (
    <div>
      <div>{overlayPiece(gameState.fallingPiece, gameState.board).map((row, i) => <Row row={row} key={i}/>)}
      </div>
      <TypingHandler onKey={onKey}/>
    </div>
  )
}

export default Tetris;