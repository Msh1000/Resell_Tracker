import React, { useState, useEffect } from 'react';
import { Item, ItemStatus, VatMode, AppSettings } from '../../types';
import { BottomSheet } from '../common/BottomSheet';
import { calculateInbound, calculateOutbound, formatZAR, formatPercent } from '../../lib/calculator';
import { COMMON_CATEGORIES, SALES_CHANNELS, AUCTION_HOUSES } from '../../lib/constants';
import { Save, Trash2, ArrowRight } from 'lucide-react';

interface ItemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  settings: AppSettings;
  onSave: (itemData: Partial<Item>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const ItemDrawer: React.FC<ItemDrawerProps> = ({
  isOpen,
  onClose,
  item,
  settings,
  onSave,
  onDelete,
}) => {
  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [status, setStatus] = useState<ItemStatus>('IN_STOCK');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [hammerPrice, setHammerPrice] = useState<number>(0);
  const [buyerFeePercent, setBuyerFeePercent] = useState<number>(12);
  const [vatMode, setVatMode] = useState<VatMode>('STANDARD');
  const [vatPercent, setVatPercent] = useState<number>(15);
  const [inboundOtherCost, setInboundOtherCost] = useState<number>(0);

  const [targetSalePrice, setTargetSalePrice] = useState<number | ''>('');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [saleDate, setSaleDate] = useState('');
  const [salesChannel, setSalesChannel] = useState('Bob Shop');
  const [platformFeePercent, setPlatformFeePercent] = useState<number>(6.6);
  const [deliveryCost, setDeliveryCost] = useState<number>(30);
  const [packagingCost, setPackagingCost] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCategory(item.category || 'Electronics');
      setStatus(item.status || 'IN_STOCK');
      setPurchaseDate(item.purchaseDate || new Date().toISOString().split('T')[0]);
      setHammerPrice(item.hammerPrice || 0);
      setBuyerFeePercent(item.buyerFeePercent ?? settings.defaultBuyerFeePercent);
      setVatMode(item.vatMode ?? settings.defaultVatMode);
      setVatPercent(item.vatPercent ?? settings.defaultVatPercent);
      setInboundOtherCost(item.inboundOtherCost || 0);

      setTargetSalePrice(item.targetSalePrice ?? '');
      setSalePrice(item.salePrice ?? '');
      setSaleDate(item.saleDate || '');
      setSalesChannel(item.salesChannel || settings.defaultSalesChannel || 'Bob Shop');
      setPlatformFeePercent(item.platformFeePercent ?? settings.defaultPlatformFeePercent);
      setDeliveryCost(item.deliveryCost ?? settings.defaultDeliveryCost);
      setPackagingCost(item.packagingCost ?? settings.defaultPackagingCost);
      setNotes(item.notes || '');
    } else {
      // New item defaults
      setName('');
      setCategory('Electronics');
      setStatus('IN_STOCK');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setHammerPrice(0);
      setBuyerFeePercent(settings.defaultBuyerFeePercent ?? 12);
      setVatMode(settings.defaultVatMode ?? 'STANDARD');
      setVatPercent(settings.defaultVatPercent ?? 15);
      setInboundOtherCost(0);

      setTargetSalePrice('');
      setSalePrice('');
      setSaleDate('');
      setSalesChannel(settings.defaultSalesChannel || 'Bob Shop');
      setPlatformFeePercent(settings.defaultPlatformFeePercent ?? 6.6);
      setDeliveryCost(settings.defaultDeliveryCost ?? 30);
      setPackagingCost(settings.defaultPackagingCost ?? 0);
      setNotes('');
    }
  }, [item, settings, isOpen]);

  // Real-time calculations
  const inbound = calculateInbound({
    hammerPrice: Number(hammerPrice) || 0,
    buyerFeePercent: Number(buyerFeePercent) || 0,
    vatMode,
    vatPercent: Number(vatPercent) || 0,
    inboundOtherCost: Number(inboundOtherCost) || 0,
  });

  const effectiveSalePrice = salePrice !== '' ? Number(salePrice) : targetSalePrice !== '' ? Number(targetSalePrice) : 0;

  const outbound = calculateOutbound({
    salePrice: effectiveSalePrice,
    platformFeePercent: Number(platformFeePercent) || 0,
    deliveryCost: Number(deliveryCost) || 0,
    packagingCost: Number(packagingCost) || 0,
    landedCost: inbound.landedCost,
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSaving(true);
      await onSave({
        id: item?.id,
        name: name.trim(),
        category,
        status,
        purchaseDate,
        hammerPrice: Number(hammerPrice) || 0,
        buyerFeePercent: Number(buyerFeePercent) || 0,
        vatMode,
        vatPercent: Number(vatPercent) || 0,
        inboundOtherCost: Number(inboundOtherCost) || 0,
        targetSalePrice: targetSalePrice !== '' ? Number(targetSalePrice) : undefined,
        salePrice: salePrice !== '' ? Number(salePrice) : undefined,
        saleDate: saleDate || undefined,
        salesChannel,
        platformFeePercent: Number(platformFeePercent) || 0,
        deliveryCost: Number(deliveryCost) || 0,
        packagingCost: Number(packagingCost) || 0,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !onDelete) return;
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      await onDelete(item.id);
      onClose();
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit Inventory Item' : 'Add Item to Inventory'}
      subtitle={item ? item.name : 'Calculate landed cost and profit'}
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {/* Real-time Financial Ledger Preview */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-3 gap-2 text-center font-mono">
          <div>
            <div className="text-[10px] text-slate-400">Landed Cost</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">
              {formatZAR(inbound.landedCost)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Net Payout</div>
            <div className="text-xs font-bold text-slate-300 mt-0.5">
              {formatZAR(outbound.netPayout)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Net Profit</div>
            <div
              className={`text-xs font-bold mt-0.5 ${
                outbound.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {outbound.netProfit >= 0 ? '+' : ''}
              {formatZAR(outbound.netProfit)}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DualSense PS5 Controller"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-blue-500 min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none min-h-[44px]"
              >
                <option value="IN_STOCK">IN STOCK</option>
                <option value="LISTED">LISTED</option>
                <option value="SOLD">SOLD</option>
                <option value="RETURNED">RETURNED</option>
                <option value="SCRAPPED">SCRAPPED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none min-h-[44px]"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inbound / Auction Purchase Details */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Auction & Purchase Cost
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Fee: R{inbound.buyerFee} | VAT: R{inbound.vat}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hammer Price (R)
              </label>
              <input
                type="number"
                step="any"
                value={hammerPrice || ''}
                onChange={(e) => setHammerPrice(Number(e.target.value))}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold font-mono text-white focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Buyer Fee %
              </label>
              <input
                type="number"
                step="any"
                value={buyerFeePercent}
                onChange={(e) => setBuyerFeePercent(Number(e.target.value))}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">VAT Mode</label>
              <select
                value={vatMode}
                onChange={(e) => setVatMode(e.target.value as VatMode)}
                className="w-full px-2 py-2 bg-slate-950 border border-slate-700 rounded-xl text-[11px] text-white focus:outline-none min-h-[40px]"
              >
                <option value="STANDARD">15% Standard</option>
                <option value="COMMISSION_ONLY">15% Comm Only</option>
                <option value="EXEMPT">0% Exempt</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Extra Cost (R)
              </label>
              <input
                type="number"
                step="any"
                value={inboundOtherCost || ''}
                onChange={(e) => setInboundOtherCost(Number(e.target.value))}
                placeholder="0"
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none min-h-[40px]"
              />
            </div>
          </div>
        </div>

        {/* Outbound / Sale Details */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
              Sale & Platform Details
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Margin: {formatPercent(outbound.marginPercent)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Price (R)
              </label>
              <input
                type="number"
                step="any"
                value={targetSalePrice}
                onChange={(e) => setTargetSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 900"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Actual Sold Price (R)
              </label>
              <input
                type="number"
                step="any"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Leave blank if unsold"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-bold font-mono text-white focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Platform %
              </label>
              <input
                type="number"
                step="any"
                value={platformFeePercent}
                onChange={(e) => setPlatformFeePercent(Number(e.target.value))}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Delivery (R)
              </label>
              <input
                type="number"
                step="any"
                value={deliveryCost}
                onChange={(e) => setDeliveryCost(Number(e.target.value))}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none min-h-[40px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Packaging (R)
              </label>
              <input
                type="number"
                step="any"
                value={packagingCost}
                onChange={(e) => setPackagingCost(Number(e.target.value))}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none min-h-[40px]"
              />
            </div>
          </div>

          {status === 'SOLD' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sale Date</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none min-h-[44px]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lot #142, includes box and cable"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none min-h-[40px]"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-between gap-2">
          {item && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}

          <div className="flex-1 flex gap-2 justify-end">
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
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/30 flex items-center gap-1.5 transition min-h-[44px] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Item'}</span>
            </button>
          </div>
        </div>
      </form>
    </BottomSheet>
  );
};

