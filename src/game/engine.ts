/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ADJACENCY_LIST,
  ALL_MILLS,
  BOARD_POINTS,
  POINT_TO_MILLS,
} from './constants.ts';
import {
  BoardState,
  GameMove,
  GamePhase,
  GameState,
  PlayerId,
  PointId,
  WinReason,
} from './types.ts';

export function createInitialGameState(
  player1Name: string = 'Player 1',
  player2Name: string = 'Player 2',
  isP2Ai: boolean = false
): GameState {
  const board: BoardState = Array(24).fill(null);

  return {
    board,
    currentPlayer: 1,
    phase: 'placement',
    status: 'playing',
    winner: null,
    winReason: null,
    players: {
      1: {
        id: 1,
        name: player1Name,
        colorName: 'Terracotta Amber',
        primaryColor: '#d97706',
        secondaryColor: '#78350f',
        glowColor: '#fbbf24',
        unplaced: 9,
        onBoard: 0,
        captured: 0,
        isAi: false,
      },
      2: {
        id: 2,
        name: player2Name,
        colorName: 'Silver Ivory',
        primaryColor: '#f8fafc',
        secondaryColor: '#94a3b8',
        glowColor: '#e2e8f0',
        unplaced: 9,
        onBoard: 0,
        captured: 0,
        isAi: isP2Ai,
      },
    },
    millFormedJustNow: false,
    activeMillPoints: [],
    selectedPiece: null,
    legalDestinations: [],
    legalCapturePoints: [],
    moveHistory: [],
    consecutiveNonCaptureMoves: 0,
    positionHistory: [getBoardHash(board, 1)],
  };
}

/**
 * Generate a canonical string hash of board + current player for repetition tracking.
 */
export function getBoardHash(board: BoardState, player: PlayerId): string {
  const boardStr = board.map((p) => (p === null ? '.' : p.toString())).join('');
  return `${boardStr}:${player}`;
}

/**
 * Checks if a point forms part of any completed mill for the given player.
 */
export function isPointInMill(
  board: BoardState,
  point: PointId,
  player: PlayerId
): boolean {
  if (board[point] !== player) return false;
  const mills = POINT_TO_MILLS[point] || [];
  return mills.some((mill) =>
    mill.every((pt) => board[pt] === player)
  );
}

/**
 * Returns all distinct mill lines currently formed by a player that contain this point.
 */
export function getMillsAtPoint(
  board: BoardState,
  point: PointId,
  player: PlayerId
): PointId[][] {
  if (board[point] !== player) return [];
  const mills = POINT_TO_MILLS[point] || [];
  return mills.filter((mill) =>
    mill.every((pt) => board[pt] === player)
  );
}

/**
 * Find newly completed mill(s) caused by this specific move or placement.
 */
export function findNewlyFormedMills(
  boardBefore: BoardState,
  boardAfter: BoardState,
  movedPoint: PointId,
  player: PlayerId
): PointId[][] {
  const candidateMills = POINT_TO_MILLS[movedPoint] || [];
  const newlyFormed: PointId[][] = [];

  for (const mill of candidateMills) {
    const isNowMill = mill.every((pt) => boardAfter[pt] === player);
    if (isNowMill) {
      // Check if it was already a completed mill before this move
      const wasAlreadyMill = mill.every((pt) => boardBefore[pt] === player);
      if (!wasAlreadyMill) {
        newlyFormed.push(mill);
      }
    }
  }

  return newlyFormed;
}

/**
 * Returns all empty points where a piece can legally be placed.
 */
export function getLegalPlacements(state: GameState): PointId[] {
  if (state.phase !== 'placement' || state.status !== 'playing') {
    return [];
  }
  const legal: PointId[] = [];
  for (let i = 0; i < 24; i++) {
    if (state.board[i] === null) {
      legal.push(i);
    }
  }
  return legal;
}

/**
 * Determine the game phase for a specific player (flying or normal movement).
 */
export function getPlayerPhase(
  playerInfo: { unplaced: number; onBoard: number }
): GamePhase {
  if (playerInfo.unplaced > 0) return 'placement';
  if (playerInfo.onBoard === 3) return 'flying';
  return 'movement';
}

/**
 * Returns legal destinations for a selected piece owned by the current player.
 */
export function getLegalDestinations(
  state: GameState,
  fromPoint: PointId
): PointId[] {
  if (state.status !== 'playing') return [];
  if (state.board[fromPoint] !== state.currentPlayer) return [];

  const playerInfo = state.players[state.currentPlayer];
  if (playerInfo.unplaced > 0) return []; // In placement phase, movement is not allowed

  // Flying Phase: if player has exactly 3 pieces remaining, can fly to ANY empty point
  if (playerInfo.onBoard === 3) {
    const legal: PointId[] = [];
    for (let i = 0; i < 24; i++) {
      if (state.board[i] === null) {
        legal.push(i);
      }
    }
    return legal;
  }

  // Normal Movement: can only move to adjacent empty points
  const neighbors = ADJACENCY_LIST[fromPoint] || [];
  return neighbors.filter((p) => state.board[p] === null);
}

/**
 * Returns list of point IDs for current player's pieces that have at least one legal move.
 */
export function getLegalPiecesToMove(state: GameState): PointId[] {
  if (state.phase === 'placement' || state.status !== 'playing') return [];
  const player = state.currentPlayer;
  const pieces: PointId[] = [];

  for (let i = 0; i < 24; i++) {
    if (state.board[i] === player) {
      const dests = getLegalDestinations(state, i);
      if (dests.length > 0) {
        pieces.push(i);
      }
    }
  }

  return pieces;
}

/**
 * Returns opponent pieces that can be legally removed.
 * Rule: Opponent pieces that are part of a mill cannot be removed,
 * UNLESS all opponent pieces on the board are currently part of mills.
 */
export function getLegalCaptures(state: GameState): PointId[] {
  if (state.status !== 'capture') return [];

  const opponent: PlayerId = state.currentPlayer === 1 ? 2 : 1;
  const opponentPieces: PointId[] = [];
  const unprotectedPieces: PointId[] = [];

  for (let i = 0; i < 24; i++) {
    if (state.board[i] === opponent) {
      opponentPieces.push(i);
      if (!isPointInMill(state.board, i, opponent)) {
        unprotectedPieces.push(i);
      }
    }
  }

  // If there are unprotected opponent pieces, ONLY those can be removed
  if (unprotectedPieces.length > 0) {
    return unprotectedPieces;
  }

  // If ALL opponent pieces are protected by mills, ANY opponent piece can be captured
  return opponentPieces;
}

/**
 * Format algebraic notation for move logs (e.g., "d7", "d6 -> d5", "x g7").
 */
function getPointNotation(point: PointId): string {
  return BOARD_POINTS[point]?.notation || `p${point}`;
}

/**
 * Apply a placement action during Phase 1.
 */
export function applyPlacement(
  currentState: GameState,
  point: PointId
): GameState {
  if (currentState.status !== 'playing') {
    throw new Error('Game is not in playable state');
  }
  if (currentState.phase !== 'placement') {
    throw new Error('Not in placement phase');
  }
  if (currentState.board[point] !== null) {
    throw new Error(`Point ${point} is already occupied`);
  }

  const state: GameState = JSON.parse(JSON.stringify(currentState));
  const player = state.currentPlayer;
  const boardBefore = [...state.board];

  // Place piece
  state.board[point] = player;
  state.players[player].unplaced -= 1;
  state.players[player].onBoard += 1;

  // Check for newly formed mill
  const newMills = findNewlyFormedMills(boardBefore, state.board, point, player);

  if (newMills.length > 0) {
    // Flatten mill points for visual highlight
    const millPoints = Array.from(new Set(newMills.flat()));
    state.status = 'capture';
    state.millFormedJustNow = true;
    state.activeMillPoints = millPoints;
    state.legalCapturePoints = getLegalCaptures(state);

    const notation = `${state.players[player].name}: placed on ${getPointNotation(point)} [MILL!]`;
    state.moveHistory.push({
      type: 'place',
      player,
      to: point,
      formedMill: true,
      millPoints,
      timestamp: Date.now(),
      notation,
    });
    return state;
  }

  // No mill formed: complete the placement move and switch turn
  const notation = `${state.players[player].name}: placed on ${getPointNotation(point)}`;
  state.moveHistory.push({
    type: 'place',
    player,
    to: point,
    formedMill: false,
    timestamp: Date.now(),
    notation,
  });

  return advanceTurnAfterNonMill(state);
}

/**
 * Apply piece movement or flying during Phase 2 or 3.
 */
export function applyMove(
  currentState: GameState,
  fromPoint: PointId,
  toPoint: PointId
): GameState {
  if (currentState.status !== 'playing') {
    throw new Error('Game is not in playable state');
  }
  if (currentState.phase === 'placement') {
    throw new Error('Cannot move pieces during placement phase');
  }

  const legalDests = getLegalDestinations(currentState, fromPoint);
  if (!legalDests.includes(toPoint)) {
    throw new Error(`Illegal move from ${fromPoint} to ${toPoint}`);
  }

  const state: GameState = JSON.parse(JSON.stringify(currentState));
  const player = state.currentPlayer;
  const boardBefore = [...state.board];

  // Move piece
  state.board[fromPoint] = null;
  state.board[toPoint] = player;
  state.selectedPiece = null;
  state.legalDestinations = [];

  // Check for newly formed mill
  const newMills = findNewlyFormedMills(boardBefore, state.board, toPoint, player);

  if (newMills.length > 0) {
    const millPoints = Array.from(new Set(newMills.flat()));
    state.status = 'capture';
    state.millFormedJustNow = true;
    state.activeMillPoints = millPoints;
    state.legalCapturePoints = getLegalCaptures(state);

    const notation = `${state.players[player].name}: ${getPointNotation(fromPoint)} -> ${getPointNotation(toPoint)} [MILL!]`;
    state.moveHistory.push({
      type: 'move',
      player,
      from: fromPoint,
      to: toPoint,
      formedMill: true,
      millPoints,
      timestamp: Date.now(),
      notation,
    });
    return state;
  }

  // No mill formed: update non-capture counter & advance turn
  state.consecutiveNonCaptureMoves += 1;
  const notation = `${state.players[player].name}: ${getPointNotation(fromPoint)} -> ${getPointNotation(toPoint)}`;
  state.moveHistory.push({
    type: 'move',
    player,
    from: fromPoint,
    to: toPoint,
    formedMill: false,
    timestamp: Date.now(),
    notation,
  });

  return advanceTurnAfterNonMill(state);
}

/**
 * Apply piece capture when a mill was formed.
 */
export function applyCapture(
  currentState: GameState,
  capturePoint: PointId
): GameState {
  if (currentState.status !== 'capture') {
    throw new Error('Game is not in capture state');
  }
  const legalCaptures = getLegalCaptures(currentState);
  if (!legalCaptures.includes(capturePoint)) {
    throw new Error(`Point ${capturePoint} is not legally eligible for capture`);
  }

  const state: GameState = JSON.parse(JSON.stringify(currentState));
  const player = state.currentPlayer;
  const opponent: PlayerId = player === 1 ? 2 : 1;

  // Remove opponent piece
  state.board[capturePoint] = null;
  state.players[opponent].onBoard -= 1;
  state.players[player].captured += 1;
  state.consecutiveNonCaptureMoves = 0; // reset 50-move counter on capture

  // Clear capture state
  state.status = 'playing';
  state.millFormedJustNow = false;
  state.activeMillPoints = [];
  state.legalCapturePoints = [];

  const notation = `${state.players[player].name}: captured piece on ${getPointNotation(capturePoint)}`;
  state.moveHistory.push({
    type: 'capture',
    player,
    captured: capturePoint,
    timestamp: Date.now(),
    notation,
  });

  // Check if opponent has lost immediately by piece count (reduced to < 3 pieces in movement/flying)
  const oppUnplaced = state.players[opponent].unplaced;
  const oppOnBoard = state.players[opponent].onBoard;

  if (oppUnplaced === 0 && oppOnBoard < 3) {
    state.winner = player;
    state.status = 'won';
    state.winReason = 'pieces_count';
    return state;
  }

  // Otherwise, advance turn to the opponent
  return advanceTurnAfterCapture(state);
}

/**
 * Advance turn when no mill was formed.
 */
function advanceTurnAfterNonMill(state: GameState): GameState {
  state.selectedPiece = null;
  state.legalDestinations = [];
  state.millFormedJustNow = false;
  state.activeMillPoints = [];

  // Switch player
  const nextPlayer: PlayerId = state.currentPlayer === 1 ? 2 : 1;
  state.currentPlayer = nextPlayer;

  // Determine current game phase
  updateGamePhase(state);

  // Position repetition tracking
  const hash = getBoardHash(state.board, state.currentPlayer);
  state.positionHistory.push(hash);

  // Check 50-move rule
  if (state.consecutiveNonCaptureMoves >= 50) {
    state.status = 'draw';
    state.winner = null;
    return state;
  }

  // Check threefold repetition
  const occurrences = state.positionHistory.filter((h) => h === hash).length;
  if (occurrences >= 3) {
    state.status = 'draw';
    state.winner = null;
    return state;
  }

  // Check if next player is trapped (no legal moves during movement/flying)
  if (state.phase !== 'placement') {
    const legalPieces = getLegalPiecesToMove(state);
    if (legalPieces.length === 0) {
      const winner: PlayerId = nextPlayer === 1 ? 2 : 1;
      state.winner = winner;
      state.status = 'won';
      state.winReason = 'no_moves';
    }
  }

  return state;
}

/**
 * Advance turn after a capture has been made.
 */
function advanceTurnAfterCapture(state: GameState): GameState {
  state.selectedPiece = null;
  state.legalDestinations = [];

  const nextPlayer: PlayerId = state.currentPlayer === 1 ? 2 : 1;
  state.currentPlayer = nextPlayer;

  updateGamePhase(state);

  const hash = getBoardHash(state.board, state.currentPlayer);
  state.positionHistory.push(hash);

  // Check if next player has no legal moves (stalemate/trapped)
  if (state.phase !== 'placement') {
    const legalPieces = getLegalPiecesToMove(state);
    if (legalPieces.length === 0) {
      const winner: PlayerId = nextPlayer === 1 ? 2 : 1;
      state.winner = winner;
      state.status = 'won';
      state.winReason = 'no_moves';
    }
  }

  return state;
}

/**
 * Update general game phase based on remaining unplaced pieces and player board counts.
 */
export function updateGamePhase(state: GameState): void {
  const p1 = state.players[1];
  const p2 = state.players[2];

  if (p1.unplaced > 0 || p2.unplaced > 0) {
    state.phase = 'placement';
    return;
  }

  // Both players finished placement
  const activePlayer = state.players[state.currentPlayer];
  if (activePlayer.onBoard === 3) {
    state.phase = 'flying';
  } else {
    state.phase = 'movement';
  }
}

/**
 * Check if current game state has ended and return winner info.
 */
export function checkGameOver(state: GameState): {
  isOver: boolean;
  winner: PlayerId | null;
  reason: WinReason;
} {
  if (state.status === 'won') {
    return { isOver: true, winner: state.winner, reason: state.winReason };
  }
  if (state.status === 'draw') {
    return { isOver: true, winner: null, reason: null };
  }
  return { isOver: false, winner: null, reason: null };
}
