export type AsiaMartNoStore = {
  address: string;
  categories: ['ethnic_asian'];
  chainId: 'asia_mart_no';
  city: 'Oslo';
  country: 'NO';
  displayName: string;
  evidence: string;
  latitude?: number;
  longitude?: number;
  multiLocationVerified: boolean;
  sourceUrl: string;
  storeId: string;
};

export const ASIA_MART_NO_SOURCE_URL = 'https://asiaengros.no/asia-supermarket/';

export const asiaMartNoStores: AsiaMartNoStore[] = [
  {
    address: 'Økern Torgvei 3, 0580 Oslo',
    categories: ['ethnic_asian'],
    chainId: 'asia_mart_no',
    city: 'Oslo',
    country: 'NO',
    displayName: 'Asia Supermarket',
    evidence: 'Asia Engros states Asia Supermarket has moved to Økern Torgvei 3, 0580 Oslo. No second official Asia Supermarket location was verified from the source set.',
    multiLocationVerified: false,
    sourceUrl: ASIA_MART_NO_SOURCE_URL,
    storeId: 'asia_mart_no:okern-torgvei-3'
  }
];

export function listAsiaMartNoStores(): AsiaMartNoStore[] {
  return asiaMartNoStores.map((store) => ({ ...store, categories: [...store.categories] as ['ethnic_asian'] }));
}

export function asiaMartNoLocationAudit() {
  return {
    chainId: 'asia_mart_no' as const,
    multiLocationVerified: asiaMartNoStores.length > 1,
    sourceUrl: ASIA_MART_NO_SOURCE_URL,
    verifiedStoreCount: asiaMartNoStores.length
  };
}
