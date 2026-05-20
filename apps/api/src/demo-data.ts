import type {
  BasketItem,
  PriceQuote,
  PriceSeries,
  ProductDetail,
  ProductSummary,
  StoreDetail,
  StoreSummary,
  UserAlert,
  WatchlistItem,
  WeeklyBasket,
} from '@groceryview/api-contracts';

export const demoProducts: ProductDetail[] = [
  {
    slug: 'zoegas-skane-mellanrost-450g',
    name: 'Zoegas Skane Mellanrost',
    brand: 'Zoegas',
    category: 'Coffee',
    currency: 'SEK',
    bestPrice: 49.9,
    packageSize: '450 g',
    comparableUnit: 'kg',
    watchedByDemoUser: true,
    demo: true,
  },
  {
    slug: 'oatly-ikaffe-1l',
    name: 'Oatly iKaffe',
    brand: 'Oatly',
    category: 'Dairy alternatives',
    currency: 'SEK',
    bestPrice: 17.5,
    packageSize: '1 l',
    comparableUnit: 'l',
    watchedByDemoUser: false,
    demo: true,
  },
];

export const demoStores: StoreDetail[] = [
  {
    slug: 'willys-odenplan',
    name: 'Willys Odenplan',
    chain: 'Willys',
    district: 'Odenplan',
    city: 'Stockholm',
    featuredDealProductSlugs: ['zoegas-skane-mellanrost-450g'],
    demo: true,
  },
  {
    slug: 'lidl-sveavagen',
    name: 'Lidl Sveavagen',
    chain: 'Lidl',
    district: 'Norrmalm',
    city: 'Stockholm',
    featuredDealProductSlugs: ['oatly-ikaffe-1l'],
    demo: true,
  },
];

export const demoPrices: PriceQuote[] = [
  {
    productSlug: 'zoegas-skane-mellanrost-450g',
    storeSlug: 'willys-odenplan',
    price: 49.9,
    unitPrice: 110.89,
    currency: 'SEK',
    priceType: 'promotion',
    confidenceLabel: 'high',
    demo: true,
  },
  {
    productSlug: 'zoegas-skane-mellanrost-450g',
    storeSlug: 'lidl-sveavagen',
    price: 56.9,
    unitPrice: 126.44,
    currency: 'SEK',
    priceType: 'regular',
    confidenceLabel: 'medium',
    demo: true,
  },
  {
    productSlug: 'oatly-ikaffe-1l',
    storeSlug: 'willys-odenplan',
    price: 17.5,
    unitPrice: 17.5,
    currency: 'SEK',
    priceType: 'member',
    confidenceLabel: 'medium',
    demo: true,
  },
];

export const demoSeries: PriceSeries[] = [
  {
    productSlug: 'zoegas-skane-mellanrost-450g',
    range: '90d',
    points: [
      { date: '2026-02-19', medianPrice: 62.5, bestPrice: 59.9 },
      { date: '2026-03-19', medianPrice: 61.9, bestPrice: 54.9 },
      { date: '2026-04-19', medianPrice: 63.5, bestPrice: 52.9 },
      { date: '2026-05-19', medianPrice: 62.5, bestPrice: 49.9 },
    ],
    demo: true,
  },
];

export const demoWatchlist: WatchlistItem[] = [
  {
    productSlug: 'zoegas-skane-mellanrost-450g',
    targetPrice: 52,
    alertEnabled: true,
    demo: true,
  },
];

export const demoBasket: WeeklyBasket = {
  id: 'demo-weekly-basket-current',
  total: 167.3,
  currency: 'SEK',
  demo: true,
};

export const demoBasketItems: BasketItem[] = [
  {
    productSlug: 'zoegas-skane-mellanrost-450g',
    quantity: 1,
    demo: true,
  },
];

export const demoAlerts: UserAlert[] = [
  {
    id: 'demo-alert-target-price',
    type: 'target_price',
    productSlug: 'zoegas-skane-mellanrost-450g',
    active: true,
    demo: true,
  },
];

export function toProductSummary(product: ProductDetail): ProductSummary {
  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    currency: product.currency,
    bestPrice: product.bestPrice,
    demo: true,
  };
}

export function toStoreSummary(store: StoreDetail): StoreSummary {
  return {
    slug: store.slug,
    name: store.name,
    chain: store.chain,
    district: store.district,
    city: store.city,
    demo: true,
  };
}
