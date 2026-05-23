import { runAllStoreTasks, type AllStoreTaskRunnerControls } from './all-store-runner.js';
import {
  DEFAULT_ICA_STORE_CONFIGS,
  DEFAULT_ICA_MAX_PRODUCTS,
  buildIcaStorePromotionsUrl,
  parseIcaStorePromotions,
  type FetchIcaProductsOptions,
  type IcaProduct,
  type IcaStoreConfig
} from './ica.js';

export const DEFAULT_ICA_MAXI_STORE_CONFIGS: readonly IcaStoreConfig[] = DEFAULT_ICA_STORE_CONFIGS
  .filter((store) => /\bmaxi\b/i.test(store.storeName));

export type FetchIcaMaxiBulkProductsOptions = Omit<
  FetchIcaProductsOptions,
  'storeAccountId' | 'storeName' | 'regionId'
> & AllStoreTaskRunnerControls & {
  stores?: readonly IcaStoreConfig[];
  maxStores?: number;
};

export async function fetchIcaMaxiBulkProducts(
  options: FetchIcaMaxiBulkProductsOptions = {}
): Promise<IcaProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const configuredStores = options.stores ?? DEFAULT_ICA_MAXI_STORE_CONFIGS;
  const stores = options.maxStores ? configuredStores.slice(0, options.maxStores) : configuredStores;
  const maxRows = options.maxRows ?? DEFAULT_ICA_MAX_PRODUCTS;
  const maxPageSize = options.maxPageSize ?? maxRows;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();

  const { rows, failures } = await runAllStoreTasks({
    stores,
    storeId: (store) => store.storeAccountId,
    storeConcurrency: options.storeConcurrency ?? 6,
    storeStartDelayMs: options.storeStartDelayMs,
    storeRetryAttempts: options.storeRetryAttempts ?? 1,
    storeRetryBaseDelayMs: options.storeRetryBaseDelayMs,
    failOnStoreFailure: options.failOnStoreFailure,
    task: async (store) => {
      const sourceUrl = buildIcaStorePromotionsUrl(store.storeAccountId, store.regionId, maxPageSize);
      const response = await fetchImpl(sourceUrl, {
        headers: {
          accept: 'application/json, text/plain, */*',
          referer: new URL(`/stores/${store.storeAccountId}`, 'https://handlaprivatkund.ica.se').toString(),
          'client-route-id': 'PROMOTIONS',
          'ecom-request-source': 'web',
          'user-agent': 'GroceryView/0.1'
        }
      });
      if (!response.ok) {
        throw new Error(`ICA Maxi bulk product request failed for ${store.storeAccountId}: ${response.status}`);
      }
      const rows = parseIcaStorePromotions(await response.json(), {
        sourceUrl,
        retrievedAt,
        storeAccountId: store.storeAccountId,
        storeName: store.storeName,
        regionId: store.regionId,
        maxRows
      });
      if (rows.length === 0) throw new Error('no ICA Maxi products returned');
      return rows;
    }
  });

  const rowsByStore = new Set(rows.map((row) => row.storeAccountId));
  const missingStoreIds = [
    ...stores
      .map((store) => store.storeAccountId)
      .filter((storeAccountId) => !rowsByStore.has(storeAccountId)),
    ...failures.map((failure) => failure.storeId)
  ].filter((storeId, index, all) => all.indexOf(storeId) === index);
  if (missingStoreIds.length > 0) {
    throw new Error(`ICA Maxi bulk product requests missing configured branches: ${missingStoreIds.join(', ')}`);
  }
  if (rows.length === 0) {
    const reason = failures[0]?.error ?? 'no ICA Maxi products returned';
    throw new Error(`ICA Maxi bulk products returned no usable branch products: ${reason}`);
  }

  return rows;
}
