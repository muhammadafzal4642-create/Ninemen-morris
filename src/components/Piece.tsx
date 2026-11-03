/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerId, ThemeConfig } from '../game/types.ts';

interface PieceProps {
  player: PlayerId;
  isSelected?: boolean;
  isInMill?: boolean;
  isEligibleCapture?: boolean;
  size?: number;
  theme: ThemeConfig;
  className?: string;
  onClick?: () => void;
}

export const Piece: React.FC<PieceProps> = ({
  player,
  isSelected = false,
  isInMill = false,
  isEligibleCapture = false,
  size = 40,
  theme,
  className = '',
  onClick,
}) => {
  const isP1 = player === 1;
  const colors = isP1 ? theme.player1 : theme.player2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`cursor-pointer transition-all duration-200 select-none ${className} ${
        isSelected ? 'scale-110' : 'hover:scale-105'
      }`}
      onClick={onClick}
    >
      <defs>
        {/* Radial piece body gradient */}
        <radialGradient
          id={`piece-grad-${player}-${theme.id}`}
          cx="38%"
          cy="32%"
          r="65%"
        >
          <stop offset="0%" stopColor="#ffffff" stopOpacity={isP1 ? "0.6" : "0.9"} />
          <stop offset="35%" stopColor={colors.primary} />
          <stop offset="90%" stopColor={colors.secondary} />
          <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0.8" />
        </radialGradient>

        {/* Drop shadow filter */}
        <filter id={`drop-shadow-${player}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation={isSelected || isInMill ? "4" : "2"}
            floodColor={isSelected ? colors.glow : (isInMill ? theme.highlightMill : "#000000")}
            floodOpacity={isSelected || isInMill ? "0.9" : "0.6"}
          />
        </filter>
      </defs>

      {/* Outer Selection or Mill Highlight Ring */}
      {isSelected && (
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke={colors.glow}
          strokeWidth="4"
          strokeDasharray="6 3"
          className="animate-spin"
          style={{ animationDuration: '6s' }}
        />
      )}

      {isInMill && (
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke={theme.highlightMill}
          strokeWidth="3.5"
          className="animate-pulse"
        />
      )}

      {isEligibleCapture && (
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="#ef4444"
          strokeWidth="4"
          strokeDasharray="4 4"
          className="animate-pulse"
        />
      )}

      {/* Main piece circular body */}
      <circle
        cx="50"
        cy="50"
        r="42"
        fill={`url(#piece-grad-${player}-${theme.id})`}
        stroke={isSelected ? '#ffffff' : (isEligibleCapture ? '#ef4444' : colors.secondary)}
        strokeWidth={isSelected ? '3.5' : '2'}
        filter={`url(#drop-shadow-${player})`}
      />

      {/* Inner decorative rim */}
      <circle
        cx="50"
        cy="50"
        r="32"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />

      {/* Center symbol for high accessibility & colorblind distinction */}
      {isP1 ? (
        // Player 1 Symbol: Sun / Surya Chakra
        <g transform="translate(50, 50) scale(0.7)">
          <circle cx="0" cy="0" r="10" fill={colors.glow} fillOpacity="0.4" />
          <circle cx="0" cy="0" r="5" fill="#ffffff" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="0"
              y1="-11"
              x2="0"
              y2="-17"
              stroke={colors.glow}
              strokeWidth="2.5"
              strokeLinecap="round"
              transform={`rotate(${angle})`}
            />
          ))}
        </g>
      ) : (
        // Player 2 Symbol: Crescent Moon & Star / Chandra
        <g transform="translate(50, 50) scale(0.75)">
          <path
            d="M -4 -12 A 12 12 0 1 0 12 4 A 14 14 0 0 1 -4 -12 Z"
            fill={colors.glow}
            stroke="#ffffff"
            strokeWidth="1"
          />
          <circle cx="6" cy="-6" r="3" fill="#ffffff" />
        </g>
      )}

      {/* Specular curved shine highlight */}
      <path
        d="M 22 28 A 34 34 0 0 1 78 28 A 38 38 0 0 0 22 28 Z"
        fill="#ffffff"
        fillOpacity="0.3"
      />
    </svg>
  );
};
