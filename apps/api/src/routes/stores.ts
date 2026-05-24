import type { Store as ApiStore } from '@groceryview/api';
import {
  summarizeRetailerChains,
  type RetailerPriceSample,
  type RetailerChainOverview
} from '../../../packages/db/src/queries/retailers';
import { allProducts, allStores, groceryApi } from '../demo-data.js';

export type StoreListItem = ApiStore & { demo: true };

export type StoreChainOverview = RetailerChainOverview;

function normalizePrice(priceText: string | number): number {
  const rawText = String(priceText);
  const raw = rawText.replace(',', '.').replace(/[^0-9.]/g, '').trim();
  return Number(raw);
}

export function buildStoreList(): StoreListItem[] {
  return allStores().map((store) => ({ ...store, demo: true }));
}

export function buildStoreChainOverview(): StoreChainOverview[] {
  const stores = allStores().map((store) => ({
    chain: store.chain,
    country: 'Sweden',
    city: store.address ?? store.district
  }));

  const products = allProducts();
  const priceSamples = products
    .flatMap((product) => {
      const category = (product.category || product.slug.split('-')[0] || 'uncategorized')
        .toLowerCase()
        .trim();
      return product.currentPrices.map((price) => {
        const chain = groceryApi.getStore(price.storeId)?.chain;
        const normalizedPrice = normalizePrice(price.price);
        if (!chain || !Number.isFinite(normalizedPrice)) return null;
        return {
          chain,
          category,
          price: normalizedPrice
        };
      });
    })
    .filter((sample): sample is RetailerPriceSample => sample !== null);

  return summarizeRetailerChains({ stores, priceSamples });
}
