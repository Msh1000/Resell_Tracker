import React from 'react';
import { Item, Bid, AppSettings } from '../../types';
import { formatZAR, formatPercent } from '../../lib/calculator';
import {
  TrendingUp,
  Package,
  Gavel,
  Zap,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Plus,
} from 'lucide-react';

interface MobileDashboardProps {
  items: Item[];
  bids: Bid[];
  settings: AppSettings;
  onNavigateTab: (tab: 'INVENTORY' | 'LIVE_BIDS' | 'CALCULATOR') => void;
  onFilterInventory: (status: string) => void;
  onOpenNewItem: () => void;
  onOpenNewBid: () => void;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  items,
  bids,
  onNavigateTab,
  onFilterInventory,
  onOpenNewItem,
  onOpenNewBid,
}) => {
  // Sold items metrics
  const soldItems = items.filter((i) => i.status === 'SOLD');
  const totalRealizedProfit = soldItems.reduce((acc, curr) => acc + (curr.calculatedNetProfit || 0), 0);
  const totalRevenue = soldItems.reduce((acc, curr) => acc + (curr.salePrice || 0), 0);
  const totalSoldCost = soldItems.reduce((acc, curr) => acc + (curr.calculatedLandedCost || 0), 0);
  const averageMargin = totalRevenue > 0 ? (totalRealizedProfit / totalRevenue) * 100 : 0;
  const totalRoi = totalSoldCost > 0 ? (totalRealizedProfit / totalSoldCost) * 100 : 0;

  // Active inventory metrics
  const inStockItems = items.filter((i) => i.status === 'IN_STOCK');
  const listedItems = items.filter((i) => i.status === 'LISTED');
  const awaitingStockItems = items.filter((i) => i.status === 'AWAITING_STOCK');
  const activeStock = [...inStockItems, ...listedItems, ...awaitingStockItems];
  const capitalInStock = activeStock.reduce((acc, curr) => acc + (curr.calculatedLandedCost || 0), 0);

  // Projected profit on listed items
  const potentialListedProfit = listedItems.reduce((acc, curr) => {
    return acc + (curr.calculatedNetProfit || 0);
  }, 0);

  // Bids stats
  const activeBids = bids.filter((b) => b.status === 'ACTIVE');
  const wonBids = bids.filter((b) => b.status === 'WON');
  const totalResolvedBids = bids.filter((b) => b.status === 'WON' || b.status === 'LOST');
  const winRate = totalResolvedBids.length > 0 ? (wonBids.length / totalResolvedBids.length) * 100 : 0;

  return (
    <div className="space-y-4 pb-20">
      {/* Hero Financial Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-925 border border-slate-800 p-4 shadow-lg">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
          <span>Realized Net Profit</span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <ArrowUpRight className="w-3 h-3" />
            ROI {formatPercent(totalRoi)}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-3xl font-black font-mono tracking-tight text-white">
            {formatZAR(totalRealizedProfit)}
          </h2>
          <span className="text-xs text-slate-400 font-medium">from {soldItems.length} sold</span>
        </div>

        {/* Mini 3-stat ledger row */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
          <div>
            <div className="text-[10px] text-slate-400">Total Revenue</div>
            <div className="text-xs font-bold font-mono text-slate-200 mt-0.5">
              {formatZAR(totalRevenue)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Avg Margin</div>
            <div className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
              {formatPercent(averageMargin)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Capital in Stock</div>
            <div className="text-xs font-bold font-mono text-amber-400 mt-0.5">
              {formatZAR(capitalInStock)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onOpenNewBid}
          className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between active:scale-[0.98] transition hover:border-slate-700"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Gavel className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Track Bid</div>
              <div className="text-[10px] text-slate-400">Live auction room</div>
            </div>
          </div>
          <Plus className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => onNavigateTab('CALCULATOR')}
          className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between active:scale-[0.98] transition hover:border-slate-700"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Quick Calc</div>
              <div className="text-[10px] text-slate-400">Bob Shop & VAT</div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Inventory & Auction Status Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Active Inventory */}
        <div
          onClick={() => {
            onFilterInventory('IN_STOCK');
            onNavigateTab('INVENTORY');
          }}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between cursor-pointer active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-blue-400" /> In Stock
            </span>
            <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 text-xs font-black flex items-center justify-center">
              {inStockItems.length}
            </span>
          </div>
          <div>
            <div className="text-sm font-bold font-mono text-white">
              {formatZAR(inStockItems.reduce((acc, c) => acc + c.calculatedLandedCost, 0))}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Landed cost basis</div>
          </div>
        </div>

        {/* Listed on Bob Shop */}
        <div
          onClick={() => {
            onFilterInventory('LISTED');
            onNavigateTab('INVENTORY');
          }}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between cursor-pointer active:scale-[0.98] transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-400" /> Listed
            </span>
            <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black flex items-center justify-center">
              {listedItems.length}
            </span>
          </div>
          <div>
            <div className="text-sm font-bold font-mono text-emerald-400">
              +{formatZAR(potentialListedProfit)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Potential target profit</div>
          </div>
        </div>
      </div>

      {/* Auction Performance Card */}
      <div
        onClick={() => onNavigateTab('LIVE_BIDS')}
        className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer active:scale-[0.98] transition"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Gavel className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Live Bids Win Rate</div>
              <div className="text-[10px] text-slate-400">
                {wonBids.length} Won &bull; {bids.filter((b) => b.status === 'LOST').length} Lost &bull; {activeBids.length} Active
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-black font-mono text-amber-400">
              {winRate.toFixed(0)}%
            </div>
            <div className="text-[9px] text-slate-500">Won ratio</div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${Math.min(100, Math.max(0, winRate))}%` }}
            className="bg-amber-400 h-full rounded-full transition-all"
          />
        </div>
      </div>

      {/* Recent Sold Flips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Sold Flips
          </span>
          <button
            onClick={() => {
              onFilterInventory('SOLD');
              onNavigateTab('INVENTORY');
            }}
            className="text-[11px] font-bold text-blue-400 hover:text-blue-300"
          >
            View All ({soldItems.length})
          </button>
        </div>

        <div className="space-y-1.5">
          {soldItems.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="text-xs font-bold text-white truncate">{item.name}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span>Sold {formatZAR(item.salePrice)}</span>
                  <span>&bull;</span>
                  <span>Cost {formatZAR(item.calculatedLandedCost)}</span>
                  {item.saleDate && (
                    <>
                      <span>&bull;</span>
                      <span>{item.saleDate}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div
                  className={`text-xs font-bold font-mono ${
                    (item.calculatedNetProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {(item.calculatedNetProfit || 0) >= 0 ? '+' : ''}
                  {formatZAR(item.calculatedNetProfit)}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {formatPercent(item.calculatedMarginPercent)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

