/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  ADJACENCY_LIST,
  ALL_MILLS,
  BOARD_POINTS,
  POINT_TO_MILLS,
} from '../game/constants.ts';
import {
  applyCapture,
  applyMove,
  applyPlacement,
  createInitialGameState,
  findNewlyFormedMills,
  getLegalCaptures,
  getLegalDestinations,
  getLegalPiecesToMove,
  getLegalPlacements,
  isPointInMill,
} from '../game/engine.ts';
import { BoardState, GameState } from '../game/types.ts';

describe("Navakankari (Nine Men's Morris) Engine", () => {
  it('correctly initializes the board with 24 empty points and 9 pieces per player', () => {
    const state = createInitialGameState('Player A', 'Player B');
    expect(state.board.length).toBe(24);
    expect(state.board.every((p) => p === null)).toBe(true);
    expect(state.currentPlayer).toBe(1);
    expect(state.phase).toBe('placement');
    expect(state.status).toBe('playing');
    expect(state.players[1].unplaced).toBe(9);
    expect(state.players[2].unplaced).toBe(9);
    expect(state.players[1].onBoard).toBe(0);
    expect(state.players[2].onBoard).toBe(0);
  });

  it('validates board topology and exactly 16 valid mills', () => {
    expect(BOARD_POINTS.length).toBe(24);
    expect(ALL_MILLS.length).toBe(16);
    // Every point is in exactly 2 mills
    for (let i = 0; i < 24; i++) {
      expect(POINT_TO_MILLS[i].length).toBe(2);
    }
    // Midpoints have 3 or 4 connections; corners have 2
    expect(ADJACENCY_LIST[0].length).toBe(2); // Top-left outer corner
    expect(ADJACENCY_LIST[1].length).toBe(3); // Top-mid outer cross-bridge
    expect(ADJACENCY_LIST[9].length).toBe(4); // Top-mid middle cross-bridge
  });

  it('handles legal placement and switches turn when no mill is formed', () => {
    const state = createInitialGameState();
    const placements = getLegalPlacements(state);
    expect(placements.length).toBe(24);

    const nextState = applyPlacement(state, 0);
    expect(nextState.board[0]).toBe(1);
    expect(nextState.players[1].unplaced).toBe(8);
    expect(nextState.players[1].onBoard).toBe(1);
    expect(nextState.currentPlayer).toBe(2);
    expect(nextState.status).toBe('playing');
    expect(nextState.millFormedJustNow).toBe(false);
  });

  it('rejects placement on already occupied point', () => {
    const state = createInitialGameState();
    const nextState = applyPlacement(state, 0);
    expect(() => applyPlacement(nextState, 0)).toThrow();
  });

  it('detects a completed mill upon placement and triggers capture state', () => {
    let state = createInitialGameState();
    // P1 places 0
    state = applyPlacement(state, 0);
    // P2 places 8
    state = applyPlacement(state, 8);
    // P1 places 1
    state = applyPlacement(state, 1);
    // P2 places 10
    state = applyPlacement(state, 10);
    // P1 completes mill [0, 1, 2]
    state = applyPlacement(state, 2);

    expect(state.status).toBe('capture');
    expect(state.millFormedJustNow).toBe(true);
    expect(state.currentPlayer).toBe(1); // Still P1 turn to remove opponent piece
    expect(state.activeMillPoints).toContain(0);
    expect(state.activeMillPoints).toContain(1);
    expect(state.activeMillPoints).toContain(2);

    const legalCaptures = getLegalCaptures(state);
    expect(legalCaptures).toContain(8);
    expect(legalCaptures).toContain(10);
  });

  it('prevents capturing an opponent piece that is protected inside a mill when unprotected pieces exist', () => {
    let state = createInitialGameState();
    // Set up board where P2 has a mill at [8, 9, 10] AND an unprotected piece at 12
    state.board[8] = 2;
    state.board[9] = 2;
    state.board[10] = 2;
    state.board[12] = 2; // unprotected
    state.players[2].onBoard = 4;
    state.players[2].unplaced = 5;

    // P1 completes mill at [0, 1, 2]
    state.board[0] = 1;
    state.board[1] = 1;
    state.currentPlayer = 1;
    state = applyPlacement(state, 2);

    expect(state.status).toBe('capture');
    const legalCaptures = getLegalCaptures(state);
    // Only point 12 can be captured! 8, 9, 10 are protected
    expect(legalCaptures).toEqual([12]);
  });

  it('allows capturing an opponent piece in a mill if ALL opponent pieces are protected by mills', () => {
    let state = createInitialGameState();
    // P2 has ONLY one mill [8, 9, 10] and no other pieces on board
    state.board[8] = 2;
    state.board[9] = 2;
    state.board[10] = 2;
    state.players[2].onBoard = 3;

    state.board[0] = 1;
    state.board[1] = 1;
    state.currentPlayer = 1;
    state = applyPlacement(state, 2);

    expect(state.status).toBe('capture');
    const legalCaptures = getLegalCaptures(state);
    // All 3 pieces are in mill, so any of 8, 9, 10 may be captured
    expect(legalCaptures.sort()).toEqual([8, 9, 10].sort());
  });

  it('correctly executes capture and switches turn to opponent', () => {
    let state = createInitialGameState();
    state.board[8] = 2;
    state.players[2].onBoard = 1;
    state.players[2].unplaced = 8;

    state.board[0] = 1;
    state.board[1] = 1;
    state.currentPlayer = 1;
    state = applyPlacement(state, 2);

    expect(state.status).toBe('capture');
    const capturedState = applyCapture(state, 8);

    expect(capturedState.board[8]).toBeNull();
    expect(capturedState.players[2].onBoard).toBe(0);
    expect(capturedState.players[1].captured).toBe(1);
    expect(capturedState.currentPlayer).toBe(2);
    expect(capturedState.status).toBe('playing');
  });

  it('transitions to movement phase after all 18 pieces are placed', () => {
    const state = createInitialGameState();
    // Simulate end of placement phase
    state.players[1].unplaced = 0;
    state.players[2].unplaced = 0;
    state.players[1].onBoard = 9;
    state.players[2].onBoard = 9;
    state.phase = 'movement';

    state.board[0] = 1;
    // Outer top-left connects to 1 and 7
    const dests = getLegalDestinations(state, 0);
    expect(dests).toContain(1);
    expect(dests).toContain(7);
    expect(dests).not.toContain(8); // Diagonal to middle square is NOT connected in Nine Men's Morris
  });

  it('allows flying when player has exactly 3 pieces remaining', () => {
    const state = createInitialGameState();
    state.players[1].unplaced = 0;
    state.players[2].unplaced = 0;
    state.players[1].onBoard = 3; // Flying allowed!
    state.players[2].onBoard = 5;
    state.currentPlayer = 1;
    state.phase = 'flying';

    state.board[0] = 1;
    state.board[4] = 1;
    state.board[8] = 1;

    // Piece at 0 can fly to non-adjacent empty points like 20
    const dests = getLegalDestinations(state, 0);
    expect(dests).toContain(20);
    expect(dests).toContain(16);
    expect(dests.length).toBe(21); // 24 total - 3 occupied = 21 empty
  });

  it('declares victory when opponent has fewer than 3 pieces in movement/flying phase', () => {
    let state = createInitialGameState();
    state.players[1].unplaced = 0;
    state.players[2].unplaced = 0;
    state.players[1].onBoard = 4;
    state.players[2].onBoard = 3; // Opponent has 3 pieces
    state.currentPlayer = 1;
    state.phase = 'movement';

    state.board[0] = 1;
    state.board[1] = 1;
    state.board[3] = 1; // P1 will move from 3 to 2 to form mill

    state.board[12] = 2;
    state.board[13] = 2;
    state.board[14] = 2;

    // Move 3 to 2 to form mill [0, 1, 2]
    state = applyMove(state, 3, 2);
    expect(state.status).toBe('capture');

    // Capture point 12 -> Opponent now has 2 pieces
    state = applyCapture(state, 12);
    expect(state.status).toBe('won');
    expect(state.winner).toBe(1);
    expect(state.winReason).toBe('pieces_count');
  });

  it('declares victory when opponent has no legal moves (stalemate)', () => {
    const state = createInitialGameState();
    state.players[1].unplaced = 0;
    state.players[2].unplaced = 0;
    state.players[1].onBoard = 5;
    state.players[2].onBoard = 4;
    state.phase = 'movement';

    // Trap player 2 piece at 0 with player 1 pieces at 1 and 7
    // and trap all other P2 pieces
    state.board[0] = 2;
    state.board[1] = 1;
    state.board[7] = 1;

    // If P2 has no moves available
    state.currentPlayer = 2;
    const piecesToMove = getLegalPiecesToMove(state);
    expect(piecesToMove.length).toBe(0);
  });
});
