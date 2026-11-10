import React, { useState } from 'react';
import { Bid, AppSettings } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { calculateInbound, calculateOutbound, formatZAR } from '../../lib/calculator';
import { Gavel, Plus, Zap } from 'lucide-react';

interface NewBidDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveBid: (bidData: Partial<Bid>) => Promise<void>;
}

export const NewBidDrawer: React.FC<NewBidDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveBid,
}) => {
  const [name, setName] = useState('');
  const [hammerPrice, setHammerPrice] = useState<number>(300);
  const [expectedSalePrice, setExpectedSalePrice] = useState<number | ''>(600);
  const [buyerFeePercent, setBuyerFeePercent] = useState<number>(settings.defaultBuyerFeePercent ?? 12);
  const [vatPercent, setVatPercent] = useState<number>(settings.defaultVatPercent ?? 15);
  const [inboundOtherCost, setInboundOtherCost] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Live calculations
  const inbound = calculateInbound({
    hammerPrice: Number(hammerPrice) || 0,
    buyerFeePercent,
    vatMode: settings.defaultVatMode,
    vatPercent,
    inboundOtherCost,
  });

  const outbound = calculateOutbound({
    salePrice: expectedSalePrice !== '' ? Number(expectedSalePrice) : 0,
    platformFeePercent: settings.defaultPlatformFeePercent,
    deliveryCost: settings.defaultDeliveryCost,
    packagingCost: settings.defaultPackagingCost,
    landedCost: inbound.landedCost,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSaving(true);
      await onSaveBid({
        name: name.trim(),
        hammerPrice: Number(hammerPrice) || 0,
        buyerFeePercent,
        vatMode: settings.defaultVatMode,
        vatPercent,
        inboundOtherCost,
        expectedSalePrice: expectedSalePrice !== '' ? Number(expectedSalePrice) : undefined,
        platformFeePercent: settings.defaultPlatformFeePercent,
        deliveryCost: settings.defaultDeliveryCost,
        packagingCost: settings.defaultPackagingCost,
        status: 'ACTIVE',
        notes: notes.trim() || undefined,
      });
      setName('');
      setHammerPrice(300);
      setExpectedSalePrice(600);
      setNotes('');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Track New Live Auction Bid"
      subtitle="Monitor your maximum bid & profit margin"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Real-time Math Callout */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3 text-center font-mono">
          <div>
            <div className="text-[10px] text-slate-400">Total Landed Cost</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">
              {formatZAR(inbound.landedCost)}
            </div>
            <div className="text-[9px] text-slate-500">Hammer + 12% + 15% VAT</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Projected Profit</div>
            <div
              className={`text-sm font-bold mt-0.5 ${
                outbound.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {outbound.netProfit >= 0 ? '+' : ''}
              {formatZAR(outbound.netProfit)}
            </div>
            <div className="text-[9px] text-slate-500">at R{expectedSalePrice || 0} resale</div>
          </div>
        </div>

        {/* Lot Name */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Lot Description / Item Name *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lot #42 PS5 DualSense Controller"
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none min-h-[44px]"
          />
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Max Hammer Bid (R)
            </label>
            <input
              type="number"
              step="any"
              required
              value={hammerPrice || ''}
              onChange={(e) => setHammerPrice(Number(e.target.value))}
              placeholder="300"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold font-mono text-white focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Expected Resale (R)
            </label>
            <input
              type="number"
              step="any"
              value={expectedSalePrice}
              onChange={(e) => setExpectedSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="600"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold font-mono text-white focus:outline-none min-h-[44px]"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Auction Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Aucor Lot #12, untested with box"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none min-h-[40px]"
          />
        </div>

        {/* Submit */}
        <div className="pt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-3 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5 transition min-h-[44px] cursor-pointer"
          >
            <Gavel className="w-4 h-4" />
            <span>{isSaving ? 'Tracking...' : 'Start Tracking Bid'}</span>
          </button>
        </div>
      </form>
    </BottomSheet>
  );
};

