/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PointId, ThemeConfig } from './types.ts';

/**
 * 24 Points on standard Nine Men's Morris (Navakankari) board:
 * 
 * Outer Square:
 *  0 -------- 1 -------- 2
 *  |          |          |
 *  |  8 ----- 9 ---- 10  |
 *  |  |       |       |  |
 *  |  |  16 - 17 - 18 |  |
 *  |  |  |         |  |  |
 *  7 -15-23       19-11- 3
 *  |  |  |         |  |  |
 *  |  |  22 - 21 - 20 |  |
 *  |  |       |       |  |
 *  |  14 ---- 13 ---- 12 |
 *  |          |          |
 *  6 -------- 5 -------- 4
 */

export interface PointCoord {
  id: PointId;
  x: number; // SVG viewBox coordinate (0 - 600)
  y: number;
  label: string;
  notation: string; // Algebraic notation: a1 through g7
  ring: 'outer' | 'middle' | 'inner';
}

// 600 x 600 viewBox
// Outer ring: min 60, max 540 (mid 300)
// Middle ring: min 140, max 460 (mid 300)
// Inner ring: min 220, max 380 (mid 300)
export const BOARD_POINTS: PointCoord[] = [
  // Outer Ring (0 - 7)
  { id: 0, x: 60, y: 60, label: 'Outer Top-Left', notation: 'a7', ring: 'outer' },
  { id: 1, x: 300, y: 60, label: 'Outer Top-Mid', notation: 'd7', ring: 'outer' },
  { id: 2, x: 540, y: 60, label: 'Outer Top-Right', notation: 'g7', ring: 'outer' },
  { id: 3, x: 540, y: 300, label: 'Outer Right-Mid', notation: 'g4', ring: 'outer' },
  { id: 4, x: 540, y: 540, label: 'Outer Bottom-Right', notation: 'g1', ring: 'outer' },
  { id: 5, x: 300, y: 540, label: 'Outer Bottom-Mid', notation: 'd1', ring: 'outer' },
  { id: 6, x: 60, y: 540, label: 'Outer Bottom-Left', notation: 'a1', ring: 'outer' },
  { id: 7, x: 60, y: 300, label: 'Outer Left-Mid', notation: 'a4', ring: 'outer' },

  // Middle Ring (8 - 15)
  { id: 8, x: 140, y: 140, label: 'Middle Top-Left', notation: 'b6', ring: 'middle' },
  { id: 9, x: 300, y: 140, label: 'Middle Top-Mid', notation: 'd6', ring: 'middle' },
  { id: 10, x: 460, y: 140, label: 'Middle Top-Right', notation: 'f6', ring: 'middle' },
  { id: 11, x: 460, y: 300, label: 'Middle Right-Mid', notation: 'f4', ring: 'middle' },
  { id: 12, x: 460, y: 460, label: 'Middle Bottom-Right', notation: 'f2', ring: 'middle' },
  { id: 13, x: 300, y: 460, label: 'Middle Bottom-Mid', notation: 'd2', ring: 'middle' },
  { id: 14, x: 140, y: 460, label: 'Middle Bottom-Left', notation: 'b2', ring: 'middle' },
  { id: 15, x: 140, y: 300, label: 'Middle Left-Mid', notation: 'b4', ring: 'middle' },

  // Inner Ring (16 - 23)
  { id: 16, x: 220, y: 220, label: 'Inner Top-Left', notation: 'c5', ring: 'inner' },
  { id: 17, x: 300, y: 220, label: 'Inner Top-Mid', notation: 'd5', ring: 'inner' },
  { id: 18, x: 380, y: 220, label: 'Inner Top-Right', notation: 'e5', ring: 'inner' },
  { id: 19, x: 380, y: 300, label: 'Inner Right-Mid', notation: 'e4', ring: 'inner' },
  { id: 20, x: 380, y: 380, label: 'Inner Bottom-Right', notation: 'e3', ring: 'inner' },
  { id: 21, x: 300, y: 380, label: 'Inner Bottom-Mid', notation: 'd3', ring: 'inner' },
  { id: 22, x: 220, y: 380, label: 'Inner Bottom-Left', notation: 'c3', ring: 'inner' },
  { id: 23, x: 220, y: 300, label: 'Inner Left-Mid', notation: 'c4', ring: 'inner' },
];

/**
 * Adjacency graph for Nine Men's Morris:
 * Corners connect to 2 adjacent points on the same ring.
 * Midpoints connect to 2 adjacent points on the same ring PLUS cross-ring midpoints (3 or 4 connections).
 */
export const ADJACENCY_LIST: Record<PointId, PointId[]> = {
  // Outer Ring
  0: [1, 7],
  1: [0, 2, 9],       // Cross-bridge to middle
  2: [1, 3],
  3: [2, 4, 11],      // Cross-bridge to middle
  4: [3, 5],
  5: [4, 6, 13],      // Cross-bridge to middle
  6: [5, 7],
  7: [6, 0, 15],      // Cross-bridge to middle

  // Middle Ring
  8: [9, 15],
  9: [8, 10, 1, 17],  // Connects to outer (1) and inner (17)
  10: [9, 11],
  11: [10, 12, 3, 19], // Connects to outer (3) and inner (19)
  12: [11, 13],
  13: [12, 14, 5, 21], // Connects to outer (5) and inner (21)
  14: [13, 15],
  15: [14, 8, 7, 23],  // Connects to outer (7) and inner (23)

  // Inner Ring
  16: [17, 23],
  17: [16, 18, 9],    // Cross-bridge to middle
  18: [17, 19],
  19: [18, 20, 11],   // Cross-bridge to middle
  20: [19, 21],
  21: [20, 22, 13],   // Cross-bridge to middle
  22: [21, 23],
  23: [22, 16, 15],   // Cross-bridge to middle
};

/**
 * All 16 possible 3-in-a-row Mills in Nine Men's Morris.
 */
export const ALL_MILLS: PointId[][] = [
  // Outer ring lines (4)
  [0, 1, 2],
  [2, 3, 4],
  [4, 5, 6],
  [6, 7, 0],

  // Middle ring lines (4)
  [8, 9, 10],
  [10, 11, 12],
  [12, 13, 14],
  [14, 15, 8],

  // Inner ring lines (4)
  [16, 17, 18],
  [18, 19, 20],
  [20, 21, 22],
  [22, 23, 16],

  // Cross-ring connecting lines (4)
  [1, 9, 17],   // Top midpoints
  [3, 11, 19],  // Right midpoints
  [5, 13, 21],  // Bottom midpoints
  [7, 15, 23],  // Left midpoints
];

/**
 * Map each point to the list of mills it belongs to (each point belongs to 2 mills).
 */
export const POINT_TO_MILLS: Record<PointId, PointId[][]> = (() => {
  const map: Record<PointId, PointId[][]> = {};
  for (let i = 0; i < 24; i++) {
    map[i] = [];
  }
  for (const mill of ALL_MILLS) {
    for (const point of mill) {
      map[point].push(mill);
    }
  }
  return map;
})();

/**
 * Aesthetic visual themes
 */
export const THEMES: Record<string, ThemeConfig> = {
  teak: {
    id: 'teak',
    name: 'Vedic Teak & Ivory',
    background: 'bg-gradient-to-br from-stone-900 via-amber-950/60 to-stone-950',
    boardBg: '#2a1a10',
    boardBorder: '#78350f',
    boardLines: '#d97706',
    pointDefault: '#451a03',
    pointBorder: '#b45309',
    pointHover: '#f59e0b',
    highlightMove: '#10b981',
    highlightCapture: '#ef4444',
    highlightMill: '#fbbf24',
    player1: {
      primary: '#d97706',
      secondary: '#78350f',
      glow: '#fbbf24',
      text: 'text-amber-400',
    },
    player2: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      glow: '#e2e8f0',
      text: 'text-slate-100',
    },
  },
  obsidian: {
    id: 'obsidian',
    name: 'Midnight Obsidian',
    background: 'bg-gradient-to-br from-slate-950 via-zinc-900 to-black',
    boardBg: '#090d16',
    boardBorder: '#1e293b',
    boardLines: '#38bdf8',
    pointDefault: '#0f172a',
    pointBorder: '#0284c7',
    pointHover: '#38bdf8',
    highlightMove: '#22c55e',
    highlightCapture: '#f43f5e',
    highlightMill: '#a855f7',
    player1: {
      primary: '#f59e0b',
      secondary: '#b45309',
      glow: '#fbbf24',
      text: 'text-amber-400',
    },
    player2: {
      primary: '#06b6d4',
      secondary: '#0e7490',
      glow: '#22d3ee',
      text: 'text-cyan-400',
    },
  },
  marble: {
    id: 'marble',
    name: 'Classic Marble & Brass',
    background: 'bg-gradient-to-br from-neutral-900 via-stone-900 to-zinc-950',
    boardBg: '#1c1917',
    boardBorder: '#ca8a04',
    boardLines: '#eab308',
    pointDefault: '#292524',
    pointBorder: '#a16207',
    pointHover: '#facc15',
    highlightMove: '#34d399',
    highlightCapture: '#f87171',
    highlightMill: '#fef08a',
    player1: {
      primary: '#e11d48',
      secondary: '#881337',
      glow: '#fb7185',
      text: 'text-rose-400',
    },
    player2: {
      primary: '#f59e0b',
      secondary: '#78350f',
      glow: '#fde047',
      text: 'text-amber-300',
    },
  },
};
