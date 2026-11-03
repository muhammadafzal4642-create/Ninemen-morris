/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Home, ShieldAlert, Award } from 'lucide-react';
import { GameState, ThemeConfig } from '../game/types.ts';
import { Piece } from './Piece.tsx';

interface GameOverModalProps {
  state: GameState;
  theme: ThemeConfig;
  onRematch: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  state,
  theme,
  onRematch,
  onHome,
}) => {
  const { winner, winReason, status, players, moveHistory } = state;
  const isDraw = status === 'draw';
  const winningPlayer = winner ? players[winner] : null;

  useEffect(() => {
    if (winner) {
      // Fire celebratory confetti cannon
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#d97706', '#38bdf8', '#ffffff'],
        });
        const timer = setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 350);
        return () => clearTimeout(timer);
      } catch (e) {
        // Safe fallback if canvas not available
      }
    }
  }, [winner]);

  // Win reason text explanation
  let reasonText = '';
  if (isDraw) {
    reasonText = 'Match declared a draw by position repetition or 50 moves without a capture.';
  } else if (winReason === 'pieces_count') {
    reasonText = 'Opponent was reduced to fewer than 3 pieces and cannot form a mill.';
  } else if (winReason === 'no_moves') {
    reasonText = 'Opponent was completely blocked with no legal moves available (Stalemate victory).';
  } else if (winReason === 'resignation') {
    reasonText = 'Opponent conceded the match.';
  } else {
    reasonText = 'Match concluded decisively.';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-stone-900 border border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Winner emblem or Draw icon */}
        <div className="flex justify-center mb-4 relative">
          {isDraw ? (
            <div className="w-20 h-20 rounded-full bg-stone-800 border-2 border-stone-600 flex items-center justify-center text-stone-300">
              <ShieldAlert className="w-10 h-10" />
            </div>
          ) : (
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center shadow-lg">
                <Trophy className="w-10 h-10 text-amber-400" />
              </div>
              {winningPlayer && (
                <div className="absolute -bottom-2 -right-2">
                  <Piece player={winningPlayer.id} size={36} theme={theme} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-wide mb-1">
          {isDraw ? 'Game Drawn!' : `${winningPlayer?.name} Triumphs!`}
        </h2>
        <p className="text-amber-400/90 text-sm font-medium mb-4">
          {isDraw ? 'A masterclass of balance' : 'Navakankari Master of Strategy'}
        </p>

        {/* Win reason explanation */}
        <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 mb-6 text-xs text-stone-300 leading-relaxed">
          {reasonText}
        </div>

        {/* Match Statistics */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-stone-800/80 mb-6 text-stone-400 text-xs">
          <div>
            <div className="font-mono text-base font-bold text-white">
              {moveHistory.length}
            </div>
            <div>Total Moves</div>
          </div>
          <div>
            <div className="font-mono text-base font-bold text-amber-400">
              {players[1].captured + players[2].captured}
            </div>
            <div>Pieces Captured</div>
          </div>
          <div>
            <div className="font-mono text-base font-bold text-emerald-400">
              {moveHistory.filter((m) => m.formedMill).length}
            </div>
            <div>Mills Formed</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRematch}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-stone-950 font-bold transition-all shadow-lg shadow-amber-600/30 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Play Rematch
          </button>
          <button
            onClick={onHome}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-200 font-semibold border border-stone-700 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
