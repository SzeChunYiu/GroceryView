import { overpassSource, overpassStores, type OverpassIngestedStore } from './overpass';

export type IcaStore = {
  slug: string;
  osmType: OverpassIngestedStore['osmType'];
  osmId: number;
  name: string;
  brand: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  openingHours: string;
  website: string;
  phone: string;
  sourceUrl: string;
  retrievedAt: string;
};

export const icaStoresSource = {
  source: overpassSource.source,
  sourceUrl: overpassSource.sourceUrl,
  retrievedAt: overpassSource.retrievedAt,
  query: 'OpenStreetMap Overpass Sweden extract filtered to ICA supermarket branches with coordinates.',
};

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isIcaStore(store: OverpassIngestedStore): boolean {
  const brand = store.brand.toLowerCase();
  const name = store.name.toLowerCase();
  return (
    Number.isFinite(store.latitude) &&
    Number.isFinite(store.longitude) &&
    (brand.includes('ica') || name.startsWith('ica ') || name.includes(' ica '))
  );
}

function addressFor(store: OverpassIngestedStore): string {
  return [store.street, store.houseNumber].filter(Boolean).join(' ');
}

export const icaStores: IcaStore[] = overpassStores
  .filter(isIcaStore)
  .map((store) => ({
    slug: slugify(`${store.name}-${store.city || store.osmId}`),
    osmType: store.osmType,
    osmId: store.osmId,
    name: store.name || store.brand || `ICA ${store.osmId}`,
    brand: store.brand || 'ICA',
    city: store.city,
    address: addressFor(store),
    lat: store.latitude,
    lng: store.longitude,
    openingHours: store.openingHours,
    website: store.website,
    phone: store.phone,
    sourceUrl: store.sourceUrl,
    retrievedAt: store.retrievedAt,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'sv') || a.osmId - b.osmId);

export const icaStoreCount = icaStores.length;
