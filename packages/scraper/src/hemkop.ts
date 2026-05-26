import {
  fetchHemkopProductsForAllStores,
  type FetchHemkopProductsForAllStoresOptions,
  type HemkopStoreProduct
} from '../../ingestion/src/connectors/hemkop.js';
import { retailerMetadataFor } from './retailerMap.js';

export type HemkopPriceSnapshot = Readonly<{
  brand: string;
  category: string;
  currency: 'SEK';
  imageUrl: string;
  isAvailable: boolean;
  observedAt: string;
  packageText: string;
  price: number;
  priceText: string;
  productId: string;
  productName: string;
  retailerId: 'hemkop';
  sourceUrl: string;
  storeBranchCity: string;
  storeBranchId: string;
  storeBranchName: string;
  unitPriceText: string;
  unitPriceUnit: string;
}>;

export type HemkopPriceSnapshotWriter = Readonly<{
  writePriceSnapshots(snapshots: readonly HemkopPriceSnapshot[]): Promise<void> | void;
}>;

export type FetchHemkopPriceSnapshotsOptions = FetchHemkopProductsForAllStoresOptions & Readonly<{
  writer?: HemkopPriceSnapshotWriter;
}>;

export function hemkopStoreProductToPriceSnapshot(product: HemkopStoreProduct): HemkopPriceSnapshot {
  const retailer = retailerMetadataFor('hemkop');

  return {
    brand: product.brand,
    category: product.category,
    currency: retailer.currency,
    imageUrl: product.imageUrl,
    isAvailable: !product.outOfStock,
    observedAt: product.retrievedAt,
    packageText: product.packageText,
    price: product.price,
    priceText: product.priceText,
    productId: product.code,
    productName: product.name,
    retailerId: 'hemkop',
    sourceUrl: product.sourceUrl,
    storeBranchCity: product.city,
    storeBranchId: product.storeId,
    storeBranchName: product.storeName,
    unitPriceText: product.unitPriceText,
    unitPriceUnit: product.unitPriceUnit
  };
}

export async function fetchHemkopPriceSnapshots(options: FetchHemkopPriceSnapshotsOptions = {}): Promise<HemkopPriceSnapshot[]> {
  const products = await fetchHemkopProductsForAllStores(options);
  const snapshots = products.map(hemkopStoreProductToPriceSnapshot);
  await options.writer?.writePriceSnapshots(snapshots);
  return snapshots;
}

export async function fetchAndParseHemkopCatalogJson(options: FetchHemkopPriceSnapshotsOptions = {}): Promise<HemkopPriceSnapshot[]> {
  return fetchHemkopPriceSnapshots(options);
}
