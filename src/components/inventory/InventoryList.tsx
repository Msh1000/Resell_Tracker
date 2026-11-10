import React, { useState, useMemo } from 'react';
import { Item, ItemStatus, AppSettings } from '../../types';
import { formatZAR, formatPercent } from '../../lib/calculator';
import {
  Search,
  Plus,
  Filter,
  CheckCircle,
  Tag,
  Package,
  Check,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface InventoryListProps {
  items: Item[];
  settings: AppSettings;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onOpenNewItem: () => void;
  onEditItem: (item: Item) => void;
  onQuickMarkSold: (item: Item) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  items,
  statusFilter,
  onStatusFilterChange,
  onOpenNewItem,
  onEditItem,
  onQuickMarkSold,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Counts
  const counts = useMemo(() => {
    return {
      ALL: items.length,
      IN_STOCK: items.filter((i) => i.status === 'IN_STOCK').length,
      LISTED: items.filter((i) => i.status === 'LISTED').length,
      SOLD: items.filter((i) => i.status === 'SOLD').length,
      RETURNED: items.filter((i) => i.status === 'RETURNED').length,
    };
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCategory = item.category?.toLowerCase().includes(query);
        const matchesNotes = item.notes?.toLowerCase().includes(query);
        return matchesName || matchesCategory || matchesNotes;
      }
      return true;
    });
  }, [items, statusFilter, searchQuery]);

  // Color helper for status badges
  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'LISTED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'SOLD':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'RETURNED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search stock, category, or notes..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none min-h-[44px]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Horizontal Filter Scroll Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        {(['ALL', 'IN_STOCK', 'LISTED', 'SOLD', 'RETURNED'] as const).map((st) => {
          const isActive = statusFilter === st;
          const count = counts[st] ?? 0;
          return (
            <button
              key={st}
              onClick={() => onStatusFilterChange(st)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition flex items-center gap-1.5 min-h-[36px] ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{st.replace('_', ' ')}</span>
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

      {/* Item Cards List */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center text-slate-500 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800/60 p-6">
          <Package className="w-10 h-10 mx-auto text-slate-600" />
          <div className="text-xs">No items match your filter.</div>
          <button
            onClick={onOpenNewItem}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Item
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const isSold = item.status === 'SOLD';
            const profit = item.calculatedNetProfit ?? 0;
            const margin = item.calculatedMarginPercent ?? 0;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 transition shadow-sm space-y-2.5"
              >
                {/* Header: Name, Category, Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1" onClick={() => onEditItem(item)}>
                    <h4 className="text-xs font-bold text-white truncate cursor-pointer hover:text-blue-400 transition">
                      {item.name}
                    </h4>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{item.category}</span>
                      <span>&bull;</span>
                      <span>{item.salesChannel}</span>
                      {item.purchaseDate && (
                        <>
                          <span>&bull;</span>
                          <span>{item.purchaseDate}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex-shrink-0 ${getStatusBadge(
                      item.status
                    )}`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Financial Ledger Row */}
                <div
                  className="grid grid-cols-3 gap-2 p-2 bg-slate-950/70 rounded-xl border border-slate-800/60 text-center font-mono cursor-pointer"
                  onClick={() => onEditItem(item)}
                >
                  <div>
                    <div className="text-[9px] text-slate-400">Landed Cost</div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5">
                      {formatZAR(item.calculatedLandedCost)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-slate-400">
                      {isSold ? 'Sold Price' : 'Target Price'}
                    </div>
                    <div className="text-xs font-bold text-slate-300 mt-0.5">
                      {formatZAR(item.salePrice || item.targetSalePrice || 0)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-slate-400">Net Profit</div>
                    <div
                      className={`text-xs font-bold mt-0.5 ${
                        profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {profit >= 0 ? '+' : ''}
                      {formatZAR(profit)}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[10px] font-mono text-slate-400">
                    Margin: <span className={margin >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{formatPercent(margin)}</span>
                    {item.notes && <span className="text-slate-500 ml-2 truncate max-w-[120px] inline-block align-bottom">&bull; {item.notes}</span>}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isSold && (
                      <button
                        onClick={() => onQuickMarkSold(item)}
                        className="py-1 px-2.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Mark Sold</span>
                      </button>
                    )}

                    <button
                      onClick={() => onEditItem(item)}
                      className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
