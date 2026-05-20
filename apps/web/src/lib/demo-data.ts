export const products = [
  {
    slug: 'zoegas-coffee-450g',
    ticker: 'ZOEGAS-COFFEE-450G',
    name: 'Zoegas Coffee 450g',
    store: 'Willys Odenplan',
    price: '49.90 SEK',
    unitPrice: '110.89 SEK/kg',
    priceType: 'member promo',
    confidence: 'high',
    observedAt: '2026-05-19 09:10 CET',
    source: 'retailer flyer observation'
  },
  {
    slug: 'arla-milk-1l',
    ticker: 'ARLA-MILK-1L',
    name: 'Arla Milk 1L',
    store: 'Lidl Sveavagen',
    price: '13.90 SEK',
    unitPrice: '13.90 SEK/l',
    priceType: 'online',
    confidence: 'medium',
    observedAt: '2026-05-19 08:45 CET',
    source: 'online shelf observation'
  }
];

export const stores = [
  {
    slug: 'willys-odenplan',
    name: 'Willys Odenplan',
    district: 'Vasastan',
    format: 'discount supermarket',
    bestCategory: 'Coffee',
    distanceLabel: '1.2 km from saved area'
  }
];

export const categories = [
  {
    slug: 'coffee',
    name: 'Coffee',
    index: '91.6',
    movement: '-8.4%',
    topDeal: 'ZOEGAS-COFFEE-450G'
  }
];
