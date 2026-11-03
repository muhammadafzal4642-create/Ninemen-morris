/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Play,
  Users,
  Globe,
  Bot,
  BookOpen,
  ChevronDown,
  Shield,
  Sparkles,
  Award,
} from 'lucide-react';

interface LandingPageProps {
  onStartLocalGame: () => void;
  onStartBotGame: () => void;
  onOpenOnlineModal: () => void;
  onOpenRules: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartLocalGame,
  onStartBotGame,
  onOpenOnlineModal,
  onOpenRules,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What is Navakankari?',
      a: 'Navakankari (also known as Nine Men’s Morris or Merels) is a traditional two-player alignment strategy game that dates back thousands of years. "Nava" means nine, and "Kankari" means pebbles or pieces in Sanskrit.',
    },
    {
      q: 'How does the Flying phase work?',
      a: 'When either player is reduced to exactly 3 pieces remaining on the board, their pieces gain the ability to "fly" — moving to any unoccupied intersection on the board rather than only adjacent points.',
    },
    {
      q: 'Can I remove an opponent’s piece that is in a mill?',
      a: 'No, pieces that form an active mill are protected. However, if ALL of the opponent’s pieces currently on the board are inside mills, you are allowed to capture any one of them.',
    },
    {
      q: 'Is an internet connection required to play?',
      a: 'No! The primary Local 2-Player mode and Bot Practice mode run 100% in your browser and work completely offline once loaded. Online Multiplayer connects across devices when connected.',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 text-stone-200">
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          The Ancient Sanskrit Strategy Board Game
        </div>

        <h1 className="font-heading text-4xl sm:text-6xl font-black text-white tracking-tight">
          NAVAKANKARI
        </h1>
        <p className="font-heading text-lg sm:text-xl text-amber-400 font-semibold">
          Nine Men's Morris • Ancient Vedic Strategy
        </p>
        <p className="max-w-2xl mx-auto text-stone-300 text-sm sm:text-base leading-relaxed">
          Align three pieces to forge a <strong>Mill</strong>, seize your opponent's tokens, and outmaneuver them through placement, tactical sliding, and the legendary flying phase.
        </p>

        {/* Primary CTA Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
          <button
            onClick={onStartLocalGame}
            className="flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-stone-950 font-extrabold text-sm sm:text-base transition shadow-xl shadow-amber-600/30 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            Play on Same Device
          </button>
          <button
            onClick={onOpenOnlineModal}
            className="flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-white font-bold text-sm sm:text-base border border-stone-700 transition shadow-lg cursor-pointer"
          >
            <Globe className="w-5 h-5 text-cyan-400" />
            Play Online Room
          </button>
          <button
            onClick={onStartBotGame}
            className="flex items-center gap-2.5 px-5 py-4 rounded-2xl bg-stone-900 hover:bg-stone-800 active:scale-95 text-stone-300 font-semibold text-sm border border-stone-800 transition cursor-pointer"
          >
            <Bot className="w-5 h-5 text-amber-400" />
            Practice vs Bot
          </button>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-16">
        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-white text-base mb-1.5">
              Local Pass & Play
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Play side-by-side with friends on any phone, tablet, laptop, or desktop with touch or mouse input and undo options.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-white text-base mb-1.5">
              Online Multiplayer Rooms
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Create a secure private room, share your room code, and battle opponents with real-time move validation.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-white text-base mb-1.5">
              Standard Tournament Rules
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Full 3-phase engine: Placement, Movement, Flying at 3 pieces, Mill protection rules, and Stalemate detection.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Summary Card */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 mb-16 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
          <div>
            <h2 className="font-heading text-2xl font-bold text-white">
              Rules of the Game
            </h2>
            <p className="text-xs text-stone-400">
              Master the three phases of Navakankari
            </p>
          </div>
          <button
            onClick={onOpenRules}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-semibold text-xs border border-stone-700 transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            View Full Illustrated Rules
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">
                1
              </span>
              Phase 1: Placement
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Both players take turns placing 9 pieces onto vacant intersections. Aligning 3 pieces in a row completes a Mill and captures 1 opponent piece.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">
                2
              </span>
              Phase 2: Movement
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              Slide pieces along connected lines to adjacent vacant spots. Trap opponent pieces or create lines of 3 to continue capturing.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">
                3
              </span>
              Phase 3: Flying
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              When down to 3 pieces, you can fly anywhere on the board! A player loses when reduced to 2 pieces or left with no legal moves.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="mb-16">
        <h2 className="font-heading text-2xl font-bold text-white text-center mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3 max-w-2xl mx-auto">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-stone-900/60 border border-stone-800 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-white hover:text-amber-400 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-amber-400' : 'text-stone-500'
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-stone-300 leading-relaxed border-t border-stone-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Privacy note */}
      <div className="border-t border-stone-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <span>Navakankari Game Engine • 100% Free & Open Source</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hover:text-stone-300 cursor-pointer" onClick={onOpenRules}>Game Rules</span>
          <span>•</span>
          <span className="text-stone-400">No Account Required</span>
          <span>•</span>
          <span className="text-stone-400">v1.0.0 Release</span>
        </div>
      </div>
    </div>
  );
};
