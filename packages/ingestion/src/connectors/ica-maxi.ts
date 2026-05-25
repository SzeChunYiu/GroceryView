import {
  DEFAULT_ICA_STORE_CONFIGS,
  deriveIcaFormat,
  fetchIcaDefaultStoreProducts,
  type FetchIcaDefaultStoreProductsOptions,
  type IcaProduct,
  type IcaStoreConfig
} from './ica.js';

export const DEFAULT_ICA_MAXI_STORE_CONFIGS: readonly IcaStoreConfig[] = DEFAULT_ICA_STORE_CONFIGS
  .filter((store) => deriveIcaFormat(store.storeName) === 'maxi')
  .map((store) => ({ ...store, icaFormat: 'maxi' }));

export type FetchIcaMaxiStoreProductsOptions = Omit<FetchIcaDefaultStoreProductsOptions, 'stores'> & {
  stores?: readonly IcaStoreConfig[];
};

export async function fetchIcaMaxiStoreProducts(options: FetchIcaMaxiStoreProductsOptions = {}): Promise<IcaProduct[]> {
  return fetchIcaDefaultStoreProducts({
    ...options,
    stores: options.stores ?? DEFAULT_ICA_MAXI_STORE_CONFIGS
  });
}
