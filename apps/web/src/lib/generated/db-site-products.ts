// Empty fallback for local builds without a DB-backed site snapshot export.
// Production deploys overwrite this module from postgres.latest_prices/observations before Next builds.
import type { AxfoodProduct } from '../axfood-products';

export const dbSiteSnapshotGeneratedAt = null;
export const dbSiteAxfoodProducts: AxfoodProduct[] = [];
