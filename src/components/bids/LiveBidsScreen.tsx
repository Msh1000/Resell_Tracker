import React, { useState } from 'react';
import { Bid, BidStatus, AppSettings } from '../../types';
import { formatZAR, formatPercent } from '../../lib/calculator';
import {
  Gavel,
  Plus,
  Trophy,
  XCircle,
  RotateCcw,
  Trash2,
  PackageCheck,
  Check,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { NewBidDrawer } from './NewBidDrawer';

interface LiveBidsScreenProps {
  bids: Bid[];
  settings: AppSettings;
  onUpdateBidStatus: (id: string, status: BidStatus) => Promise<void>;
  onAdjustHammerPrice: (id: string, newPrice: number) => Promise<void>;
  onDeleteBid: (id: string) => Promise<void>;
  onSaveNewBid: (bidData: Partial<Bid>) => Promise<void>;
  onNavigateToStock: () => void;
  isNewBidDrawerOpen: boolean;
  setIsNewBidDrawerOpen: (open: boolean) => void;
}

export const LiveBidsScreen: React.FC<LiveBidsScreenProps> = ({
  bids,
  settings,
  onUpdateBidStatus,
  onAdjustHammerPrice,
  onDeleteBid,
  onSaveNewBid,
  onNavigateToStock,
  isNewBidDrawerOpen,
  setIsNewBidDrawerOpen,
}) => {
  const [filter, setFilter] = useState<'ACTIVE' | 'WON' | 'LOST' | 'ALL'>('ACTIVE');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredBids = bids.filter((b) => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  const activeCount = bids.filter((b) => b.status === 'ACTIVE').length;
  const wonCount = bids.filter((b) => b.status === 'WON').length;
  const lostCount = bids.filter((b) => b.status === 'LOST').length;

  const handleWin = async (bid: Bid) => {
    await onUpdateBidStatus(bid.id, 'WON');
    showToast(`"${bid.name}" won! Automatically added to Inventory.`);
  };

  const handleLost = async (bid: Bid) => {
    await onUpdateBidStatus(bid.id, 'LOST');
    showToast(`"${bid.name}" marked as lost.`);
  };

  const handleReactivate = async (bid: Bid) => {
    await onUpdateBidStatus(bid.id, 'ACTIVE');
    showToast(`"${bid.name}" reactivated.`);
  };

  const handleStepPrice = async (bid: Bid, delta: number) => {
    const newPrice = Math.max(0, (bid.hammerPrice || 0) + delta);
    await onAdjustHammerPrice(bid.id, newPrice);
  };

  return (
    <div className="space-y-3 pb-24">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-lg animate-in slide-in-from-top">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Filter Tabs & New Bid Pill */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex gap-1 overflow-x-auto text-xs font-semibold no-scrollbar">
          {(['ACTIVE', 'WON', 'LOST', 'ALL'] as const).map((st) => {
            const isActive = filter === st;
            let count = bids.length;
            if (st === 'ACTIVE') count = activeCount;
            if (st === 'WON') count = wonCount;
            if (st === 'LOST') count = lostCount;

            return (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 min-h-[36px] ${
                  isActive
                    ? 'bg-amber-600 text-white font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{st}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsNewBidDrawerOpen(true)}
          className="py-1.5 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm shadow-amber-500/20 active:scale-95 transition flex-shrink-0 min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Bid</span>
        </button>
      </div>

      {/* Bids List */}
      {filteredBids.length === 0 ? (
        <div className="py-12 text-center text-slate-500 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800/60 p-6">
          <Gavel className="w-10 h-10 mx-auto text-slate-600" />
          <div className="text-xs">No {filter.toLowerCase()} bids recorded.</div>
          <button
            onClick={() => setIsNewBidDrawerOpen(true)}
            className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl shadow inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Track New Auction Bid
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBids.map((bid) => {
            const isActive = bid.status === 'ACTIVE';
            const isWon = bid.status === 'WON';
            const isLost = bid.status === 'LOST';

            return (
              <div
                key={bid.id}
                className={`p-3.5 rounded-2xl border transition shadow-sm space-y-3 ${
                  isActive
                    ? 'bg-slate-900/90 border-amber-500/40 shadow-amber-500/5'
                    : isWon
                    ? 'bg-slate-900/70 border-emerald-500/30'
                    : 'bg-slate-900/50 border-slate-800/80 opacity-80'
                }`}
              >
                {/* Header: Lot Name & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{bid.name}</h4>
                    </div>
                    {bid.notes && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{bid.notes}</p>
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex-shrink-0 ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : isWon
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {bid.status}
                  </span>
                </div>

                {/* Primary Financial Ledger */}
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-3 gap-2 text-center font-mono">
                  <div>
                    <div className="text-[9px] text-slate-400">Current Hammer</div>
                    <div className="text-sm font-black text-white mt-0.5">
                      {formatZAR(bid.hammerPrice)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-slate-400">Total Landed</div>
                    <div className="text-sm font-black text-amber-400 mt-0.5">
                      {formatZAR(bid.calculatedLandedCost)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-slate-400">Est. Profit</div>
                    <div
                      className={`text-sm font-black mt-0.5 ${
                        (bid.calculatedNetProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {(bid.calculatedNetProfit || 0) >= 0 ? '+' : ''}
                      {formatZAR(bid.calculatedNetProfit)}
                    </div>
                  </div>
                </div>

                {/* Real-time Bid Stepper Bar (Active bids only) */}
                {isActive && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono">
                      <span>Quick Stepper (+12% Fee + 15% VAT included)</span>
                      <span>Resale: R{bid.expectedSalePrice || 0}</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      <button
                        onClick={() => handleStepPrice(bid, -50)}
                        className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-lg transition active:scale-95"
                      >
                        -50
                      </button>
                      <button
                        onClick={() => handleStepPrice(bid, -10)}
                        className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-lg transition active:scale-95"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleStepPrice(bid, 10)}
                        className="py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-mono font-bold rounded-lg border border-amber-500/30 transition active:scale-95"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => handleStepPrice(bid, 50)}
                        className="py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-mono font-bold rounded-lg border border-amber-500/30 transition active:scale-95"
                      >
                        +50
                      </button>
                      <button
                        onClick={() => handleStepPrice(bid, 100)}
                        className="py-2 bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 text-xs font-mono font-black rounded-lg border border-amber-500/40 transition active:scale-95"
                      >
                        +100
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      if (confirm(`Delete bid "${bid.name}"?`)) onDeleteBid(bid.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                    title="Delete bid"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {isActive && (
                      <>
                        <button
                          onClick={() => handleLost(bid)}
                          className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs font-bold transition flex items-center gap-1 active:scale-95"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Lost</span>
                        </button>

                        <button
                          onClick={() => handleWin(bid)}
                          className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 active:scale-95"
                        >
                          <Trophy className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Won Lot!</span>
                        </button>
                      </>
                    )}

                    {isWon && (
                      <button
                        onClick={onNavigateToStock}
                        className="py-1.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>In Inventory</span>
                      </button>
                    )}

                    {isLost && (
                      <button
                        onClick={() => handleReactivate(bid)}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reactivate</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Bid Drawer */}
      <NewBidDrawer
        isOpen={isNewBidDrawerOpen}
        onClose={() => setIsNewBidDrawerOpen(false)}
        settings={settings}
        onSaveBid={onSaveNewBid}
      />
    </div>
  );
};

