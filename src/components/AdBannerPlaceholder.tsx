/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

interface AdBannerPlaceholderProps {
  className?: string;
}

export const AdBannerPlaceholder: React.FC<AdBannerPlaceholderProps> = ({ className = '' }) => {
  return (
    <div
      className={`w-full max-w-xl mx-auto rounded-xl p-2.5 bg-stone-900/40 border border-stone-800/80 text-stone-400 text-xs flex items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
          Sponsor
        </span>
        <span className="text-[11px] text-stone-300">
          Navakankari: 100% Free & Open Strategy. Support our game with a star!
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-semibold shrink-0">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Ad-Free Experience</span>
      </div>
    </div>
  );
};
