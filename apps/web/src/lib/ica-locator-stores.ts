import { osmStores, type OsmStore } from '@/lib/osm-stores';

const ICA_MATCH = /(^|\b)(ica|maxi)(\b|\s)/i;

function isIcaStore(store: OsmStore): boolean {
  return ICA_MATCH.test(store.brand || '') || ICA_MATCH.test(store.name || '');
}

function hasCoordinates(store: OsmStore): boolean {
  return Number.isFinite(store.lat) && Number.isFinite(store.lng);
}

export const icaLocatorStores = osmStores.filter((store) => isIcaStore(store) && hasCoordinates(store));
export const visibleIcaStores = icaLocatorStores.slice(0, 24);

export type { OsmStore };
