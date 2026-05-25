import type { ExpiryDealReport } from '@groceryview/core';

export type ExpiryDealRadarReport = ExpiryDealReport & {
  source: string;
};

export const expiryDealRadarReports = [
  {
    id: 'expiry-laxfile-liljeholmen',
    productId: 'fiskeriet-laxfile-500g',
    productName: 'Fiskeriet Laxfilé 500g',
    storeId: 'ica-kvantum-liljeholmen',
    storeName: 'ICA Kvantum Liljeholmen',
    category: 'fish',
    originalPrice: 159,
    currentPrice: 119,
    markdownPercent: 25,
    expiresAt: '2026-05-22T20:00:00.000Z',
    reportedAt: '2026-05-22T08:30:00.000Z',
    distanceKm: 3.2,
    verificationCount: 2,
    photoCount: 1,
    source: 'visible member-promo product row + community expiry sticker report'
  },
  {
    id: 'expiry-tomater-fridhemsplan',
    productId: 'garant-korsbarstomater-250g',
    productName: 'Garant Körsbärstomater 250g',
    storeId: 'coop-daglivs-fridhemsplan',
    storeName: 'Coop Daglivs Fridhemsplan',
    category: 'produce',
    originalPrice: 29.9,
    currentPrice: 19.9,
    markdownPercent: 33,
    expiresAt: '2026-05-23T10:00:00.000Z',
    reportedAt: '2026-05-22T07:45:00.000Z',
    distanceKm: 2.1,
    verificationCount: 1,
    photoCount: 1,
    source: 'visible shelf product row + community expiry sticker report'
  },
  {
    id: 'expiry-kvarg-fridhemsplan',
    productId: 'lindahls-kvarg-500g',
    productName: 'Lindahls Kvarg Naturell 500g',
    storeId: 'willys-fridhemsplan',
    storeName: 'Willys Fridhemsplan',
    category: 'dairy',
    originalPrice: 26.9,
    currentPrice: 19.9,
    markdownPercent: 26,
    expiresAt: '2026-05-23T18:00:00.000Z',
    reportedAt: '2026-05-22T09:00:00.000Z',
    distanceKm: 1.6,
    verificationCount: 1,
    photoCount: 0,
    source: 'visible member-promo product row + unconfirmed expiry shelf report'
  },
  {
    id: 'expiry-lingongrova-stale',
    productId: 'pagen-lingongrova-500g',
    productName: 'Pågen Lingongrova 500g',
    storeId: 'coop-medborgarplatsen',
    storeName: 'Coop Medborgarplatsen',
    category: 'bread',
    originalPrice: 42.9,
    currentPrice: 33.9,
    markdownPercent: 21,
    expiresAt: '2026-05-21T16:00:00.000Z',
    reportedAt: '2026-05-21T08:00:00.000Z',
    distanceKm: 2.9,
    verificationCount: 2,
    photoCount: 1,
    source: 'visible member-promo product row + expired community report retained as stale evidence'
  }
] satisfies ExpiryDealRadarReport[];
