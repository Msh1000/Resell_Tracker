import { AppSettings } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  defaultBuyerFeePercent: 12.0,
  defaultVatPercent: 15.0,
  defaultVatMode: 'STANDARD',
  defaultPlatformFeePercent: 6.6,
  defaultDeliveryCost: 30.0,
  defaultPackagingCost: 0.0,
  currencySymbol: 'R',
  defaultSalesChannel: 'Bob Shop',
  defaultAuctionHouse: 'Aucor Auctioneers',
};

export const COMMON_CATEGORIES = [
  'Electronics',
  'Gaming & Consoles',
  'Audio & Headsets',
  'Power Tools',
  'Appliances',
  'Collectibles & Toys',
  'Computers & IT',
  'General',
];

export const SALES_CHANNELS = [
  'Bob Shop',
  'Takealot',
  'Facebook Marketplace',
  'WhatsApp / Direct',
  'Gumtree',
  'Cash / Walk-in',
];

export const AUCTION_HOUSES = [
  'Aucor Auctioneers',
  'Bidders Choice',
  'Live Bids',
  'Park Village',
  'Alliance Auctions',
  'Private Seller',
];
