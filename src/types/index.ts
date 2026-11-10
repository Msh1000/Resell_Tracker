export type ItemStatus = 'IN_STOCK' | 'LISTED' | 'SOLD' | 'RETURNED' | 'SCRAPPED';

export type VatMode = 'STANDARD' | 'COMMISSION_ONLY' | 'EXEMPT';

export type BidStatus = 'ACTIVE' | 'WON' | 'LOST';

export interface Item {
  id: string;
  name: string;
  category: string;
  status: ItemStatus;
  
  // Inbound / Purchase details
  purchaseDate: string; // YYYY-MM-DD
  hammerPrice: number;
  buyerFeePercent: number; // default 12%
  vatMode: VatMode;
  vatPercent: number; // default 15%
  inboundOtherCost: number; // courier, fuel, repairs
  
  // Calculated Inbound
  calculatedBuyerFee: number;
  calculatedVat: number;
  calculatedLandedCost: number;
  
  // Outbound / Sale details
  targetSalePrice?: number;
  salePrice?: number;
  saleDate?: string;
  salesChannel: string; // e.g. 'Bob Shop'
  platformFeePercent: number; // default 6.6%
  deliveryCost: number; // default R30
  packagingCost: number;
  
  // Calculated Outbound
  calculatedPlatformFee: number;
  calculatedNetPayout: number;
  calculatedNetProfit: number;
  calculatedMarginPercent: number;
  calculatedRoiPercent: number;
  
  notes?: string;
  sku?: string;
  lotNumber?: string;
  auctionHouse?: string;
  storageLocation?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  name: string;
  hammerPrice: number;
  buyerFeePercent: number;
  vatMode: VatMode;
  vatPercent: number;
  inboundOtherCost: number;
  calculatedBuyerFee: number;
  calculatedVat: number;
  calculatedLandedCost: number;
  expectedSalePrice?: number;
  platformFeePercent: number;
  deliveryCost: number;
  packagingCost: number;
  calculatedPlatformFee: number;
  calculatedNetPayout: number;
  calculatedNetProfit: number;
  calculatedMarginPercent: number;
  status: BidStatus;
  itemId?: string; // set when won
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InboundCalculationParams {
  hammerPrice: number;
  buyerFeePercent: number;
  vatMode: VatMode;
  vatPercent: number;
  inboundOtherCost: number;
}

export interface InboundCalculationResult {
  buyerFee: number;
  vat: number;
  landedCost: number;
}

export interface OutboundCalculationParams {
  salePrice: number;
  platformFeePercent: number;
  deliveryCost: number;
  packagingCost: number;
  landedCost: number;
}

export interface OutboundCalculationResult {
  platformFee: number;
  netPayout: number;
  netProfit: number;
  marginPercent: number;
  roiPercent: number;
}

export interface AppSettings {
  defaultBuyerFeePercent: number;
  defaultVatPercent: number;
  defaultVatMode: VatMode;
  defaultPlatformFeePercent: number;
  defaultDeliveryCost: number;
  defaultPackagingCost: number;
  currencySymbol: string;
  defaultSalesChannel: string;
  defaultAuctionHouse?: string;
}

export interface ResellBackupData {
  app: string;
  version: number;
  exportedAt: string;
  settings: AppSettings;
  items: Item[];
  bids: Bid[];
}

