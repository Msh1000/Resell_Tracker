import React, { useState, useEffect, useCallback } from 'react';
import type { Item, Bid, AppSettings, BidStatus, ResellBackupData } from './types';
import { DEFAULT_SETTINGS } from './lib/constants';
import {
  getItems,
  saveItem,
  deleteItem,
  getBids,
  saveBid,
  updateBidStatus,
  updateBidHammerPrice,
  deleteBid,
  getSettings,
  saveSettings,
  importBackup,
  exportBackup,
  exportCsv,
  resetToSeedData,
} from './lib/db';

import { TopHeader } from './components/common/TopHeader';
import { BottomNav, TabType } from './components/common/BottomNav';
import { MobileDashboard } from './components/dashboard/MobileDashboard';
import { InventoryList } from './components/inventory/InventoryList';
import { ItemDrawer } from './components/inventory/ItemDrawer';
import { QuickSoldDrawer } from './components/inventory/QuickSoldDrawer';
import { LiveBidsScreen } from './components/bids/LiveBidsScreen';
import { MobileCalculator } from './components/calculator/MobileCalculator';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');
  const [items, setItems] = useState<Item[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Drawers
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [isQuickSoldOpen, setIsQuickSoldOpen] = useState(false);
  const [quickSoldTargetItem, setQuickSoldTargetItem] = useState<Item | null>(null);

  const [isNewBidDrawerOpen, setIsNewBidDrawerOpen] = useState(false);

  // Load data from IndexedDB
  const refreshAll = useCallback(async () => {
    try {
      const [loadedItems, loadedBids, loadedSettings] = await Promise.all([
        getItems(),
        getBids(),
        getSettings(),
      ]);
      setItems(loadedItems);
      setBids(loadedBids);
      setSettings(loadedSettings);
    } catch (err) {
      console.error('Failed to load local data from IndexedDB:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Total Realized Profit for header
  const totalProfit = items
    .filter((i) => i.status === 'SOLD')
    .reduce((acc, curr) => acc + (curr.calculatedNetProfit || 0), 0);

  const activeBidsCount = bids.filter((b) => b.status === 'ACTIVE').length;

  // Inventory handlers
  const handleSaveItem = async (itemData: Partial<Item>) => {
    await saveItem(itemData);
    await refreshAll();
  };

  const handleDeleteItem = async (id: string) => {
    await deleteItem(id);
    await refreshAll();
  };

  const handleOpenNewItem = () => {
    setEditingItem(null);
    setIsItemDrawerOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setIsItemDrawerOpen(true);
  };

  const handleQuickMarkSold = (item: Item) => {
    setQuickSoldTargetItem(item);
    setIsQuickSoldOpen(true);
  };

  const handleConfirmSold = async (
    itemId: string,
    salePrice: number,
    saleDate: string,
    salesChannel: string
  ) => {
    await saveItem({
      id: itemId,
      status: 'SOLD',
      salePrice,
      saleDate,
      salesChannel,
    });
    await refreshAll();
  };

  // Live Bids handlers
  const handleSaveBid = async (bidData: Partial<Bid>) => {
    await saveBid(bidData);
    await refreshAll();
  };

  const handleUpdateBidStatus = async (id: string, status: BidStatus) => {
    await updateBidStatus(id, status);
    await refreshAll();
  };

  const handleAdjustHammerPrice = async (id: string, newPrice: number) => {
    await updateBidHammerPrice(id, newPrice);
    await refreshAll();
  };

  const handleDeleteBid = async (id: string) => {
    await deleteBid(id);
    await refreshAll();
  };

  // Quick calculator to inventory
  const handleSaveDraftToInventory = (draft: Partial<Item>) => {
    setEditingItem(draft as Item);
    setIsItemDrawerOpen(true);
  };

  // Settings handlers
  const handleSaveSettings = async (updates: Partial<AppSettings>) => {
    const updated = await saveSettings(updates);
    setSettings(updated);
  };

  const handleImportBackup = async (backup: ResellBackupData) => {
    const result = await importBackup(backup);
    await refreshAll();
    return result;
  };

  const handleResetToSeedData = async () => {
    await resetToSeedData();
    await refreshAll();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Mobile Top Header (clean, with Settings gear, no duplicate Add button) */}
      <TopHeader
        totalProfit={totalProfit}
        onOpenSettings={() => setActiveTab('SETTINGS')}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-3.5 pt-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs font-mono">Loading local database...</span>
          </div>
        ) : (
          <>
            {activeTab === 'DASHBOARD' && (
              <MobileDashboard
                items={items}
                bids={bids}
                settings={settings}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onFilterInventory={(status) => setStatusFilter(status)}
                onOpenNewItem={handleOpenNewItem}
                onOpenNewBid={() => setIsNewBidDrawerOpen(true)}
              />
            )}

            {activeTab === 'INVENTORY' && (
              <InventoryList
                items={items}
                settings={settings}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onOpenNewItem={handleOpenNewItem}
                onEditItem={handleEditItem}
                onQuickMarkSold={handleQuickMarkSold}
              />
            )}

            {activeTab === 'LIVE_BIDS' && (
              <LiveBidsScreen
                bids={bids}
                settings={settings}
                onUpdateBidStatus={handleUpdateBidStatus}
                onAdjustHammerPrice={handleAdjustHammerPrice}
                onDeleteBid={handleDeleteBid}
                onSaveNewBid={handleSaveBid}
                onNavigateToStock={() => {
                  setStatusFilter('IN_STOCK');
                  setActiveTab('INVENTORY');
                }}
                isNewBidDrawerOpen={isNewBidDrawerOpen}
                setIsNewBidDrawerOpen={setIsNewBidDrawerOpen}
              />
            )}

            {activeTab === 'CALCULATOR' && (
              <MobileCalculator
                settings={settings}
                onSaveToInventory={handleSaveDraftToInventory}
                onSaveToLiveBids={handleSaveBid}
                onNavigateToBids={() => setActiveTab('LIVE_BIDS')}
              />
            )}

            {activeTab === 'SETTINGS' && (
              <SettingsScreen
                settings={settings}
                onSaveSettings={handleSaveSettings}
                onImportBackup={handleImportBackup}
                onExportBackup={exportBackup}
                onExportCsv={exportCsv}
                onResetToSeedData={handleResetToSeedData}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar: Dash | Stock | (+) | Bids | Calc */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        inventoryCount={items.length}
        activeBidsCount={activeBidsCount}
        onOpenNewItem={handleOpenNewItem}
      />

      {/* Slide-up Bottom Sheets */}
      <ItemDrawer
        isOpen={isItemDrawerOpen}
        onClose={() => {
          setIsItemDrawerOpen(false);
          setEditingItem(null);
        }}
        item={editingItem}
        settings={settings}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />

      <QuickSoldDrawer
        isOpen={isQuickSoldOpen}
        onClose={() => {
          setIsQuickSoldOpen(false);
          setQuickSoldTargetItem(null);
        }}
        item={quickSoldTargetItem}
        settings={settings}
        onConfirmSold={handleConfirmSold}
      />
    </div>
  );
}
