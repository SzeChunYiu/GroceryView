import {
  fetchIcaStorePrices,
  type IcaStorePrice,
  type IcaStorePriceScrapeOptions,
  type IcaStoreScrapeTarget
} from './ica.js';

export const DEFAULT_MAXI_ICA_STORE_TARGETS: readonly IcaStoreScrapeTarget[] = [
  {
    icaFormat: 'maxi',
    regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
    storeAccountId: '1003380',
    storeName: 'Maxi ICA Stormarknad Solna'
  },
  {
    icaFormat: 'maxi',
    regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
    storeAccountId: '1015001',
    storeName: 'Maxi ICA Stormarknad Bromma'
  },
  {
    icaFormat: 'maxi',
    regionId: '6ae1c52a-99a8-4b19-9464-dd01274df39d',
    storeAccountId: '1003408',
    storeName: 'Maxi ICA Stormarknad Barkarbystaden'
  }
];

export type MaxiIcaScrapeOptions = IcaStorePriceScrapeOptions & {
  stores?: readonly IcaStoreScrapeTarget[];
};

export type MaxiIcaStorePrice = IcaStorePrice & {
  icaFormat: 'maxi';
};

export function isMaxiIcaStore(target: Pick<IcaStoreScrapeTarget, 'icaFormat' | 'storeName'>) {
  return target.icaFormat === 'maxi' || /\bmaxi\s+ica\s+stormarknad\b/i.test(target.storeName);
}

export function maxiIcaStoreTargets(stores: readonly IcaStoreScrapeTarget[] = DEFAULT_MAXI_ICA_STORE_TARGETS) {
  return stores.filter(isMaxiIcaStore).map((store) => ({ ...store, icaFormat: 'maxi' as const }));
}

export async function fetchMaxiIcaStorePrices(options: MaxiIcaScrapeOptions = {}): Promise<MaxiIcaStorePrice[]> {
  const targets = maxiIcaStoreTargets(options.stores);
  const rows: MaxiIcaStorePrice[] = [];

  for (const target of targets) {
    const storeRows = await fetchIcaStorePrices(target, options);
    rows.push(...storeRows.map((row) => ({ ...row, icaFormat: 'maxi' as const })));
  }

  return rows;
}
