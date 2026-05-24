export type StoreFeatureFilterId = 'coupons' | 'delivery' | 'pickup';

export type StoreFeatureFilter = {
  id: StoreFeatureFilterId;
  queryParam: StoreFeatureFilterId;
  label: string;
  description: string;
};

type StoreFeatureFlags = Record<StoreFeatureFilterId, boolean>;

export const STORE_FEATURE_FILTERS: StoreFeatureFilter[] = [
  {
    id: 'coupons',
    queryParam: 'coupons',
    label: 'Coupons available',
    description: 'Only show chains with advertised coupon or member-offer support.'
  },
  {
    id: 'delivery',
    queryParam: 'delivery',
    label: 'Home delivery',
    description: 'Only show chains that expose a home-delivery checkout option.'
  },
  {
    id: 'pickup',
    queryParam: 'pickup',
    label: 'Pickup',
    description: 'Only show chains that expose store pickup/click-and-collect checkout.'
  }
];

export const STORE_FEATURES_BY_CHAIN: Record<string, StoreFeatureFlags> = {
  coop: { coupons: true, delivery: true, pickup: true },
  hemkop: { coupons: true, delivery: true, pickup: true },
  ica: { coupons: true, delivery: true, pickup: true },
  willys: { coupons: true, delivery: true, pickup: true }
};

export function chainMatchesStoreFeatureFilters(chainId: string, activeFilters: StoreFeatureFilterId[]) {
  const features = STORE_FEATURES_BY_CHAIN[chainId];

  return activeFilters.every((filter) => features?.[filter]);
}

export function getStoreFeatureLabels(chainId: string) {
  const features = STORE_FEATURES_BY_CHAIN[chainId];

  return STORE_FEATURE_FILTERS.filter((filter) => features?.[filter.id]).map((filter) => filter.label);
}
