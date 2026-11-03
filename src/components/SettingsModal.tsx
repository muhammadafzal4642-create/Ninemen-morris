/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Palette, Volume2, VolumeX, Sliders, ShieldCheck } from 'lucide-react';
import { THEMES } from '../game/constants.ts';
import { sounds } from '../game/sound.ts';
import { GameTheme, ThemeConfig } from '../game/types.ts';
import { AiDifficulty } from '../game/ai.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeConfig;
  onSelectTheme: (themeId: GameTheme) => void;
  player1Name: string;
  player2Name: string;
  onUpdateNames: (p1: string, p2: string) => void;
  aiDifficulty: AiDifficulty;
  onSelectAiDifficulty: (diff: AiDifficulty) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  player1Name,
  player2Name,
  onUpdateNames,
  aiDifficulty,
  onSelectAiDifficulty,
}) => {
  const [muted, setMuted] = React.useState(sounds.getMuted());
  const [vol, setVol] = React.useState(sounds.getVolume());
  const [p1, setP1] = React.useState(player1Name);
  const [p2, setP2] = React.useState(player2Name);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const nextMuted = sounds.toggleMute();
    setMuted(nextMuted);
    if (!nextMuted) sounds.playClick();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVol(newVol);
    sounds.setVolume(newVol);
  };

  const handleSave = () => {
    onUpdateNames(p1.trim() || 'Player 1', p2.trim() || 'Player 2');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-white">Game Settings</h2>
              <p className="text-xs text-stone-400">Visual themes, sounds & preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-6 max-h-[65vh] overflow-y-auto pr-1">
          {/* Themes Selection */}
          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-stone-400 flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-amber-400" /> Board Theme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(THEMES) as GameTheme[]).map((themeKey) => {
                const item = THEMES[themeKey];
                const isSelected = currentTheme.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTheme(themeKey);
                      sounds.playClick();
                    }}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between h-24 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 shadow-md'
                        : 'border-stone-800 bg-stone-950 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: item.boardLines, borderColor: item.boardBorder }}
                      />
                      <span className="font-heading text-xs font-bold text-white leading-tight">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: item.player1.primary }}
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: item.player2.primary }}
                      />
                      <span className="text-[10px] text-stone-400 ml-auto">
                        {isSelected ? 'Active' : ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audio Controls */}
          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-stone-400 flex items-center justify-between mb-3">
              <span className="flex items-center gap-2">
                {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                Sound Effects
              </span>
              <button
                onClick={handleToggleSound}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition cursor-pointer ${
                  muted ? 'bg-stone-800 text-stone-400' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {muted ? 'Muted' : 'Enabled'}
              </button>
            </label>
            <div className="flex items-center gap-3 bg-stone-950 p-3 rounded-xl border border-stone-800">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : vol}
                disabled={muted}
                onChange={handleVolumeChange}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-xs font-mono text-stone-400 w-10 text-right">
                {muted ? '0%' : `${Math.round(vol * 100)}%`}
              </span>
            </div>
          </div>

          {/* AI Bot Difficulty */}
          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-stone-400 flex items-center gap-2 mb-3">
              Bot Practice Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as AiDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => onSelectAiDifficulty(diff)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition cursor-pointer border ${
                    aiDifficulty === diff
                      ? 'bg-amber-600 text-stone-950 border-amber-500'
                      : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Player Names */}
          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-stone-400 block mb-3">
              Player Names (Local Mode)
            </label>
            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-stone-400 mb-1 block">Player 1 Name</span>
                <input
                  type="text"
                  value={p1}
                  maxLength={18}
                  onChange={(e) => setP1(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <span className="text-[11px] text-stone-400 mb-1 block">Player 2 Name</span>
                <input
                  type="text"
                  value={p2}
                  maxLength={18}
                  onChange={(e) => setP2(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Privacy & Free Tier compliance note */}
          <div className="bg-stone-950/40 p-3 rounded-xl border border-stone-800 text-[11px] text-stone-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Navakankari stores game settings locally on your device. No telemetry, invasive tracking, or personal credentials are sent.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-stone-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 text-sm font-bold transition cursor-pointer"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
