import React from 'react';
import { Gavel, Settings } from 'lucide-react';
import { formatZAR } from '../../lib/calculator';

interface TopHeaderProps {
  totalProfit: number;
  onOpenSettings: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  totalProfit,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 pt-safe pb-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Gavel className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white text-sm tracking-tight">ResellTrack</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Bob Shop
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Net Profit: <span className={totalProfit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{formatZAR(totalProfit)}</span>
            </div>
          </div>
        </div>

        {/* Right Action: Settings / Config Icon only (no duplicate add button) */}
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          title="Auction & Bob Shop Presets"
          className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 active:scale-95 transition hover:text-white hover:border-slate-700"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
