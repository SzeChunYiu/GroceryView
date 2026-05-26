export type FixtureMarketCode = 'SE' | 'NO' | 'IS';
export type FixtureCurrency = 'SEK' | 'NOK' | 'ISK';
export type FixtureSourceKind = 'operator' | 'flyer' | 'receipt' | 'open_data' | 'manual_review';

export type FixtureMarket = {
  code: FixtureMarketCode;
  name: string;
  locale: string;
  currency: FixtureCurrency;
  city: string;
};

export type FixtureChain = {
  id: string;
  market: FixtureMarketCode;
  name: string;
  retailerType: 'grocery' | 'discount' | 'convenience' | 'pharmacy' | 'fuel';
};

export type FixtureStore = {
  id: string;
  chainId: string;
  market: FixtureMarketCode;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
};

export type FixtureProduct = {
  id: string;
  market: FixtureMarketCode;
  name: string;
  brand: string;
  category: string;
  packageText: string;
  barcode?: string;
};

export type FixturePriceObservation = {
  id: string;
  market: FixtureMarketCode;
  productId: string;
  storeId: string;
  observedAt: string;
  price: number;
  currency: FixtureCurrency;
  sourceRunId: string;
  confidence: number;
};

export type FixtureOffer = {
  id: string;
  market: FixtureMarketCode;
  productId: string;
  chainId: string;
  startsAt: string;
  endsAt: string;
  price: number;
  currency: FixtureCurrency;
  sourceRunId: string;
};

export type FixtureBasketLine = {
  productId: string;
  quantity: number;
};

export type FixtureBasket = {
  id: string;
  market: FixtureMarketCode;
  householdId: string;
  lines: FixtureBasketLine[];
};

export type FixtureSourceRun = {
  id: string;
  market: FixtureMarketCode;
  sourceKind: FixtureSourceKind;
  sourceName: string;
  startedAt: string;
  completedAt: string;
  rowCount: number;
};

type Override<T> = Partial<T>;

export const fixtureMarkets: Record<FixtureMarketCode, FixtureMarket> = {
  SE: { code: 'SE', name: 'Sweden', locale: 'sv-SE', currency: 'SEK', city: 'Stockholm' },
  NO: { code: 'NO', name: 'Norway', locale: 'nb-NO', currency: 'NOK', city: 'Oslo' },
  IS: { code: 'IS', name: 'Iceland', locale: 'is-IS', currency: 'ISK', city: 'Reykjavik' }
};

const fixtureCoordinates: Record<FixtureMarketCode, { latitude: number; longitude: number }> = {
  SE: { latitude: 59.3326, longitude: 18.0649 },
  NO: { latitude: 59.9139, longitude: 10.7522 },
  IS: { latitude: 64.1466, longitude: -21.9426 }
};

function fixtureCurrency(market: FixtureMarketCode): FixtureCurrency {
  return fixtureMarkets[market].currency;
}

function mergeFixture<T>(base: T, override: Override<T> = {}): T {
  return { ...base, ...override };
}

export function fixtureMarket(override: Override<FixtureMarket> = {}): FixtureMarket {
  const market = override.code ?? 'SE';
  return mergeFixture(fixtureMarkets[market], override);
}

export function fixtureChain(override: Override<FixtureChain> = {}): FixtureChain {
  const market = override.market ?? 'SE';
  return mergeFixture({
    id: `fixture-${market.toLowerCase()}-chain`,
    market,
    name: market === 'NO' ? 'REMA 1000' : market === 'IS' ? 'Bonus' : 'Willys',
    retailerType: market === 'IS' ? 'discount' : 'grocery'
  }, override);
}

export function fixtureStore(override: Override<FixtureStore> = {}): FixtureStore {
  const market = override.market ?? 'SE';
  const chain = fixtureChain({ market });
  const coordinates = fixtureCoordinates[market];
  return mergeFixture({
    id: `fixture-${market.toLowerCase()}-store`,
    chainId: chain.id,
    market,
    name: `${chain.name} ${fixtureMarkets[market].city}`,
    city: fixtureMarkets[market].city,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude
  }, override);
}

export function fixtureProduct(override: Override<FixtureProduct> = {}): FixtureProduct {
  const market = override.market ?? 'SE';
  return mergeFixture({
    id: `fixture-${market.toLowerCase()}-oat-milk`,
    market,
    name: market === 'IS' ? 'Haframjolk 1 l' : market === 'NO' ? 'Havredrikk 1 l' : 'Havredryck 1 l',
    brand: market === 'IS' ? 'Oatly' : 'Garant',
    category: 'dairy-alternatives',
    packageText: '1 l',
    barcode: market === 'SE' ? '0731869041552' : undefined
  }, override);
}

export function fixtureSourceRun(override: Override<FixtureSourceRun> = {}): FixtureSourceRun {
  const market = override.market ?? 'SE';
  return mergeFixture({
    id: `fixture-${market.toLowerCase()}-source-run-2026-05-25`,
    market,
    sourceKind: 'operator',
    sourceName: `${fixtureChain({ market }).name} public fixture source`,
    startedAt: '2026-05-25T08:00:00.000Z',
    completedAt: '2026-05-25T08:01:00.000Z',
    rowCount: 1
  }, override);
}

export function fixturePriceObservation(override: Override<FixturePriceObservation> = {}): FixturePriceObservation {
  const market = override.market ?? 'SE';
  const product = fixtureProduct({ market });
  const store = fixtureStore({ market });
  const sourceRun = fixtureSourceRun({ market });
  return mergeFixture({
    id: `fixture-${market.toLowerCase()}-price-observation`,
    market,
    productId: product.id,
    storeId: store.id,
    observedAt: '2026-05-25T08:00:00.000Z',
    price: market === 'IS' ? 449 : 19.9,
    currency: fixtureCurrency(market),
    sourceRunId: sourceRun.id,
    confidence: 0.9
  }, override);
}

export function fixtureOffer(override: Override<FixtureOffer> = {}): FixtureOffer {
  const market = override.market ?? 'SE';
  const product = fixtureProduct({ market });
  const chain = fixtureChain({ market });
  const sourceRun = fixtureSourceRun({ market, sourceKind: 'flyer' });
  return mergeFixture({
    id: `fixture-${market.toLowerCase()}-offer`,
    market,
    productId: product.id,
    chainId: chain.id,
    startsAt: '2026-05-25',
    endsAt: '2026-05-31',
    price: market === 'IS' ? 399 : 17.9,
    currency: fixtureCurrency(market),
    sourceRunId: sourceRun.id
  }, override);
}

export function fixtureBasket(override: Override<FixtureBasket> = {}): FixtureBasket {
  const market = override.market ?? 'SE';
  const product = fixtureProduct({ market });
  return mergeFixture({
    id: `fixture-${market.toLowerCase()}-basket`,
    market,
    householdId: `fixture-${market.toLowerCase()}-household`,
    lines: [{ productId: product.id, quantity: 2 }]
  }, override);
}

export function fixtureMarketBundle(market: FixtureMarketCode = 'SE') {
  const chain = fixtureChain({ market });
  const store = fixtureStore({ market, chainId: chain.id });
  const product = fixtureProduct({ market });
  const sourceRun = fixtureSourceRun({ market });
  const observation = fixturePriceObservation({ market, productId: product.id, storeId: store.id, sourceRunId: sourceRun.id });
  const offer = fixtureOffer({ market, productId: product.id, chainId: chain.id, sourceRunId: sourceRun.id });
  const basket = fixtureBasket({ market, lines: [{ productId: product.id, quantity: 2 }] });

  return {
    market: fixtureMarket({ code: market }),
    chain,
    store,
    product,
    sourceRun,
    observation,
    offer,
    basket
  };
}

export const fixtureEdgeCases = {
  missingBarcodeProduct: fixtureProduct({ id: 'fixture-missing-barcode', barcode: undefined }),
  zeroPriceObservation: fixturePriceObservation({ id: 'fixture-zero-price', price: 0, confidence: 0.4 }),
  outOfWindowOffer: fixtureOffer({ id: 'fixture-expired-offer', startsAt: '2026-04-01', endsAt: '2026-04-07' })
} as const;
