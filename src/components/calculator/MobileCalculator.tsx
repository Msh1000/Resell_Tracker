import React, { useState } from 'react';
import { AppSettings, VatMode, Item } from '../../types';
import {
  calculateInbound,
  calculateOutbound,
  calculateBreakEvenPrice,
  calculatePriceForTargetMargin,
  calculatePriceForFixedProfit,
  formatZAR,
  formatPercent,
} from '../../lib/calculator';
import { Zap, Gavel, Plus, RotateCcw, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';

interface MobileCalculatorProps {
  settings: AppSettings;
  onSaveToInventory: (draft: Partial<Item>) => void;
  onSaveToLiveBids: (bidData: any) => Promise<void>;
  onNavigateToBids: () => void;
}

export const MobileCalculator: React.FC<MobileCalculatorProps> = ({
  settings,
  onSaveToInventory,
  onSaveToLiveBids,
  onNavigateToBids,
}) => {
  const [hammerPrice, setHammerPrice] = useState<number>(500);
  const [buyerFeePercent, setBuyerFeePercent] = useState<number>(settings.defaultBuyerFeePercent ?? 12);
  const [vatMode, setVatMode] = useState<VatMode>(settings.defaultVatMode ?? 'STANDARD');
  const [vatPercent, setVatPercent] = useState<number>(settings.defaultVatPercent ?? 15);
  const [inboundOtherCost, setInboundOtherCost] = useState<number>(0);

  const [salePrice, setSalePrice] = useState<number>(900);
  const [platformFeePercent, setPlatformFeePercent] = useState<number>(settings.defaultPlatformFeePercent ?? 6.6);
  const [deliveryCost, setDeliveryCost] = useState<number>(settings.defaultDeliveryCost ?? 30);
  const [packagingCost, setPackagingCost] = useState<number>(settings.defaultPackagingCost ?? 0);

  const [itemName, setItemName] = useState('Auction Lot');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Calculations
  const inbound = calculateInbound({
    hammerPrice: Number(hammerPrice) || 0,
    buyerFeePercent: Number(buyerFeePercent) || 0,
    vatMode,
    vatPercent: Number(vatPercent) || 0,
    inboundOtherCost: Number(inboundOtherCost) || 0,
  });

  const outbound = calculateOutbound({
    salePrice: Number(salePrice) || 0,
    platformFeePercent: Number(platformFeePercent) || 0,
    deliveryCost: Number(deliveryCost) || 0,
    packagingCost: Number(packagingCost) || 0,
    landedCost: inbound.landedCost,
  });

  // Solvers
  const breakEven = calculateBreakEvenPrice(inbound.landedCost, platformFeePercent, deliveryCost, packagingCost);
  const target25Margin = calculatePriceForTargetMargin(inbound.landedCost, 25, platformFeePercent, deliveryCost, packagingCost);
  const target150Profit = calculatePriceForFixedProfit(inbound.landedCost, 150, platformFeePercent, deliveryCost, packagingCost);

  const handleReset = () => {
    setHammerPrice(500);
    setSalePrice(900);
    setBuyerFeePercent(settings.defaultBuyerFeePercent);
    setVatMode(settings.defaultVatMode);
    setVatPercent(settings.defaultVatPercent);
    setInboundOtherCost(0);
    setPlatformFeePercent(settings.defaultPlatformFeePercent);
    setDeliveryCost(settings.defaultDeliveryCost);
    setPackagingCost(settings.defaultPackagingCost);
  };

  const handleCreateBid = async () => {
    await onSaveToLiveBids({
      name: itemName || `Auction Lot (R${hammerPrice})`,
      hammerPrice,
      buyerFeePercent,
      vatMode,
      vatPercent,
      inboundOtherCost,
      expectedSalePrice: salePrice,
      platformFeePercent,
      deliveryCost,
      packagingCost,
      status: 'ACTIVE',
    });
    showToast('Saved to Live Bids tracker!');
  };

  const handleCreateItem = () => {
    onSaveToInventory({
      name: itemName || `Item (R${hammerPrice})`,
      hammerPrice,
      buyerFeePercent,
      vatMode,
      vatPercent,
      inboundOtherCost,
      targetSalePrice: salePrice,
      platformFeePercent,
      deliveryCost,
      packagingCost,
      status: 'IN_STOCK',
    });
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold shadow-lg animate-in slide-in-from-top">
          {toastMsg}
        </div>
      )}

      {/* Main Results Hero Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-925 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
          <span>Projected Profit & Margin</span>
          <button
            onClick={handleReset}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-300 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 items-baseline">
          <div>
            <div className="text-[10px] text-slate-400 font-mono">Net Profit</div>
            <div
              className={`text-3xl font-black font-mono tracking-tight ${
                outbound.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {outbound.netProfit >= 0 ? '+' : ''}
              {formatZAR(outbound.netProfit)}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-mono">Net Margin / ROI</div>
            <div
              className={`text-lg font-black font-mono ${
                outbound.marginPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatPercent(outbound.marginPercent)}
              <span className="text-xs text-slate-500 font-normal ml-1">
                ({formatPercent(outbound.roiPercent)} ROI)
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Math Ledger */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center font-mono">
          <div>
            <div className="text-[10px] text-slate-400">Total Landed</div>
            <div className="text-xs font-bold text-amber-400 mt-0.5">
              {formatZAR(inbound.landedCost)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Bob Shop Fee</div>
            <div className="text-xs font-bold text-slate-300 mt-0.5">
              -{formatZAR(outbound.platformFee)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Net Payout</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">
              {formatZAR(outbound.netPayout)}
            </div>
          </div>
        </div>
      </div>

      {/* Target Price Solvers Card */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Target Selling Price Recommendations
        </span>

        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div
            onClick={() => setSalePrice(breakEven)}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer active:scale-95 transition"
          >
            <div className="text-[9px] text-slate-400">Break-Even</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">{formatZAR(breakEven)}</div>
            <div className="text-[8px] text-slate-500">R0 profit</div>
          </div>

          <div
            onClick={() => setSalePrice(target25Margin)}
            className="p-2 rounded-xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-500/50 cursor-pointer active:scale-95 transition"
          >
            <div className="text-[9px] text-emerald-400">25% Margin</div>
            <div className="text-xs font-bold text-emerald-300 mt-0.5">{formatZAR(target25Margin)}</div>
            <div className="text-[8px] text-slate-500">Target</div>
          </div>

          <div
            onClick={() => setSalePrice(target150Profit)}
            className="p-2 rounded-xl bg-slate-950 border border-blue-500/30 hover:border-blue-500/50 cursor-pointer active:scale-95 transition"
          >
            <div className="text-[9px] text-blue-400">+R150 Profit</div>
            <div className="text-xs font-bold text-blue-300 mt-0.5">{formatZAR(target150Profit)}</div>
            <div className="text-[8px] text-slate-500">Fixed Rand</div>
          </div>
        </div>
      </div>

      {/* Inputs: Inbound Auction & Outbound Sale */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        {/* Lot Label */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Lot Description / Name
          </label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g. Red Dragon Controller"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none min-h-[40px]"
          />
        </div>

        {/* Primary Prices */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-amber-400 mb-1">
              Hammer Bid (R)
            </label>
            <input
              type="number"
              step="any"
              value={hammerPrice || ''}
              onChange={(e) => setHammerPrice(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-base font-bold font-mono text-white focus:outline-none min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-400 mb-1">
              Sale Price (R)
            </label>
            <input
              type="number"
              step="any"
              value={salePrice || ''}
              onChange={(e) => setSalePrice(Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-base font-bold font-mono text-white focus:outline-none min-h-[48px]"
            />
          </div>
        </div>

        {/* Fee Configurations */}
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">Buyer Fee %</label>
            <input
              type="number"
              step="any"
              value={buyerFeePercent}
              onChange={(e) => setBuyerFeePercent(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">VAT Mode</label>
            <select
              value={vatMode}
              onChange={(e) => setVatMode(e.target.value as VatMode)}
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-[10px] text-white focus:outline-none"
            >
              <option value="STANDARD">15% Standard</option>
              <option value="COMMISSION_ONLY">15% Comm Only</option>
              <option value="EXEMPT">0% Exempt</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">Inbound Cost</label>
            <input
              type="number"
              step="any"
              value={inboundOtherCost || ''}
              onChange={(e) => setInboundOtherCost(Number(e.target.value))}
              placeholder="0"
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
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
              onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">Delivery (R)</label>
            <input
              type="number"
              step="any"
              value={deliveryCost}
              onChange={(e) => setDeliveryCost(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">Packaging (R)</label>
            <input
              type="number"
              step="any"
              value={packagingCost}
              onChange={(e) => setPackagingCost(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCreateBid}
            className="py-3 px-3 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Gavel className="w-4 h-4" />
            <span>Track as Live Bid</span>
          </button>

          <button
            type="button"
            onClick={handleCreateItem}
            className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/30 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Inventory</span>
          </button>
        </div>
      </div>
    </div>
  );
};
