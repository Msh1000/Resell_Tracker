import React, { useState } from 'react';
import type { AppSettings, VatMode, Item } from '../../types';
import {
  calculateInbound,
  calculateOutbound,
  calculateBreakEvenPrice,
  calculatePriceForTargetMargin,
  calculatePriceForFixedProfit,
  formatZAR,
  formatPercent,
} from '../../lib/calculator';
import { Gavel, Plus, RotateCcw } from 'lucide-react';

interface MobileCalculatorProps {
  settings: AppSettings;
  onSaveToInventory: (draft: Partial<Item>) => void;
  onSaveToLiveBids: (bidData: any) => Promise<void>;
  onNavigateToBids?: () => void;
}

export const MobileCalculator: React.FC<MobileCalculatorProps> = ({
  settings,
  onSaveToInventory,
  onSaveToLiveBids,
}) => {
  const [itemName, setItemName] = useState('Auction Lot');
  const [hammerPrice, setHammerPrice] = useState<number | ''>(500);
  const [salePrice, setSalePrice] = useState<number | ''>(900);

  const [buyerFeePercent, setBuyerFeePercent] = useState<number | ''>(settings.defaultBuyerFeePercent ?? 12);
  const [vatPercent, setVatPercent] = useState<number | ''>(settings.defaultVatPercent ?? 15);
  const [vatMode, setVatMode] = useState<VatMode>(settings.defaultVatMode ?? 'STANDARD');
  const [inboundOtherCost, setInboundOtherCost] = useState<number | ''>(0);

  const [platformFeePercent, setPlatformFeePercent] = useState<number | ''>(settings.defaultPlatformFeePercent ?? 6.6);
  const [deliveryCost, setDeliveryCost] = useState<number | ''>(settings.defaultDeliveryCost ?? 30);
  const [packagingCost, setPackagingCost] = useState<number | ''>(settings.defaultPackagingCost ?? 0);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Safe numerical values
  const safeHammer = hammerPrice === '' ? 0 : Number(hammerPrice);
  const safeSale = salePrice === '' ? 0 : Number(salePrice);
  const safeBuyerFee = buyerFeePercent === '' ? 0 : Number(buyerFeePercent);
  const safeVatPercent = vatPercent === '' ? 0 : Number(vatPercent);
  const safeInboundCost = inboundOtherCost === '' ? 0 : Number(inboundOtherCost);
  const safePlatformFee = platformFeePercent === '' ? 0 : Number(platformFeePercent);
  const safeDelivery = deliveryCost === '' ? 0 : Number(deliveryCost);
  const safePackaging = packagingCost === '' ? 0 : Number(packagingCost);

  // Inbound & Outbound calculations
  const inbound = calculateInbound({
    hammerPrice: safeHammer,
    buyerFeePercent: safeBuyerFee,
    vatMode: safeVatPercent === 0 ? 'EXEMPT' : vatMode,
    vatPercent: safeVatPercent,
    inboundOtherCost: safeInboundCost,
  });

  const outbound = calculateOutbound({
    salePrice: safeSale,
    platformFeePercent: safePlatformFee,
    deliveryCost: safeDelivery,
    packagingCost: safePackaging,
    landedCost: inbound.landedCost,
  });

  // Target solvers
  const breakEven = calculateBreakEvenPrice(inbound.landedCost, safePlatformFee, safeDelivery, safePackaging);
  const target25Margin = calculatePriceForTargetMargin(inbound.landedCost, 25, safePlatformFee, safeDelivery, safePackaging);
  const target150Profit = calculatePriceForFixedProfit(inbound.landedCost, 150, safePlatformFee, safeDelivery, safePackaging);

  const handleReset = () => {
    setItemName('Auction Lot');
    setHammerPrice(500);
    setSalePrice(900);
    setBuyerFeePercent(settings.defaultBuyerFeePercent ?? 12);
    setVatPercent(settings.defaultVatPercent ?? 15);
    setVatMode(settings.defaultVatMode ?? 'STANDARD');
    setInboundOtherCost(0);
    setPlatformFeePercent(settings.defaultPlatformFeePercent ?? 6.6);
    setDeliveryCost(settings.defaultDeliveryCost ?? 30);
    setPackagingCost(settings.defaultPackagingCost ?? 0);
  };

  const handleCreateBid = async () => {
    await onSaveToLiveBids({
      name: itemName || `Auction Lot (R${safeHammer})`,
      hammerPrice: safeHammer,
      buyerFeePercent: safeBuyerFee,
      vatMode: safeVatPercent === 0 ? 'EXEMPT' : vatMode,
      vatPercent: safeVatPercent,
      inboundOtherCost: safeInboundCost,
      expectedSalePrice: safeSale,
      platformFeePercent: safePlatformFee,
      deliveryCost: safeDelivery,
      packagingCost: safePackaging,
      status: 'ACTIVE',
    });
    showToast('Saved to Live Bids tracker!');
  };

  const handleCreateItem = () => {
    onSaveToInventory({
      name: itemName || `Item (R${safeHammer})`,
      hammerPrice: safeHammer,
      buyerFeePercent: safeBuyerFee,
      vatMode: safeVatPercent === 0 ? 'EXEMPT' : vatMode,
      vatPercent: safeVatPercent,
      inboundOtherCost: safeInboundCost,
      targetSalePrice: safeSale,
      platformFeePercent: safePlatformFee,
      deliveryCost: safeDelivery,
      packagingCost: safePackaging,
      status: 'IN_STOCK',
    });
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold shadow-lg animate-in slide-in-from-top">
          {toastMsg}
        </div>
      )}

      {/* 1. INPUTS SECTION AT TOP */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
          <span>Auction & Sale Inputs</span>
          <button
            onClick={handleReset}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-300 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>

        {/* Lot Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Lot Description / Item Name
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
              value={hammerPrice}
              onChange={(e) => setHammerPrice(e.target.value === '' ? '' : Number(e.target.value))}
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
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-base font-bold font-mono text-white focus:outline-none min-h-[48px]"
            />
          </div>
        </div>

        {/* Inbound Fee Configurations */}
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              Buyer Fee %
            </label>
            <input
              type="number"
              step="any"
              value={buyerFeePercent}
              onChange={(e) => setBuyerFeePercent(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="12"
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              VAT %
            </label>
            <input
              type="number"
              step="any"
              value={vatPercent}
              onChange={(e) => setVatPercent(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="15"
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              Extra Cost (R)
            </label>
            <input
              type="number"
              step="any"
              value={inboundOtherCost}
              onChange={(e) => setInboundOtherCost(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Outbound Deductions */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              Platform %
            </label>
            <input
              type="number"
              step="any"
              value={platformFeePercent}
              onChange={(e) => setPlatformFeePercent(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="6.6"
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              Delivery (R)
            </label>
            <input
              type="number"
              step="any"
              value={deliveryCost}
              onChange={(e) => setDeliveryCost(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="30"
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              Packaging (R)
            </label>
            <input
              type="number"
              step="any"
              value={packagingCost}
              onChange={(e) => setPackagingCost(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. PROJECTED PROFIT & RESULTS BELOW INPUTS */}
      <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-925 border border-slate-800 shadow-xl space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Projected Profit & Margin
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
            <div className="text-[9px] text-slate-500">
              Fee: R{inbound.buyerFee} | VAT: R{inbound.vat}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Bob Shop Fee</div>
            <div className="text-xs font-bold text-slate-300 mt-0.5">
              -{formatZAR(outbound.platformFee)}
            </div>
            <div className="text-[9px] text-slate-500">{safePlatformFee}% cut</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Net Payout</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">
              {formatZAR(outbound.netPayout)}
            </div>
            <div className="text-[9px] text-slate-500">into bank</div>
          </div>
        </div>
      </div>

      {/* 3. RECOMMENDED SELLING PRICES BELOW */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Recommended Selling Prices (Tap to Apply)
        </span>

        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div
            onClick={() => setSalePrice(breakEven)}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer active:scale-95 transition"
          >
            <div className="text-[9px] text-slate-400">Break-Even</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">{formatZAR(breakEven)}</div>
            <div className="text-[8px] text-slate-500">R0 net profit</div>
          </div>

          <div
            onClick={() => setSalePrice(target25Margin)}
            className="p-2 rounded-xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-500/50 cursor-pointer active:scale-95 transition"
          >
            <div className="text-[9px] text-emerald-400">25% Margin</div>
            <div className="text-xs font-bold text-emerald-300 mt-0.5">{formatZAR(target25Margin)}</div>
            <div className="text-[8px] text-slate-500">Target price</div>
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

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCreateBid}
          className="py-3 px-3 rounded-xl bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition min-h-[44px]"
        >
          <Gavel className="w-4 h-4" />
          <span>Track as Live Bid</span>
        </button>

        <button
          type="button"
          onClick={handleCreateItem}
          className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/30 active:scale-95 transition min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Inventory</span>
        </button>
      </div>
    </div>
  );
};
