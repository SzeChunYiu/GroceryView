// Empty fallback for local builds without a DB-backed site snapshot export.
// Production deploys overwrite this module from postgres.latest_prices/observations before Next builds.
import type { AxfoodProduct } from '../axfood-products';

export const dbSiteSnapshotGeneratedAt = null;
export const dbSiteAxfoodProducts: AxfoodProduct[] = [];

export type DbSiteNewArrivalProduct = Readonly<{
  brand: string;
  category: string;
  chainName: string;
  href: string;
  id: string;
  image?: string | null;
  ingestedAt: string;
  name: string;
  observationLabel: string;
  price: number;
  priceLabel: string;
  source: 'Axfood' | 'OpenPrices';
}>;

export type DbSiteNewArrivalChain = Readonly<{
  chainName: string;
  latestIngestedAt: string;
  productCount: number;
}>;

export const dbSiteNewArrivalProducts: DbSiteNewArrivalProduct[] = [];
export const dbSiteNewArrivalChains: DbSiteNewArrivalChain[] = [];
