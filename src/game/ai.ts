/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ALL_MILLS, POINT_TO_MILLS } from './constants.ts';
import {
  applyCapture,
  applyMove,
  applyPlacement,
  getLegalCaptures,
  getLegalDestinations,
  getLegalPiecesToMove,
  getLegalPlacements,
  isPointInMill,
} from './engine.ts';
import { GameState, PlayerId, PointId } from './types.ts';

export type AiDifficulty = 'easy' | 'medium' | 'hard';

/**
 * AI Decision Maker for Navakankari
 */
export function getAiAction(
  state: GameState,
  difficulty: AiDifficulty = 'medium'
): GameState {
  if (state.status === 'capture') {
    const capturePoint = chooseAiCapture(state, difficulty);
    return applyCapture(state, capturePoint);
  }

  if (state.phase === 'placement') {
    const placementPoint = chooseAiPlacement(state, difficulty);
    return applyPlacement(state, placementPoint);
  }

  // Movement or Flying
  const { from, to } = chooseAiMove(state, difficulty);
  return applyMove(state, from, to);
}

/**
 * Choose point to place during Phase 1
 */
function chooseAiPlacement(state: GameState, difficulty: AiDifficulty): PointId {
  const legal = getLegalPlacements(state);
  if (legal.length === 0) throw new Error('No legal placements');

  if (difficulty === 'easy' && Math.random() < 0.6) {
    return legal[Math.floor(Math.random() * legal.length)];
  }

  const aiPlayer = state.currentPlayer;
  const humanPlayer: PlayerId = aiPlayer === 1 ? 2 : 1;

  // 1. Check if AI can complete a mill immediately
  for (const point of legal) {
    const candidateMills = POINT_TO_MILLS[point] || [];
    for (const mill of candidateMills) {
      const countAi = mill.filter((p) => (p === point ? true : state.board[p] === aiPlayer)).length;
      if (countAi === 3) {
        return point; // Immediate mill completion!
      }
    }
  }

  // 2. Check if AI needs to block human player from forming a mill
  for (const point of legal) {
    const candidateMills = POINT_TO_MILLS[point] || [];
    for (const mill of candidateMills) {
      const countHuman = mill.filter((p) => (p === point ? true : state.board[p] === humanPlayer)).length;
      if (countHuman === 3) {
        return point; // Critical block!
      }
    }
  }

  if (difficulty === 'medium' && Math.random() < 0.3) {
    return legal[Math.floor(Math.random() * legal.length)];
  }

  // 3. Strategic scoring: Prefer midpoints (connects to other rings) and 2-in-a-row setups
  let bestPoint = legal[0];
  let maxScore = -Infinity;

  for (const point of legal) {
    let score = 0;
    // Cross-ring midpoints (1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23) have 3 or 4 connections
    if ([9, 11, 13, 15].includes(point)) score += 3; // center cross midpoints are most mobile
    else if ([1, 3, 5, 7, 17, 19, 21, 23].includes(point)) score += 2;

    const mills = POINT_TO_MILLS[point] || [];
    for (const mill of mills) {
      const aiCount = mill.filter((p) => state.board[p] === aiPlayer).length;
      const humanCount = mill.filter((p) => state.board[p] === humanPlayer).length;
      if (humanCount === 0 && aiCount === 1) score += 2; // Building towards mill
      if (humanCount === 1 && aiCount === 0) score += 1; // Disrupting human
    }

    // Add tiny random jitter
    score += Math.random() * 0.5;

    if (score > maxScore) {
      maxScore = score;
      bestPoint = point;
    }
  }

  return bestPoint;
}

/**
 * Choose piece to move and destination during Phase 2 / 3
 */
function chooseAiMove(
  state: GameState,
  difficulty: AiDifficulty
): { from: PointId; to: PointId } {
  const pieces = getLegalPiecesToMove(state);
  if (pieces.length === 0) throw new Error('No movable pieces for AI');

  const allPossibleMoves: { from: PointId; to: PointId }[] = [];
  for (const from of pieces) {
    const dests = getLegalDestinations(state, from);
    for (const to of dests) {
      allPossibleMoves.push({ from, to });
    }
  }

  if (difficulty === 'easy' && Math.random() < 0.6) {
    return allPossibleMoves[Math.floor(Math.random() * allPossibleMoves.length)];
  }

  const aiPlayer = state.currentPlayer;
  const humanPlayer: PlayerId = aiPlayer === 1 ? 2 : 1;

  // 1. Immediate mill formation move
  for (const move of allPossibleMoves) {
    // Check if moving 'from' to 'to' forms a mill
    const boardClone = [...state.board];
    boardClone[move.from] = null;
    boardClone[move.to] = aiPlayer;

    const mills = POINT_TO_MILLS[move.to] || [];
    for (const mill of mills) {
      if (mill.every((p) => boardClone[p] === aiPlayer)) {
        return move;
      }
    }
  }

  // 2. Block human opponent from completing a mill on their next turn
  if (difficulty === 'hard') {
    // Check if any move lands on a spot the opponent wants
    const humanMovable = [];
    for (let p = 0; p < 24; p++) {
      if (state.board[p] === humanPlayer) humanMovable.push(p);
    }
  }

  // 3. Score moves based on leaving a closed mill (so we can re-close it next turn) or advancing
  let bestMove = allPossibleMoves[0];
  let maxScore = -Infinity;

  for (const move of allPossibleMoves) {
    let score = 0;
    // Don't break an existing mill unless necessary
    const wasInMill = isPointInMill(state.board, move.from, aiPlayer);
    if (wasInMill) score -= 1.5;

    // Moving to high connectivity point
    if ([9, 11, 13, 15].includes(move.to)) score += 2;
    else if ([1, 3, 5, 7, 17, 19, 21, 23].includes(move.to)) score += 1;

    // Check mill potential
    const mills = POINT_TO_MILLS[move.to] || [];
    for (const mill of mills) {
      const otherPoints = mill.filter((p) => p !== move.to && p !== move.from);
      if (otherPoints.every((p) => state.board[p] === aiPlayer)) {
        score += 3;
      }
    }

    score += Math.random() * 0.4;
    if (score > maxScore) {
      maxScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * Choose opponent piece to capture during Capture state
 */
function chooseAiCapture(state: GameState, difficulty: AiDifficulty): PointId {
  const legalCaptures = getLegalCaptures(state);
  if (legalCaptures.length === 0) throw new Error('No legal captures');

  if (difficulty === 'easy' && Math.random() < 0.6) {
    return legalCaptures[Math.floor(Math.random() * legalCaptures.length)];
  }

  const humanPlayer: PlayerId = state.currentPlayer === 1 ? 2 : 1;

  // Best piece to capture is one that is currently forming 2-in-a-row for human
  let bestTarget = legalCaptures[0];
  let maxThreat = -Infinity;

  for (const target of legalCaptures) {
    let threat = 0;
    const mills = POINT_TO_MILLS[target] || [];
    for (const mill of mills) {
      const humanCount = mill.filter((p) => state.board[p] === humanPlayer).length;
      if (humanCount === 2) {
        threat += 5; // Eliminates imminent mill threat!
      }
    }
    // Cross-bridge target
    if ([9, 11, 13, 15].includes(target)) threat += 2;

    threat += Math.random() * 0.3;
    if (threat > maxThreat) {
      maxThreat = threat;
      bestTarget = target;
    }
  }

  return bestTarget;
}
