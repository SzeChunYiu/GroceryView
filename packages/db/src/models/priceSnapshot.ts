export type PriceSnapshot = {
  id: string;
  productId: string;
  storeId: string;
  price: number;
  unitPrice: number | null;
  currency: string;
  isOnSale: boolean;
  scrapedAt: Date;
  createdAt: Date;
};

export type PriceSnapshotInput = {
  productId: string;
  storeId: string;
  price: number;
  unitPrice?: number | null;
  currency?: string;
  isOnSale?: boolean;
  scrapedAt: Date;
};

export const PRICE_SNAPSHOT_TABLE = 'price_snapshots';
