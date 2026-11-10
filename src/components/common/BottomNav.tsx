import React from 'react';
import { LayoutDashboard, Package, Gavel, Zap, Plus } from 'lucide-react';

export type TabType = 'DASHBOARD' | 'INVENTORY' | 'LIVE_BIDS' | 'CALCULATOR' | 'SETTINGS';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  inventoryCount: number;
  activeBidsCount: number;
  onOpenNewItem: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  inventoryCount,
  activeBidsCount,
  onOpenNewItem,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 pt-1 pb-safe shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1 items-center">
        {/* 1. Dashboard */}
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

        {/* 2. Inventory / Stock */}
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

        {/* 3. CENTER RAISED (+) BUTTON */}
        <div className="flex justify-center items-center">
          <button
            onClick={onOpenNewItem}
            aria-label="Add Item"
            className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 active:scale-95 transition"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Live Bids */}
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

        {/* 5. Calculator */}
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
      </div>
    </nav>
  );
};
