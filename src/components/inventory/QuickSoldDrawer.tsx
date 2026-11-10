import React, { useState, useEffect } from 'react';
import { Item, AppSettings } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { calculateOutbound, formatZAR, formatPercent } from '../../lib/calculator';
import { Check, Tag, Calendar, DollarSign } from 'lucide-react';

interface QuickSoldDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  settings: AppSettings;
  onConfirmSold: (itemId: string, salePrice: number, saleDate: string, salesChannel: string) => Promise<void>;
}

export const QuickSoldDrawer: React.FC<QuickSoldDrawerProps> = ({
  isOpen,
  onClose,
  item,
  settings,
  onConfirmSold,
}) => {
  const [salePrice, setSalePrice] = useState<number>(0);
  const [saleDate, setSaleDate] = useState<string>('');
  const [salesChannel, setSalesChannel] = useState<string>('Bob Shop');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setSalePrice(item.salePrice || item.targetSalePrice || 0);
      setSaleDate(item.saleDate || new Date().toISOString().split('T')[0]);
      setSalesChannel(item.salesChannel || settings.defaultSalesChannel || 'Bob Shop');
    }
  }, [item, settings]);

  if (!item) return null;

  // Real-time calculation preview
  const outbound = calculateOutbound({
    salePrice,
    platformFeePercent: item.platformFeePercent || settings.defaultPlatformFeePercent,
    deliveryCost: item.deliveryCost ?? settings.defaultDeliveryCost,
    packagingCost: item.packagingCost ?? settings.defaultPackagingCost,
    landedCost: item.calculatedLandedCost,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salePrice <= 0) return;
    try {
      setIsSubmitting(true);
      await onConfirmSold(item.id, salePrice, saleDate, salesChannel);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Item as Sold"
      subtitle={item.name}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Cost vs Sale Banner */}
        <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-[10px] text-slate-400">Total Landed Cost</div>
            <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
              {formatZAR(item.calculatedLandedCost)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Projected Net Profit</div>
            <div
              className={`text-sm font-bold font-mono mt-0.5 ${
                outbound.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {outbound.netProfit >= 0 ? '+' : ''}
              {formatZAR(outbound.netProfit)}
            </div>
          </div>
        </div>

        {/* Sale Price Input */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Selling Price (ZAR)</span>
            <span className="text-[10px] text-slate-400 font-mono">
              Margin: {formatPercent(outbound.marginPercent)}
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-sm">
              R
            </span>
            <input
              type="number"
              step="any"
              required
              autoFocus
              value={salePrice || ''}
              onChange={(e) => setSalePrice(Number(e.target.value))}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl text-base font-bold font-mono text-white focus:outline-none min-h-[48px]"
            />
          </div>
        </div>

        {/* Sale Date Input */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Sale Date
            </label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Channel
            </label>
            <input
              type="text"
              value={salesChannel}
              onChange={(e) => setSalesChannel(e.target.value)}
              placeholder="e.g. Bob Shop"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none min-h-[44px]"
            />
          </div>
        </div>

        {/* Deductions Breakdown Mini Ledger */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] space-y-1 font-mono text-slate-400">
          <div className="flex justify-between">
            <span>Platform Fee ({item.platformFeePercent}%):</span>
            <span className="text-slate-300">-{formatZAR(outbound.platformFee)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery + Packaging:</span>
            <span className="text-slate-300">
              -{formatZAR((item.deliveryCost || 0) + (item.packagingCost || 0))}
            </span>
          </div>
          <div className="flex justify-between font-bold text-slate-200 pt-1 border-t border-slate-800">
            <span>Net Payout:</span>
            <span className="text-emerald-400">{formatZAR(outbound.netPayout)}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting || salePrice <= 0}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-[0.99] transition cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{isSubmitting ? 'Recording Sale...' : 'Confirm Sale & Log Profit'}</span>
        </button>
      </form>
    </BottomSheet>
  );
};
