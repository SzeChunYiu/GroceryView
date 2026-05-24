export const SKELJUNGUR_FUEL_PRICES_API_URL = 'https://www.skeljungur.is/api/pricelistdata';
export const SKELJUNGUR_FUEL_PRICES_PAGE_URL = 'https://www.skeljungur.is/listaverd-eldsneytis';
export const SKELJUNGUR_FUEL_PRICE_PARSER_VERSION = 'skeljungur-is-fuel-prices-v1';

type SkeljungurFuelPriceItem = {
  ItemName?: unknown;
  Price?: unknown;
};

type SkeljungurFuelPricePayload = {
  executiontime?: unknown;
  items?: unknown;
};

export type SkeljungurFuelProductId =
  | 'fuel-95'
  | 'fuel-98'
  | 'fuel-diesel'
  | 'fuel-biodiesel'
  | 'fuel-aviation-gasoline'
  | 'fuel-jet-a1'
  | 'fuel-marine-diesel'
  | 'fuel-md-oil'
  | 'fuel-dma-oil'
  | 'fuel-blended-heavy-fuel-oil'
  | 'fuel-methane';

export type SkeljungurPricingChannel = 'fuel_list_price';

export type SkeljungurFuelPriceObservation = {
  domain: 'fuel';
  chainId: 'skeljungur_is';
  country: 'IS';
  operatorName: 'Skeljungur';
  productId: SkeljungurFuelProductId;
  productName: string;
  pricePerUnit: number;
  currency: 'ISK';
  unit: 'litre' | 'kg';
  channel: SkeljungurPricingChannel;
  customerSegment: 'business';
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  is_member_price: false;
  is_subscription_price: false;
  is_coupon_price: false;
  is_clearance: false;
  multi_buy: null;
  contractDiscountAvailable: true;
  excludesContractTerms: true;
  provenance: {
    source: 'skeljungur_fuel_price_list';
    parserVersion: string;
    rawSnapshotRef: string;
    executionTime: string;
    originalItemName: string;
    originalPrice: string;
  };
};

const SKELJUNGUR_FUEL_PRODUCTS: Array<{
  itemName: string;
  productId: SkeljungurFuelProductId;
  unit: SkeljungurFuelPriceObservation['unit'];
}> = [
  { itemName: 'Bensín 95 okt', productId: 'fuel-95', unit: 'litre' },
  { itemName: 'Bensín 98 okt', productId: 'fuel-98', unit: 'litre' },
  { itemName: 'Gasolía-Diesel', productId: 'fuel-diesel', unit: 'litre' },
  { itemName: 'Lífdiesel', productId: 'fuel-biodiesel', unit: 'litre' },
  { itemName: 'Flugbensín', productId: 'fuel-aviation-gasoline', unit: 'litre' },
  { itemName: 'JET A-1', productId: 'fuel-jet-a1', unit: 'litre' },
  { itemName: 'Skipagasolía', productId: 'fuel-marine-diesel', unit: 'litre' },
  { itemName: 'MD olía', productId: 'fuel-md-oil', unit: 'litre' },
  { itemName: 'DMA olía', productId: 'fuel-dma-oil', unit: 'litre' },
  { itemName: 'Svartolía blönduð', productId: 'fuel-blended-heavy-fuel-oil', unit: 'litre' },
  { itemName: 'Metan', productId: 'fuel-methane', unit: 'kg' }
];

export function buildSkeljungurFuelPricesUrl(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid Skeljungur fuel price date: ${date}`);
  return `${SKELJUNGUR_FUEL_PRICES_API_URL}?date=${date}`;
}

export function parseSkeljungurFuelPriceList(
  payload: SkeljungurFuelPricePayload,
  context: {
    capturedAt: string;
    sourceUrl?: string;
    rawSnapshotRef?: string;
    parserVersion?: string;
  }
): SkeljungurFuelPriceObservation[] {
  const items = Array.isArray(payload.items) ? payload.items as SkeljungurFuelPriceItem[] : [];
  const executionTime = typeof payload.executiontime === 'string' ? payload.executiontime : '';
  if (!executionTime) throw new Error('Skeljungur fuel price execution time missing.');

  return SKELJUNGUR_FUEL_PRODUCTS.map((product) => {
    const item = items.find((candidate) => candidate.ItemName === product.itemName);
    if (!item || typeof item.Price !== 'string') throw new Error(`Skeljungur fuel price missing for ${product.itemName}.`);
    const pricePerUnit = parseIcelandicPrice(item.Price);

    return {
      domain: 'fuel',
      chainId: 'skeljungur_is',
      country: 'IS',
      operatorName: 'Skeljungur',
      productId: product.productId,
      productName: product.itemName,
      pricePerUnit,
      currency: 'ISK',
      unit: product.unit,
      channel: 'fuel_list_price',
      customerSegment: 'business',
      sourceUrl: context.sourceUrl ?? SKELJUNGUR_FUEL_PRICES_PAGE_URL,
      observedAt: skeljungurExecutionTimeToIso(executionTime),
      capturedAt: context.capturedAt,
      is_member_price: false,
      is_subscription_price: false,
      is_coupon_price: false,
      is_clearance: false,
      multi_buy: null,
      contractDiscountAvailable: true,
      excludesContractTerms: true,
      provenance: {
        source: 'skeljungur_fuel_price_list',
        parserVersion: context.parserVersion ?? SKELJUNGUR_FUEL_PRICE_PARSER_VERSION,
        rawSnapshotRef: context.rawSnapshotRef ?? 'raw://skeljungur-is/fuel-price-list',
        executionTime,
        originalItemName: product.itemName,
        originalPrice: item.Price
      }
    };
  });
}

export async function fetchSkeljungurFuelPrices(options: {
  date?: string;
  fetchImpl?: typeof fetch;
  capturedAt?: string;
} = {}): Promise<SkeljungurFuelPriceObservation[]> {
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const date = options.date ?? capturedAt.slice(0, 10);
  const sourceUrl = buildSkeljungurFuelPricesUrl(date);
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 Skeljungur fuel price connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Skeljungur fuel price source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Skeljungur fuel price source failed with HTTP ${response.status}.`);

  return parseSkeljungurFuelPriceList(await response.json() as SkeljungurFuelPricePayload, {
    capturedAt,
    sourceUrl,
    rawSnapshotRef: `raw://skeljungur-is/fuel-price-list/${date}`
  });
}

function parseIcelandicPrice(value: string): number {
  const parsed = Number.parseFloat(value.replace(/\s+/g, '').replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Skeljungur fuel price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function skeljungurExecutionTimeToIso(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) throw new Error(`Invalid Skeljungur execution time: ${value}`);
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.000Z`;
}
