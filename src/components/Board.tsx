/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BOARD_POINTS, PointCoord } from '../game/constants.ts';
import { isPointInMill } from '../game/engine.ts';
import { GameState, PointId, ThemeConfig } from '../game/types.ts';
import { Piece } from './Piece.tsx';

interface BoardProps {
  state: GameState;
  theme: ThemeConfig;
  onPointClick: (pointId: PointId) => void;
  disabled?: boolean;
}

export const Board: React.FC<BoardProps> = ({
  state,
  theme,
  onPointClick,
  disabled = false,
}) => {
  const {
    board,
    phase,
    status,
    currentPlayer,
    selectedPiece,
    legalDestinations,
    legalCapturePoints,
    activeMillPoints,
  } = state;

  // Compute legal placement points for active player
  const legalPlacements = React.useMemo(() => {
    if (phase !== 'placement' || status !== 'playing') return [];
    return board
      .map((p, idx) => (p === null ? idx : null))
      .filter((idx): idx is number => idx !== null);
  }, [board, phase, status]);

  // Points map for fast lookup
  const pointsMap = React.useMemo(() => {
    const map: Record<number, PointCoord> = {};
    BOARD_POINTS.forEach((pt) => {
      map[pt.id] = pt;
    });
    return map;
  }, []);

  return (
    <div className="relative w-full max-w-[560px] aspect-square mx-auto select-none touch-none">
      <svg
        viewBox="0 0 600 600"
        className="w-full h-full drop-shadow-2xl rounded-2xl overflow-visible"
        style={{
          background: theme.boardBg,
          boxShadow: `0 20px 40px -15px rgba(0,0,0,0.7), inset 0 0 0 4px ${theme.boardBorder}`,
        }}
      >
        <defs>
          {/* Subtle wood / stone grid pattern */}
          <radialGradient id="board-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
          </radialGradient>

          {/* Mill line glow filter */}
          <filter id="mill-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Pulsing destination glow */}
          <filter id="dest-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient board background lighting */}
        <rect
          x="12"
          y="12"
          width="576"
          height="576"
          rx="14"
          fill="url(#board-center-glow)"
        />

        {/* Outer decorative border line */}
        <rect
          x="30"
          y="30"
          width="540"
          height="540"
          fill="none"
          stroke={theme.boardBorder}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.4"
        />

        {/* ========================================== */}
        {/* CONCENTRIC SQUARES LINES (Nine Men's Morris) */}
        {/* ========================================== */}

        {/* Outer Square: 60,60 to 540,540 */}
        <rect
          x="60"
          y="60"
          width="480"
          height="480"
          fill="none"
          stroke={theme.boardLines}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Middle Square: 140,140 to 460,460 */}
        <rect
          x="140"
          y="140"
          width="320"
          height="320"
          fill="none"
          stroke={theme.boardLines}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner Square: 220,220 to 380,380 */}
        <rect
          x="220"
          y="220"
          width="160"
          height="160"
          fill="none"
          stroke={theme.boardLines}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ========================================== */}
        {/* CROSS-BRIDGE MIDPOINT LINES                */}
        {/* (Top, Right, Bottom, Left connecting rings)*/}
        {/* ========================================== */}

        {/* Top Cross Bridge: point 1 (300, 60) -> 9 (300, 140) -> 17 (300, 220) */}
        <line
          x1="300"
          y1="60"
          x2="300"
          y2="220"
          stroke={theme.boardLines}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Right Cross Bridge: point 3 (540, 300) -> 11 (460, 300) -> 19 (380, 300) */}
        <line
          x1="540"
          y1="300"
          x2="380"
          y2="300"
          stroke={theme.boardLines}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Bottom Cross Bridge: point 5 (300, 540) -> 13 (300, 460) -> 21 (300, 380) */}
        <line
          x1="300"
          y1="540"
          x2="300"
          y2="380"
          stroke={theme.boardLines}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Left Cross Bridge: point 7 (60, 300) -> 15 (140, 300) -> 23 (220, 300) */}
        <line
          x1="60"
          y1="300"
          x2="220"
          y2="300"
          stroke={theme.boardLines}
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Center emblem watermark */}
        <g transform="translate(300, 300)" opacity="0.15">
          <circle cx="0" cy="0" r="28" fill="none" stroke={theme.boardLines} strokeWidth="1.5" />
          <circle cx="0" cy="0" r="14" fill="none" stroke={theme.boardLines} strokeWidth="1" />
          <path d="M -8 0 L 8 0 M 0 -8 L 0 8" stroke={theme.boardLines} strokeWidth="1.5" />
        </g>

        {/* ========================================== */}
        {/* ACTIVE MILL HIGHLIGHT LINES                */}
        {/* ========================================== */}
        {activeMillPoints.length >= 3 && (
          <g filter="url(#mill-glow)">
            {/* Find matching coordinates for active mill */}
            <circle
              cx={pointsMap[activeMillPoints[0]]?.x || 0}
              cy={pointsMap[activeMillPoints[0]]?.y || 0}
              r="22"
              fill="none"
              stroke={theme.highlightMill}
              strokeWidth="4"
              className="animate-ping"
              opacity="0.75"
            />
            <circle
              cx={pointsMap[activeMillPoints[1]]?.x || 0}
              cy={pointsMap[activeMillPoints[1]]?.y || 0}
              r="22"
              fill="none"
              stroke={theme.highlightMill}
              strokeWidth="4"
              className="animate-ping"
              opacity="0.75"
            />
            <circle
              cx={pointsMap[activeMillPoints[2]]?.x || 0}
              cy={pointsMap[activeMillPoints[2]]?.y || 0}
              r="22"
              fill="none"
              stroke={theme.highlightMill}
              strokeWidth="4"
              className="animate-ping"
              opacity="0.75"
            />
          </g>
        )}

        {/* ========================================== */}
        {/* 24 INTERSECTION POINTS & PIECES            */}
        {/* ========================================== */}
        {BOARD_POINTS.map((pt) => {
          const pieceOwner = board[pt.id];
          const isSelected = selectedPiece === pt.id;
          const isLegalPlacement = legalPlacements.includes(pt.id);
          const isLegalDestination = legalDestinations.includes(pt.id);
          const isEligibleCapture = legalCapturePoints.includes(pt.id);
          const inMill = pieceOwner !== null ? isPointInMill(board, pt.id, pieceOwner) : false;

          const isInteractive =
            !disabled &&
            ((status === 'playing' && phase === 'placement' && pieceOwner === null) ||
              (status === 'playing' && phase !== 'placement' && pieceOwner === currentPlayer) ||
              (status === 'playing' && isLegalDestination) ||
              (status === 'capture' && isEligibleCapture));

          return (
            <g
              key={pt.id}
              className={`transition-transform duration-150 ${
                isInteractive ? 'cursor-pointer' : 'cursor-default'
              }`}
              onClick={() => {
                if (!disabled) onPointClick(pt.id);
              }}
            >
              {/* Invisible large touch hit area (56px diameter) for easy mobile tapping */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="28"
                fill="transparent"
                className="cursor-pointer"
              />

              {/* Base point intersection node */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="9"
                fill={theme.pointDefault}
                stroke={theme.pointBorder}
                strokeWidth="2.5"
              />

              {/* Center point pin */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill={theme.boardLines}
                opacity="0.8"
              />

              {/* Legal placement highlight pulse */}
              {isLegalPlacement && (
                <g filter="url(#dest-glow)">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="16"
                    fill="none"
                    stroke={theme.highlightMove}
                    strokeWidth="3"
                    className="animate-pulse"
                    opacity="0.85"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="6"
                    fill={theme.highlightMove}
                    opacity="0.7"
                  />
                </g>
              )}

              {/* Legal move destination highlight */}
              {isLegalDestination && (
                <g filter="url(#dest-glow)">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="18"
                    fill={theme.highlightMove}
                    fillOpacity="0.25"
                    stroke={theme.highlightMove}
                    strokeWidth="3.5"
                    className="animate-pulse"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="7"
                    fill={theme.highlightMove}
                  />
                </g>
              )}

              {/* Piece rendering if point is occupied */}
              {pieceOwner !== null && (
                <g transform={`translate(${pt.x - 22}, ${pt.y - 22})`}>
                  <Piece
                    player={pieceOwner}
                    size={44}
                    isSelected={isSelected}
                    isInMill={inMill}
                    isEligibleCapture={isEligibleCapture}
                    theme={theme}
                  />
                </g>
              )}

              {/* Target capture crosshair effect */}
              {isEligibleCapture && (
                <g filter="url(#dest-glow)">
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="25"
                    fill="none"
                    stroke={theme.highlightCapture}
                    strokeWidth="3"
                    strokeDasharray="4 3"
                    className="animate-pulse"
                  />
                  {/* Crosshair ticks */}
                  <line
                    x1={pt.x - 18}
                    y1={pt.y}
                    x2={pt.x - 12}
                    y2={pt.y}
                    stroke={theme.highlightCapture}
                    strokeWidth="2"
                  />
                  <line
                    x1={pt.x + 12}
                    y1={pt.y}
                    x2={pt.x + 18}
                    y2={pt.y}
                    stroke={theme.highlightCapture}
                    strokeWidth="2"
                  />
                  <line
                    x1={pt.x}
                    y1={pt.y - 18}
                    x2={pt.x}
                    y2={pt.y - 12}
                    stroke={theme.highlightCapture}
                    strokeWidth="2"
                  />
                  <line
                    x1={pt.x}
                    y1={pt.y + 12}
                    x2={pt.x}
                    y2={pt.y + 18}
                    stroke={theme.highlightCapture}
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Algebraic coordinate label (subtle small text) */}
              <text
                x={pt.x}
                y={pt.y + (pt.y > 500 ? -18 : 22)}
                textAnchor="middle"
                fontSize="11"
                fill="#ffffff"
                fillOpacity="0.25"
                fontWeight="bold"
                className="pointer-events-none select-none font-mono"
              >
                {pt.notation}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
