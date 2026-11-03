/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlayerId = 1 | 2;

export type GamePhase = 'placement' | 'movement' | 'flying';

export type GameStatus = 'playing' | 'capture' | 'won' | 'draw';

export type WinReason = 'pieces_count' | 'no_moves' | 'resignation' | 'timeout' | null;

export type PointId = number; // 0 through 23

export type BoardState = (PlayerId | null)[]; // 24 points

export interface PlayerInfo {
  id: PlayerId;
  name: string;
  colorName: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  unplaced: number; // remaining to place (starts at 9)
  onBoard: number;   // count of active pieces on board
  captured: number;  // opponent pieces captured
  isAi?: boolean;
}

export type MoveType = 'place' | 'move' | 'capture';

export interface GameMove {
  type: MoveType;
  player: PlayerId;
  from?: PointId;
  to?: PointId;
  captured?: PointId;
  formedMill?: boolean;
  millPoints?: PointId[];
  timestamp: number;
  notation: string;
}

export interface GameState {
  board: BoardState;
  currentPlayer: PlayerId;
  phase: GamePhase;
  status: GameStatus;
  winner: PlayerId | null;
  winReason: WinReason;
  players: {
    1: PlayerInfo;
    2: PlayerInfo;
  };
  millFormedJustNow: boolean;
  activeMillPoints: PointId[]; // points in the newly formed mill
  selectedPiece: PointId | null; // point currently selected for moving
  legalDestinations: PointId[]; // highlighted targets for selected piece
  legalCapturePoints: PointId[]; // opponent pieces eligible for removal
  moveHistory: GameMove[];
  consecutiveNonCaptureMoves: number; // for draw detection (50 non-capture move rule)
  positionHistory: string[]; // board hash history for threefold repetition
}

export type GameTheme = 'teak' | 'obsidian' | 'marble' | 'parchment';

export interface ThemeConfig {
  id: GameTheme;
  name: string;
  background: string;
  boardBg: string;
  boardBorder: string;
  boardLines: string;
  pointDefault: string;
  pointBorder: string;
  pointHover: string;
  highlightMove: string;
  highlightCapture: string;
  highlightMill: string;
  player1: {
    primary: string;
    secondary: string;
    glow: string;
    text: string;
  };
  player2: {
    primary: string;
    secondary: string;
    glow: string;
    text: string;
  };
}

export interface OnlineRoom {
  id: string;
  code: string;
  hostPlayerId: string;
  hostSide: PlayerId;
  guestPlayerId?: string;
  gameState: GameState;
  lastUpdated: number;
  status: 'waiting' | 'active' | 'completed' | 'abandoned';
}
