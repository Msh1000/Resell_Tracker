import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Item, Bid, AppSettings, ResellBackupData, BidStatus } from '../types';
import { DEFAULT_SETTINGS } from './constants';
import { calculateInbound, calculateOutbound } from './calculator';
import { INITIAL_USER_BACKUP } from './seedData';

interface ResellTrackDB extends DBSchema {
  items: {
    key: string;
    value: Item;
    indexes: {
      'by-status': string;
      'by-purchaseDate': string;
      'by-category': string;
    };
  };
  bids: {
    key: string;
    value: Bid;
    indexes: {
      'by-status': string;
      'by-createdAt': string;
    };
  };
  settings: {
    key: string;
    value: { key: string; value: AppSettings };
  };
}

const DB_NAME = 'reselltrack_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ResellTrackDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<ResellTrackDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ResellTrackDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Items store
        if (!db.objectStoreNames.contains('items')) {
          const itemStore = db.createObjectStore('items', { keyPath: 'id' });
          itemStore.createIndex('by-status', 'status');
          itemStore.createIndex('by-purchaseDate', 'purchaseDate');
          itemStore.createIndex('by-category', 'category');
        }

        // Bids store
        if (!db.objectStoreNames.contains('bids')) {
          const bidStore = db.createObjectStore('bids', { keyPath: 'id' });
          bidStore.createIndex('by-status', 'status');
          bidStore.createIndex('by-createdAt', 'createdAt');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });

    // Check if initial seeding is needed
    const db = await dbPromise;
    const itemCount = await db.count('items');
    const bidCount = await db.count('bids');
    if (itemCount === 0 && bidCount === 0) {
      console.log('Seeding initial ResellTrack data...');
      await seedInitialData(db);
    }
  }
  return dbPromise;
}

async function seedInitialData(db: IDBPDatabase<ResellTrackDB>) {
  const tx = db.transaction(['items', 'bids', 'settings'], 'readwrite');
  
  // Settings
  await tx.objectStore('settings').put({
    key: 'app_settings',
    value: INITIAL_USER_BACKUP.settings || DEFAULT_SETTINGS,
  });

  // Items
  for (const item of INITIAL_USER_BACKUP.items) {
    await tx.objectStore('items').put(item);
  }

  // Bids
  for (const bid of INITIAL_USER_BACKUP.bids) {
    await tx.objectStore('bids').put(bid);
  }

  await tx.done;
}

// ----------------- SETTINGS -----------------

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const row = await db.get('settings', 'app_settings');
  if (!row) {
    await db.put('settings', { key: 'app_settings', value: DEFAULT_SETTINGS });
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...row.value };
}

export async function saveSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const db = await getDB();
  const current = await getSettings();
  const updated: AppSettings = { ...current, ...updates };
  await db.put('settings', { key: 'app_settings', value: updated });
  return updated;
}

// ----------------- ITEMS -----------------

export async function getItems(): Promise<Item[]> {
  const db = await getDB();
  const items = await db.getAll('items');
  // Sort descending by purchase date or created date
  return items.sort((a, b) => new Date(b.createdAt || b.purchaseDate).getTime() - new Date(a.createdAt || a.purchaseDate).getTime());
}

export async function getItem(id: string): Promise<Item | undefined> {
  const db = await getDB();
  return db.get('items', id);
}

export async function saveItem(data: Partial<Item>): Promise<Item> {
  const db = await getDB();
  const settings = await getSettings();
  const now = new Date().toISOString();

  let existing: Item | undefined;
  if (data.id) {
    existing = await db.get('items', data.id);
  }

  const hammerPrice = Math.max(0, data.hammerPrice ?? existing?.hammerPrice ?? 0);
  const buyerFeePercent = data.buyerFeePercent ?? existing?.buyerFeePercent ?? settings.defaultBuyerFeePercent;
  const vatMode = data.vatMode ?? existing?.vatMode ?? settings.defaultVatMode;
  const vatPercent = data.vatPercent ?? existing?.vatPercent ?? settings.defaultVatPercent;
  const inboundOtherCost = Math.max(0, data.inboundOtherCost ?? existing?.inboundOtherCost ?? 0);

  const inbound = calculateInbound({
    hammerPrice,
    buyerFeePercent,
    vatMode,
    vatPercent,
    inboundOtherCost,
  });

  const salePrice = data.salePrice ?? existing?.salePrice;
  const platformFeePercent = data.platformFeePercent ?? existing?.platformFeePercent ?? settings.defaultPlatformFeePercent;
  const deliveryCost = data.deliveryCost ?? existing?.deliveryCost ?? settings.defaultDeliveryCost;
  const packagingCost = data.packagingCost ?? existing?.packagingCost ?? settings.defaultPackagingCost;

  const outbound = calculateOutbound({
    salePrice: salePrice ?? 0,
    platformFeePercent,
    deliveryCost,
    packagingCost,
    landedCost: inbound.landedCost,
  });

  const itemToSave: Item = {
    id: data.id || existing?.id || crypto.randomUUID(),
    name: (data.name ?? existing?.name ?? 'New Item').trim(),
    category: data.category ?? existing?.category ?? 'General',
    status: data.status ?? existing?.status ?? 'IN_STOCK',
    purchaseDate: data.purchaseDate ?? existing?.purchaseDate ?? new Date().toISOString().split('T')[0],
    hammerPrice,
    buyerFeePercent,
    vatMode,
    vatPercent,
    inboundOtherCost,
    calculatedBuyerFee: inbound.buyerFee,
    calculatedVat: inbound.vat,
    calculatedLandedCost: inbound.landedCost,
    targetSalePrice: data.targetSalePrice ?? existing?.targetSalePrice,
    salePrice,
    saleDate: data.saleDate ?? existing?.saleDate,
    salesChannel: data.salesChannel ?? existing?.salesChannel ?? settings.defaultSalesChannel,
    platformFeePercent,
    deliveryCost,
    packagingCost,
    calculatedPlatformFee: outbound.platformFee,
    calculatedNetPayout: outbound.netPayout,
    calculatedNetProfit: outbound.netProfit,
    calculatedMarginPercent: outbound.marginPercent,
    calculatedRoiPercent: outbound.roiPercent,
    notes: data.notes ?? existing?.notes,
    sku: data.sku ?? existing?.sku ?? '',
    lotNumber: data.lotNumber ?? existing?.lotNumber,
    auctionHouse: data.auctionHouse ?? existing?.auctionHouse ?? settings.defaultAuctionHouse,
    storageLocation: data.storageLocation ?? existing?.storageLocation,
    imageUrl: data.imageUrl ?? existing?.imageUrl,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await db.put('items', itemToSave);
  return itemToSave;
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('items', id);
}

// ----------------- BIDS -----------------

export async function getBids(): Promise<Bid[]> {
  const db = await getDB();
  const bids = await db.getAll('bids');
  return bids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getBid(id: string): Promise<Bid | undefined> {
  const db = await getDB();
  return db.get('bids', id);
}

export async function saveBid(data: Partial<Bid>): Promise<Bid> {
  const db = await getDB();
  const settings = await getSettings();
  const now = new Date().toISOString();

  let existing: Bid | undefined;
  if (data.id) {
    existing = await db.get('bids', data.id);
  }

  const hammerPrice = Math.max(0, data.hammerPrice ?? existing?.hammerPrice ?? 500);
  const buyerFeePercent = data.buyerFeePercent ?? existing?.buyerFeePercent ?? settings.defaultBuyerFeePercent;
  const vatMode = data.vatMode ?? existing?.vatMode ?? settings.defaultVatMode;
  const vatPercent = data.vatPercent ?? existing?.vatPercent ?? settings.defaultVatPercent;
  const inboundOtherCost = Math.max(0, data.inboundOtherCost ?? existing?.inboundOtherCost ?? 0);
  const expectedSalePrice = data.expectedSalePrice ?? existing?.expectedSalePrice ?? 0;
  const platformFeePercent = data.platformFeePercent ?? existing?.platformFeePercent ?? settings.defaultPlatformFeePercent;
  const deliveryCost = data.deliveryCost ?? existing?.deliveryCost ?? settings.defaultDeliveryCost;
  const packagingCost = data.packagingCost ?? existing?.packagingCost ?? settings.defaultPackagingCost;

  const inbound = calculateInbound({
    hammerPrice,
    buyerFeePercent,
    vatMode,
    vatPercent,
    inboundOtherCost,
  });

  const outbound = calculateOutbound({
    salePrice: expectedSalePrice,
    platformFeePercent,
    deliveryCost,
    packagingCost,
    landedCost: inbound.landedCost,
  });

  const bidToSave: Bid = {
    id: data.id || existing?.id || crypto.randomUUID(),
    name: (data.name ?? existing?.name ?? `Auction Lot (R${hammerPrice})`).trim(),
    hammerPrice,
    buyerFeePercent,
    vatMode,
    vatPercent,
    inboundOtherCost,
    calculatedBuyerFee: inbound.buyerFee,
    calculatedVat: inbound.vat,
    calculatedLandedCost: inbound.landedCost,
    expectedSalePrice: expectedSalePrice || undefined,
    platformFeePercent,
    deliveryCost,
    packagingCost,
    calculatedPlatformFee: outbound.platformFee,
    calculatedNetPayout: outbound.netPayout,
    calculatedNetProfit: outbound.netProfit,
    calculatedMarginPercent: outbound.marginPercent,
    status: data.status ?? existing?.status ?? 'ACTIVE',
    itemId: data.itemId ?? existing?.itemId,
    notes: data.notes ?? existing?.notes,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  await db.put('bids', bidToSave);
  return bidToSave;
}

export async function updateBidStatus(id: string, newStatus: BidStatus): Promise<{ bid: Bid; createdItem?: Item }> {
  const db = await getDB();
  const bid = await db.get('bids', id);
  if (!bid) throw new Error('Bid not found');

  const now = new Date().toISOString();
  let createdItem: Item | undefined;
  let itemId = bid.itemId;

  // If won and not yet transferred to stock, auto create inventory item
  if (newStatus === 'WON' && !itemId) {
    const newItem = await saveItem({
      name: bid.name,
      category: 'Electronics',
      status: 'IN_STOCK',
      purchaseDate: now.split('T')[0],
      hammerPrice: bid.hammerPrice,
      buyerFeePercent: bid.buyerFeePercent,
      vatMode: bid.vatMode,
      vatPercent: bid.vatPercent,
      inboundOtherCost: bid.inboundOtherCost,
      targetSalePrice: bid.expectedSalePrice || undefined,
      platformFeePercent: bid.platformFeePercent,
      deliveryCost: bid.deliveryCost,
      packagingCost: bid.packagingCost,
      notes: bid.notes ? `Won from live bid: ${bid.notes}` : 'Won from Live Bids',
    });
    itemId = newItem.id;
    createdItem = newItem;
  }

  const updatedBid: Bid = {
    ...bid,
    status: newStatus,
    itemId,
    updatedAt: now,
  };

  await db.put('bids', updatedBid);
  return { bid: updatedBid, createdItem };
}

export async function updateBidHammerPrice(id: string, newHammerPrice: number): Promise<Bid> {
  const db = await getDB();
  const bid = await db.get('bids', id);
  if (!bid) throw new Error('Bid not found');

  const updatedBid = await saveBid({
    ...bid,
    hammerPrice: Math.max(0, newHammerPrice),
  });

  // If already linked to an inventory item, keep item in sync
  if (updatedBid.itemId) {
    await saveItem({
      id: updatedBid.itemId,
      hammerPrice: updatedBid.hammerPrice,
    });
  }

  return updatedBid;
}

export async function deleteBid(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bids', id);
}

// ----------------- IMPORT & EXPORT -----------------

export async function importBackup(backup: ResellBackupData): Promise<{ itemCount: number; bidCount: number }> {
  if (!backup || !Array.isArray(backup.items) || !Array.isArray(backup.bids)) {
    throw new Error('Invalid JSON format: Missing "items" or "bids" arrays.');
  }

  const db = await getDB();
  const tx = db.transaction(['items', 'bids', 'settings'], 'readwrite');

  // Clear existing data
  await tx.objectStore('items').clear();
  await tx.objectStore('bids').clear();

  // Save settings
  if (backup.settings) {
    await tx.objectStore('settings').put({
      key: 'app_settings',
      value: { ...DEFAULT_SETTINGS, ...backup.settings },
    });
  }

  // Restore items
  for (const item of backup.items) {
    await tx.objectStore('items').put(item);
  }

  // Restore bids
  for (const bid of backup.bids) {
    await tx.objectStore('bids').put(bid);
  }

  await tx.done;

  return {
    itemCount: backup.items.length,
    bidCount: backup.bids.length,
  };
}

export async function exportBackup(): Promise<ResellBackupData> {
  const items = await getItems();
  const bids = await getBids();
  const settings = await getSettings();

  return {
    app: 'ResellTrack',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    items,
    bids,
  };
}

export async function exportCsv(): Promise<string> {
  const items = await getItems();
  const headers = [
    'ID',
    'Item Name',
    'Category',
    'Status',
    'Purchase Date',
    'Hammer Price (ZAR)',
    'Buyer Fee %',
    'Buyer Fee (ZAR)',
    'VAT Mode',
    'VAT %',
    'VAT Paid (ZAR)',
    'Inbound Cost (ZAR)',
    'Total Landed Cost (ZAR)',
    'Sales Channel',
    'Sale Date',
    'Sale Price (ZAR)',
    'Platform Fee %',
    'Platform Fee (ZAR)',
    'Delivery Cost (ZAR)',
    'Packaging Cost (ZAR)',
    'Net Payout (ZAR)',
    'Net Profit (ZAR)',
    'Margin %',
    'ROI %',
    'Notes',
  ];

  const escapeCsv = (str: string | number | undefined | null) => {
    if (str === null || str === undefined) return '""';
    const val = String(str).replace(/"/g, '""');
    return `"${val}"`;
  };

  const rows = items.map((item) => [
    escapeCsv(item.id),
    escapeCsv(item.name),
    escapeCsv(item.category),
    escapeCsv(item.status),
    escapeCsv(item.purchaseDate),
    item.hammerPrice.toFixed(2),
    item.buyerFeePercent.toFixed(1),
    item.calculatedBuyerFee.toFixed(2),
    escapeCsv(item.vatMode),
    item.vatPercent.toFixed(1),
    item.calculatedVat.toFixed(2),
    item.inboundOtherCost.toFixed(2),
    item.calculatedLandedCost.toFixed(2),
    escapeCsv(item.salesChannel),
    escapeCsv(item.saleDate || ''),
    item.salePrice !== undefined && item.salePrice !== null ? item.salePrice.toFixed(2) : '',
    item.platformFeePercent.toFixed(1),
    item.calculatedPlatformFee.toFixed(2),
    item.deliveryCost.toFixed(2),
    item.packagingCost.toFixed(2),
    item.calculatedNetPayout.toFixed(2),
    item.calculatedNetProfit.toFixed(2),
    item.calculatedMarginPercent.toFixed(2),
    item.calculatedRoiPercent.toFixed(2),
    escapeCsv(item.notes || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export async function resetToSeedData(): Promise<void> {
  const db = await getDB();
  await seedInitialData(db);
}
