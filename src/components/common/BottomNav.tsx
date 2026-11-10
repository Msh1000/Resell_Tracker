import React from 'react';
import { LayoutDashboard, Package, Gavel, Zap, SlidersHorizontal } from 'lucide-react';

export type TabType = 'DASHBOARD' | 'INVENTORY' | 'LIVE_BIDS' | 'CALCULATOR' | 'SETTINGS';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  inventoryCount: number;
  activeBidsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  inventoryCount,
  activeBidsCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 pt-1 pb-safe shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1 items-center">
        {/* Dashboard */}
        <button
          onClick={() => onChangeTab('DASHBOARD')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
            activeTab === 'DASHBOARD'
              ? 'text-blue-400 bg-blue-500/10 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Dash</span>
        </button>

        {/* Inventory */}
        <button
          onClick={() => onChangeTab('INVENTORY')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition relative ${
            activeTab === 'INVENTORY'
              ? 'text-blue-400 bg-blue-500/10 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Package className="w-5 h-5 mb-0.5" />
            {inventoryCount > 0 && (
              <span className="absolute -top-1 -right-2.5 px-1 min-w-[15px] h-[15px] rounded-full text-[9px] font-black bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center">
                {inventoryCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Stock</span>
        </button>

        {/* Live Bids */}
        <button
          onClick={() => onChangeTab('LIVE_BIDS')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition relative ${
            activeTab === 'LIVE_BIDS'
              ? 'text-amber-400 bg-amber-500/10 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Gavel className="w-5 h-5 mb-0.5" />
            {activeBidsCount > 0 && (
              <span className="absolute -top-1 -right-2.5 px-1 min-w-[15px] h-[15px] rounded-full text-[9px] font-black bg-amber-400 text-slate-950 flex items-center justify-center animate-pulse">
                {activeBidsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Bids</span>
        </button>

        {/* Calculator */}
        <button
          onClick={() => onChangeTab('CALCULATOR')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
            activeTab === 'CALCULATOR'
              ? 'text-amber-400 bg-amber-500/10 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Calc</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onChangeTab('SETTINGS')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition ${
            activeTab === 'SETTINGS'
              ? 'text-slate-100 bg-slate-800 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Config</span>
        </button>
      </div>
    </nav>
  );
};
