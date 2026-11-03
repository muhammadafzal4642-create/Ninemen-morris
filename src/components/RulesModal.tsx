/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, BookOpen, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[88vh] bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-white">
                How to Play Navakankari
              </h2>
              <p className="text-xs text-stone-400">
                Traditional Nine Men's Morris Rules & Strategy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-2 py-4 space-y-6 text-sm leading-relaxed">
          {/* Overview */}
          <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-4">
            <h3 className="font-heading font-semibold text-amber-400 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> The Ancient Board Game
            </h3>
            <p className="text-xs sm:text-sm text-stone-300">
              <strong>Navakankari</strong> (meaning <em>"Nine Pebbles"</em> in Sanskrit), known globally as <strong>Nine Men's Morris</strong>, is one of the world's oldest strategy board games, etched into stone in Roman temples, ancient Indian shrines, and medieval manuscripts.
            </p>
          </div>

          {/* Three Phases */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
              <div className="flex items-center gap-2 font-bold text-amber-400 mb-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">
                  1
                </span>
                Phase 1: Placing Pieces
              </div>
              <ul className="text-xs sm:text-sm space-y-1.5 text-stone-300 list-disc list-inside">
                <li>Players take turns placing their <strong>9 pieces</strong>, one by one, on any vacant intersection point.</li>
                <li>Whenever a player aligns <strong>three pieces in a row</strong> along any board line, a <strong>Mill</strong> is formed!</li>
                <li>Forming a mill immediately allows that player to remove one opponent piece from the board.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
              <div className="flex items-center gap-2 font-bold text-amber-400 mb-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">
                  2
                </span>
                Phase 2: Moving Pieces
              </div>
              <ul className="text-xs sm:text-sm space-y-1.5 text-stone-300 list-disc list-inside">
                <li>Once all 18 pieces have been placed, players take turns sliding one piece along a line to an <strong>adjacent empty point</strong>.</li>
                <li>Pieces cannot jump over other pieces during normal movement.</li>
                <li>Completing a new mill allows capturing another opponent piece.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
              <div className="flex items-center gap-2 font-bold text-amber-400 mb-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">
                  3
                </span>
                Phase 3: Flying (Leaping)
              </div>
              <ul className="text-xs sm:text-sm space-y-1.5 text-stone-300 list-disc list-inside">
                <li>When a player is reduced to <strong>exactly 3 remaining pieces</strong>, their pieces can <strong>fly</strong>!</li>
                <li>Flying allows that player to move to <em>any vacant point on the board</em>, ignoring line adjacency.</li>
              </ul>
            </div>
          </div>

          {/* Mill & Capture Rules */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
            <h4 className="font-heading font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Piece Removal (Capture) Rules
            </h4>
            <div className="text-xs sm:text-sm space-y-2 text-stone-300">
              <p>
                • You cannot remove an opponent's piece if it is currently inside an active mill.
              </p>
              <p>
                • <strong>Exception:</strong> If <em>all</em> of the opponent's pieces on the board are inside mills, you are legally permitted to remove any piece.
              </p>
            </div>
          </div>

          {/* Winning & Losing */}
          <div className="p-4 rounded-xl bg-stone-950 border border-stone-800">
            <h4 className="font-heading font-bold text-white mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" /> Winning the Game
            </h4>
            <ul className="text-xs sm:text-sm space-y-2 text-stone-300">
              <li>
                <strong>Fewer than 3 Pieces:</strong> A player loses when they have only 2 pieces left on the board in Phase 2 or 3.
              </li>
              <li>
                <strong>No Legal Moves (Stalemate):</strong> A player loses if it is their turn to move and all their pieces are blocked.
              </li>
              <li>
                <strong>Draw:</strong> Occurs automatically if the exact same board position repeats 3 times, or 50 moves pass without a piece capture.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold transition cursor-pointer"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
