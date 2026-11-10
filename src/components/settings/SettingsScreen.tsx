import React, { useState, useRef } from 'react';
import { AppSettings, VatMode, ResellBackupData } from '../../types';
import { DEFAULT_SETTINGS } from '../../lib/constants';
import {
  Sliders,
  Save,
  RotateCcw,
  Download,
  Upload,
  FileSpreadsheet,
  Database,
  Check,
  AlertCircle,
  HardDrive,
  RefreshCw,
} from 'lucide-react';

interface SettingsScreenProps {
  settings: AppSettings;
  onSaveSettings: (settings: Partial<AppSettings>) => Promise<void>;
  onImportBackup: (backup: ResellBackupData) => Promise<{ itemCount: number; bidCount: number }>;
  onExportBackup: () => Promise<ResellBackupData>;
  onExportCsv: () => Promise<string>;
  onResetToSeedData: () => Promise<void>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onSaveSettings,
  onImportBackup,
  onExportBackup,
  onExportCsv,
  onResetToSeedData,
}) => {
  const [buyerFee, setBuyerFee] = useState<number>(settings.defaultBuyerFeePercent ?? 12);
  const [vatPercent, setVatPercent] = useState<number>(settings.defaultVatPercent ?? 15);
  const [vatMode, setVatMode] = useState<VatMode>(settings.defaultVatMode ?? 'STANDARD');
  const [platformFee, setPlatformFee] = useState<number>(settings.defaultPlatformFeePercent ?? 6.6);
  const [deliveryCost, setDeliveryCost] = useState<number>(settings.defaultDeliveryCost ?? 30);
  const [packagingCost, setPackagingCost] = useState<number>(settings.defaultPackagingCost ?? 0);
  const [salesChannel, setSalesChannel] = useState(settings.defaultSalesChannel || 'Bob Shop');
  const [auctionHouse, setAuctionHouse] = useState(settings.defaultAuctionHouse || 'Aucor Auctioneers');

  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (text: string, isError = false) => {
    setStatusMessage({ text, isError });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveSettings({
        defaultBuyerFeePercent: Number(buyerFee),
        defaultVatPercent: Number(vatPercent),
        defaultVatMode: vatMode,
        defaultPlatformFeePercent: Number(platformFee),
        defaultDeliveryCost: Number(deliveryCost),
        defaultPackagingCost: Number(packagingCost),
        defaultSalesChannel: salesChannel,
        defaultAuctionHouse: auctionHouse,
      });
      notify('Default presets saved successfully!');
    } catch (err: any) {
      notify(err.message || 'Failed to save settings', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as ResellBackupData;
      const res = await onImportBackup(parsed);
      notify(`Restored successfully! Loaded ${res.itemCount} items and ${res.bidCount} bids.`);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      notify(`Import failed: ${err.message}`, true);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const data = await onExportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reselltrack_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify('Backup JSON exported!');
    } catch (err: any) {
      notify('Failed to export backup', true);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      const csv = await onExportCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reselltrack_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      notify('Spreadsheet CSV exported!');
    } catch (err: any) {
      notify('Failed to export CSV', true);
    }
  };

  const handleResetToSeed = async () => {
    if (confirm('Restore initial backup data (11 items, 7 bids)? This will replace current local edits with your seed JSON.')) {
      await onResetToSeedData();
      notify('Database reset to initial backup!');
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-lg ${
            statusMessage.isError
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {statusMessage.isError ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4 stroke-[3]" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Storage & Device Info */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/20 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5 uppercase tracking-wider">
            <HardDrive className="w-4 h-4 text-blue-400" /> Local Device IndexedDB
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Offline Ready
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          All your items, live bids, and financial records are stored securely inside your browser's local database. No external database or login is required.
        </p>
      </div>

      {/* Backup, Import & Export Actions */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Database className="w-4 h-4 text-amber-400" /> Data Backup & Restore
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="grid grid-cols-2 gap-2">
          {/* Import JSON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center gap-2.5 active:scale-95 transition text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Import JSON</div>
              <div className="text-[10px] text-slate-400">Restore file</div>
            </div>
          </button>

          {/* Export JSON */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center gap-2.5 active:scale-95 transition text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Export Backup</div>
              <div className="text-[10px] text-slate-400">Full JSON file</div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Export CSV */}
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center gap-2 active:scale-95 transition text-left"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-300">Download CSV</span>
          </button>

          {/* Reset to Seed */}
          <button
            type="button"
            onClick={handleResetToSeed}
            className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center gap-2 active:scale-95 transition text-left"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">Reset to Initial Data</span>
          </button>
        </div>
      </div>

      {/* Default Settings Form */}
      <form onSubmit={handleSave} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-blue-400" /> Default Fee Presets
        </span>

        {/* Inbound Defaults */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Buyer's Fee %
              </label>
              <input
                type="number"
                step="any"
                value={buyerFee}
                onChange={(e) => setBuyerFee(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                VAT Rate %
              </label>
              <input
                type="number"
                step="any"
                value={vatPercent}
                onChange={(e) => setVatPercent(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Default VAT Mode</label>
            <select
              value={vatMode}
              onChange={(e) => setVatMode(e.target.value as VatMode)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none min-h-[44px]"
            >
              <option value="STANDARD">15% Standard (Hammer + 12% Buyer Fee)</option>
              <option value="COMMISSION_ONLY">15% on Commission Only (Private Goods)</option>
              <option value="EXEMPT">0% Exempt</option>
            </select>
          </div>
        </div>

        {/* Outbound Defaults */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Platform %
              </label>
              <input
                type="number"
                step="any"
                value={platformFee}
                onChange={(e) => setPlatformFee(Number(e.target.value))}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Default Channel
              </label>
              <input
                type="text"
                value={salesChannel}
                onChange={(e) => setSalesChannel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Default Auction House
              </label>
              <input
                type="text"
                value={auctionHouse}
                onChange={(e) => setAuctionHouse(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/30 flex items-center justify-center gap-1.5 transition min-h-[44px] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Default Presets'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
