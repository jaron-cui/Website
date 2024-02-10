

type Color = 'white' | 'black';

export type ChessPiece = 'freshPawn' | 'pawn' | 'rook' | 'knight' | 'bishop' | 'king' | 'queen';

type BoardCoordinate = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type BoardLocation = [BoardCoordinate, BoardCoordinate];

interface PotentialMove {
  from: BoardLocation;
  // are you obstructed by this square?
  currentlyAllowed: boolean;
  color: Color;
}

interface BoardSpace {
  piece?: {
    name: ChessPiece;
    color: Color;
  }
  potentialMoves: Set<PotentialMove>;
}

type Row = [BoardSpace, BoardSpace, BoardSpace, BoardSpace, BoardSpace, BoardSpace, BoardSpace, BoardSpace];

interface ChessBoard {
  board: [Row, Row, Row, Row, Row, Row, Row, Row];
}

function forward(color: Color): 1 | -1 {
  return color === 'white' ? 1 : -1;
}

function enemy(color: Color): Color {
  return color === 'white' ? 'black' : 'white';
}

function updateMoveInfo(space: BoardSpace, from: BoardLocation, color: Color, allowed: boolean) {
  space.potentialMoves.add({ from: from, color: color, currentlyAllowed: allowed });
}

function at(board: ChessBoard, x: number, y: number): BoardSpace | undefined {
  if (x >= 0 && x < 8 && y >= 0 && y < 8) {
    return board.board[y][x];
  } else {
    return undefined;
  }
}

function pawnMoves(fresh: boolean) {
  return (board: ChessBoard, color: Color, [x, y]: BoardLocation) => {
    // benign moves
    const nextSpace = at(board, x, y + forward(color));
    if (nextSpace) {
      if (nextSpace.piece) {
        // a piece in front blocks both forward moves
        updateMoveInfo(nextSpace, [x, y], color, false);
      } else {
        updateMoveInfo(nextSpace, [x, y], color, true);
        if (fresh) {
          // a piece 2 away blocks the double step
          const farSpace = at(board, x, y + 2 * forward(color));
          if (farSpace) {
            updateMoveInfo(farSpace, [x, y], color, !farSpace.piece);
          }
        }
      }
    }
    // aggressive moves
    const leftFlank = at(board, x - 1, y + forward(color));
    const rightFlank = at(board, x + 1, y + forward(color));
    [leftFlank, rightFlank].forEach(flank => {
      if (flank?.piece?.color === enemy(color)) {
        updateMoveInfo(flank, [x, y], color, true);
      }
    });
  };
}

// an attack pattern that follows a line where subsequence movements are blocked by pieces
function linearAttack(board: ChessBoard, color: Color, [x, y]: BoardLocation, [xStep, yStep]: [number, number], limit?: number) {
  let offset = 1;
  while (!limit || offset <= limit) {
    const [tx, ty] = [x + xStep * offset, y + yStep * offset];
    const targetSpace = at(board, tx, ty);
    if (!targetSpace) {
      continue;
    }
    if (targetSpace.piece) {
      updateMoveInfo(targetSpace, [x, y], color, targetSpace.piece.color === enemy(color));
      break;
    } else {
      updateMoveInfo(targetSpace, [x, y], color, true);
    }
    offset += 1;
  }
}

function orthogonalAttack(board: ChessBoard, color: Color, location: BoardLocation, limit?: number) {
  linearAttack(board, color, location, [1, 0], limit);
  linearAttack(board, color, location, [-1, 0], limit);
  linearAttack(board, color, location, [0, 1], limit);
  linearAttack(board, color, location, [0, -1], limit);
}

function diagonalAttack(board: ChessBoard, color: Color, location: BoardLocation, limit?: number) {
  linearAttack(board, color, location, [1, 1], limit);
  linearAttack(board, color, location, [1, -1], limit);
  linearAttack(board, color, location, [-1, 1], limit);
  linearAttack(board, color, location, [-1, -1], limit);
}

// a combination of orthogonal and diagonal attacks
function omnidirectionalAttack(board: ChessBoard, color: Color, location: BoardLocation, limit?: number) {
  orthogonalAttack(board, color, location, limit);
  diagonalAttack(board, color, location, limit);
}

// an attack allowed as long as the destination space doesn't contain an ally
function floatingAttack(board: ChessBoard, color: Color, source: BoardLocation, [tx, ty]: [number, number]) {
  const target = at(board, tx, ty);
  if (!target) {
    return;
  }
  updateMoveInfo(target, source, color, target.piece?.color !== color);
}

const UPDATE_PIECE: Record<ChessPiece, (board: ChessBoard, color: Color, location: BoardLocation) => void> = {
  freshPawn: pawnMoves(true),
  pawn: pawnMoves(false),
  rook: orthogonalAttack,
  knight: (board, color, [x, y]) => {
    const offsets = [[2, 1], [1, 2], [-2, 1], [-1, 2], [2, -1], [1, -2], [-1, -2], [-2, -1]];
    offsets.forEach(([xo, yo]) => floatingAttack(board, color, [x, y], [x + xo, y + yo]));
  },
  bishop: diagonalAttack,
  king: (board, color, location) => omnidirectionalAttack(board, color, location, 1),
  queen: omnidirectionalAttack
}

function cachePieceMoves(board: ChessBoard, location: BoardLocation) {
  const [x, y] = location;
  const piece = board.board[y][x];
  piece.piece && UPDATE_PIECE[piece.piece.name](board, piece.piece.color, location);
}

function clearPieceMoves(board: ChessBoard, [x, y]: BoardLocation) {
  board.board.forEach(row => {
    row.forEach(space => {
      // remove potential moves stemming from the piece
      space.potentialMoves = new Set([...space.potentialMoves].filter(move => {
        const [sourceX, sourceY] = move.from;
        return !(sourceX === x && sourceY === y);
      }));
    });
  });
}

function removePiece(board: ChessBoard, [x, y]: BoardLocation, avoidUpdateOthers?: boolean) {
  const formerSpace = at(board, x, y) as BoardSpace;
  formerSpace.piece = undefined;
  clearPieceMoves(board, [x, y]);
  if (!avoidUpdateOthers) {
    updateAssociatedPieces(board, [x, y]);
  }
}

function placePiece(board: ChessBoard, piece: ChessPiece, color: Color, [x, y]: BoardLocation) {
  const space = at(board, x, y) as BoardSpace;
  space.piece = { name: piece, color: color };
  cachePieceMoves(board, [x, y]);
  updateAssociatedPieces(board, [x, y]);
}

function updateAssociatedPieces(board: ChessBoard, [x, y]: BoardLocation) {
  const space = at(board, x, y) as BoardSpace;
  space.potentialMoves.forEach(move => {
    clearPieceMoves(board, move.from);
    cachePieceMoves(board, move.from)
  });
}

function movePiece(board: ChessBoard, [fx, fy]: BoardLocation, [tx, ty]: BoardLocation) {
  const piece = at(board, fx, fy)?.piece;
  if (!piece) {
    return;
  }
  removePiece(board, [fx, fy], true);
  placePiece(board, piece.name, piece.color, [tx, ty]);
  updateAssociatedPieces(board, [fx, fy]);
}

function sameLocation([x1, y1]: BoardLocation, [x2, y2]: BoardLocation): boolean {
  return x1 === x2 && y1 === y2;
}

function legalMove(board: ChessBoard, color: Color, from: BoardLocation, [tx, ty]: BoardLocation): boolean {
  // if move in set of cached moves
  for (let move of (at(board, tx, ty) as BoardSpace).potentialMoves) {
    if (sameLocation(move.from, from) && move.currentlyAllowed) {
      // TODO: check for check
      return true;
    }
  }
  return false;
}