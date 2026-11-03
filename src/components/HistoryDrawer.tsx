/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, History, RotateCcw } from 'lucide-react';
import { GameMove } from '../game/types.ts';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  moves: GameMove[];
  canUndo: boolean;
  onUndo: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  moves,
  canUndo,
  onUndo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm h-full bg-stone-900 border-l border-stone-800 p-5 flex flex-col shadow-2xl text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="font-heading font-bold text-white text-base">Move History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Moves List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
          {moves.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-stone-500">
              No moves played yet.
            </div>
          ) : (
            moves.map((move, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                  move.formedMill
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : move.type === 'capture'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    : 'bg-stone-950 border-stone-800/80 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-stone-500 text-[10px] w-5">
                    #{idx + 1}
                  </span>
                  <span className="font-medium">{move.notation}</span>
                </div>
                {move.formedMill && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    MILL
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Undo button (Local Mode) */}
        {canUndo && (
          <div className="pt-3 border-t border-stone-800">
            <button
              onClick={onUndo}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              Undo Last Move
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
