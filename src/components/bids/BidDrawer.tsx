import React, { useState, useEffect } from 'react';
import type { Bid, BidStatus, AppSettings } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { calculateInbound, calculateOutbound, formatZAR, formatPercent } from '../../lib/calculator';
import { Gavel, Save, Trash2, Sliders } from 'lucide-react';

interface BidDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bid: Bid | null;
  settings: AppSettings;
  onSaveBid: (bidData: Partial<Bid>) => Promise<void>;
  onDeleteBid?: (id: string) => Promise<void>;
}

export const BidDrawer: React.FC<BidDrawerProps> = ({
  isOpen,
  onClose,
  bid,
  settings,
  onSaveBid,
  onDeleteBid,
}) => {
  const [name, setName] = useState('');
  const [hammerPrice, setHammerPrice] = useState<number | ''>(300);
  const [expectedSalePrice, setExpectedSalePrice] = useState<number | ''>(600);
  const [status, setStatus] = useState<BidStatus>('ACTIVE');
  const [buyerFeePercent, setBuyerFeePercent] = useState<number | ''>(settings.defaultBuyerFeePercent ?? 12);
  const [vatPercent, setVatPercent] = useState<number | ''>(settings.defaultVatPercent ?? 15);
  const [inboundOtherCost, setInboundOtherCost] = useState<number | ''>(0);
  const [platformFeePercent, setPlatformFeePercent] = useState<number | ''>(settings.defaultPlatformFeePercent ?? 6.6);
  const [deliveryCost, setDeliveryCost] = useState<number | ''>(settings.defaultDeliveryCost ?? 30);
  const [packagingCost, setPackagingCost] = useState<number | ''>(settings.defaultPackagingCost ?? 0);
  const [notes, setNotes] = useState('');
  const [showAdvancedFees, setShowAdvancedFees] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (bid) {
      setName(bid.name || '');
      setHammerPrice(bid.hammerPrice ?? 0);
      setExpectedSalePrice(bid.expectedSalePrice ?? '');
      setStatus(bid.status || 'ACTIVE');
      setBuyerFeePercent(bid.buyerFeePercent ?? settings.defaultBuyerFeePercent ?? 12);
      setVatPercent(bid.vatPercent ?? settings.defaultVatPercent ?? 15);
      setInboundOtherCost(bid.inboundOtherCost ?? 0);
      setPlatformFeePercent(bid.platformFeePercent ?? settings.defaultPlatformFeePercent ?? 6.6);
      setDeliveryCost(bid.deliveryCost ?? settings.defaultDeliveryCost ?? 30);
      setPackagingCost(bid.packagingCost ?? settings.defaultPackagingCost ?? 0);
      setNotes(bid.notes || '');
    } else {
      setName('');
      setHammerPrice(300);
      setExpectedSalePrice(600);
      setStatus('ACTIVE');
      setBuyerFeePercent(settings.defaultBuyerFeePercent ?? 12);
      setVatPercent(settings.defaultVatPercent ?? 15);
      setInboundOtherCost(0);
      setPlatformFeePercent(settings.defaultPlatformFeePercent ?? 6.6);
      setDeliveryCost(settings.defaultDeliveryCost ?? 30);
      setPackagingCost(settings.defaultPackagingCost ?? 0);
      setNotes('');
    }
  }, [bid, settings, isOpen]);

  // Safe numeric values for calculation
  const safeHammer = hammerPrice === '' ? 0 : Number(hammerPrice);
  const safeSale = expectedSalePrice === '' ? 0 : Number(expectedSalePrice);
  const safeBuyerFee = buyerFeePercent === '' ? 0 : Number(buyerFeePercent);
  const safeVat = vatPercent === '' ? 0 : Number(vatPercent);
  const safeInboundCost = inboundOtherCost === '' ? 0 : Number(inboundOtherCost);
  const safePlatformFee = platformFeePercent === '' ? 0 : Number(platformFeePercent);
  const safeDelivery = deliveryCost === '' ? 0 : Number(deliveryCost);
  const safePackaging = packagingCost === '' ? 0 : Number(packagingCost);

  // Live calculations
  const inbound = calculateInbound({
    hammerPrice: safeHammer,
    buyerFeePercent: safeBuyerFee,
    vatMode: settings.defaultVatMode,
    vatPercent: safeVat,
    inboundOtherCost: safeInboundCost,
  });

  const outbound = calculateOutbound({
    salePrice: safeSale,
    platformFeePercent: safePlatformFee,
    deliveryCost: safeDelivery,
    packagingCost: safePackaging,
    landedCost: inbound.landedCost,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSaving(true);
      await onSaveBid({
        id: bid?.id,
        name: name.trim(),
        hammerPrice: safeHammer,
        buyerFeePercent: safeBuyerFee,
        vatMode: settings.defaultVatMode,
        vatPercent: safeVat,
        inboundOtherCost: safeInboundCost,
        expectedSalePrice: expectedSalePrice !== '' ? safeSale : undefined,
        platformFeePercent: safePlatformFee,
        deliveryCost: safeDelivery,
        packagingCost: safePackaging,
        status,
        notes: notes.trim() || undefined,
        itemId: bid?.itemId,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bid || !onDeleteBid) return;
    if (confirm(`Delete bid "${bid.name}"?`)) {
      await onDeleteBid(bid.id);
      onClose();
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={bid ? 'Edit Auction Bid' : 'Track New Live Auction Bid'}
      subtitle={bid ? bid.name : 'Monitor your maximum bid & profit margin'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Real-time Math Callout */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3 text-center font-mono">
          <div>
            <div className="text-[10px] text-slate-400">Total Landed Cost</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">
              {formatZAR(inbound.landedCost)}
            </div>
            <div className="text-[9px] text-slate-500">Hammer + {safeBuyerFee}% fee + {safeVat}% VAT</div>
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
            <div className="text-[9px] text-slate-500">
              {safeSale > 0 ? `at ${formatZAR(safeSale)} (${formatPercent(outbound.marginPercent)} margin)` : 'No resale price set'}
            </div>
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
            autoFocus={!bid}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lot #42 PS5 DualSense Controller"
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-500 min-h-[44px]"
          />
        </div>

        {/* Prices & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-amber-400 mb-1">
              Hammer Price (R) *
            </label>
            <input
              type="number"
              step="any"
              required
              value={hammerPrice}
              onChange={(e) => setHammerPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="300"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold font-mono text-white focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-400 mb-1">
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

        {/* Status Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Bid Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BidStatus)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none min-h-[44px]"
          >
            <option value="ACTIVE">ACTIVE (In Bidding)</option>
            <option value="WON">WON (Won Lot)</option>
            <option value="LOST">LOST (Archived)</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Auction Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Aucor Lot #12, includes power cable"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none min-h-[40px]"
          />
        </div>

        {/* Collapsible Fee Customization */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvancedFees(!showAdvancedFees)}
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1.5 py-1 transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showAdvancedFees ? 'Hide Fee Breakdown' : 'Customize Fees (Buyer Fee, VAT, Platform %)'}</span>
          </button>

          {showAdvancedFees && (
            <div className="mt-2 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3 animate-in fade-in">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Buyer Fee %</label>
                  <input
                    type="number"
                    step="any"
                    value={buyerFeePercent}
                    onChange={(e) => setBuyerFeePercent(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">VAT %</label>
                  <input
                    type="number"
                    step="any"
                    value={vatPercent}
                    onChange={(e) => setVatPercent(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Extra Cost (R)</label>
                  <input
                    type="number"
                    step="any"
                    value={inboundOtherCost}
                    onChange={(e) => setInboundOtherCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Platform %</label>
                  <input
                    type="number"
                    step="any"
                    value={platformFeePercent}
                    onChange={(e) => setPlatformFeePercent(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Delivery (R)</label>
                  <input
                    type="number"
                    step="any"
                    value={deliveryCost}
                    onChange={(e) => setDeliveryCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Packaging (R)</label>
                  <input
                    type="number"
                    step="any"
                    value={packagingCost}
                    onChange={(e) => setPackagingCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-2">
          {bid && onDeleteBid ? (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-amber-600/30 flex items-center gap-1.5 transition min-h-[44px] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : bid ? 'Save Changes' : 'Start Tracking'}</span>
            </button>
          </div>
        </div>
      </form>
    </BottomSheet>
  );
};
