/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GamePhase, GameStatus, PlayerId, PlayerInfo, ThemeConfig } from '../game/types.ts';
import { Piece } from './Piece.tsx';

interface PlayerCardProps {
  player: PlayerInfo;
  isCurrentTurn: boolean;
  gamePhase: GamePhase;
  gameStatus: GameStatus;
  theme: ThemeConfig;
  className?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentTurn,
  gamePhase,
  gameStatus,
  theme,
  className = '',
}) => {
  const isP1 = player.id === 1;
  const colors = isP1 ? theme.player1 : theme.player2;

  // Status message
  let statusBadge = '';
  if (isCurrentTurn) {
    if (gameStatus === 'capture') {
      statusBadge = 'REMOVE OPPONENT PIECE';
    } else if (gamePhase === 'placement') {
      statusBadge = `PLACE PIECE (${player.unplaced} LEFT)`;
    } else if (player.onBoard === 3) {
      statusBadge = 'FLYING (ANY POINT)';
    } else {
      statusBadge = 'SELECT & MOVE';
    }
  } else {
    statusBadge = 'WAITING';
  }

  return (
    <div
      className={`relative rounded-2xl p-3.5 sm:p-4 transition-all duration-300 border flex flex-col justify-between ${
        isCurrentTurn
          ? 'bg-stone-900/90 shadow-xl border-amber-500/80 scale-[1.02]'
          : 'bg-stone-900/40 border-stone-800 opacity-80'
      } ${className}`}
      style={{
        boxShadow: isCurrentTurn
          ? `0 10px 25px -5px ${colors.glow}33, 0 0 0 1px ${colors.glow}66`
          : undefined,
      }}
    >
      {/* Top Header: Avatar + Name + Turn badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 relative">
            <Piece
              player={player.id}
              size={34}
              theme={theme}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-sm sm:text-base text-white truncate max-w-[110px] sm:max-w-[150px]">
                {player.name}
              </span>
              {player.isAi && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  BOT
                </span>
              )}
            </div>
            <div className="text-[11px] text-stone-400">
              {isP1 ? 'Player 1' : 'Player 2'} • {player.colorName}
            </div>
          </div>
        </div>

        {/* Status pill */}
        <span
          className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
            isCurrentTurn
              ? gameStatus === 'capture'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-stone-800 text-stone-400 border-stone-700'
          }`}
        >
          {statusBadge}
        </span>
      </div>

      {/* Middle: Pieces Count & Rack */}
      <div className="mt-3 flex items-center justify-between text-xs sm:text-sm">
        {/* Placement pieces remaining rack */}
        {player.unplaced > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-stone-400 font-medium">
              Hand: <strong className="text-white">{player.unplaced}</strong> / 9 to place
            </span>
            <div className="flex gap-1 items-center flex-wrap">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${
                    i < player.unplaced
                      ? 'scale-100'
                      : 'opacity-15 scale-75'
                  }`}
                  style={{
                    backgroundColor: i < player.unplaced ? colors.primary : '#52525b',
                    boxShadow: i < player.unplaced ? `0 0 5px ${colors.glow}` : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-400">Active Pieces:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-xs ${
                player.onBoard === 3
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse'
                  : 'bg-stone-800 text-stone-200'
              }`}
            >
              {player.onBoard} pieces {player.onBoard === 3 ? '(Flying!)' : ''}
            </span>
          </div>
        )}

        {/* Captured tally */}
        <div className="flex items-center gap-1.5 pl-2">
          <span className="text-[11px] text-stone-400">Captured:</span>
          <span className="font-mono font-bold text-amber-400 text-sm">
            {player.captured}
          </span>
        </div>
      </div>
    </div>
  );
};
