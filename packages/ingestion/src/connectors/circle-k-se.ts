export type CircleKSePriceChannel = 'app' | 'business_card' | 'partner_app' | 'single_payment' | 'store' | 'truck_card';
export type CircleKSePriceFormat = 'car_wash' | 'charging' | 'food_rescue' | 'fullservice_or_automat' | 'truck_network';
export type CircleKSePriceCategory = 'car_wash' | 'charging' | 'clearance_food' | 'fuel';

export type CircleKSePricingRow = {
  id: string;
  chain: 'circle_k';
  country: 'SE';
  currency: 'SEK';
  productName: string;
  category: CircleKSePriceCategory;
  price: number | null;
  priceDelta: number | null;
  priceMultiplier: number | null;
  unit: string;
  channel: CircleKSePriceChannel;
  format: CircleKSePriceFormat;
  store_id: string | null;
  region: string | null;
  is_member_price: boolean;
  is_subscription_price: boolean;
  is_coupon_price: boolean;
  is_clearance: boolean;
  multi_buy: { quantity: number; price: number } | null;
  sourceUrl: string;
  evidence: string;
  observedAt: string;
};

const OBSERVED_AT = '2026-05-24';
const CONSUMER_FUEL_SOURCE = 'https://www.circlek.se/drivmedel/drivmedelspriser';
const EXTRA_SOURCE = 'https://www.circlek.se/extra';
const CHARGING_SOURCE = 'https://www.circlek.se/laddning/priser';
const CAR_WASH_SOURCE = 'https://www.circlek.se/biltvatt/priser';
const BUSINESS_FUEL_SOURCE = 'https://www.circlek.se/foretag/drivmedel/priser';
const TRUCK_FUEL_SOURCE = 'https://www.circlek.se/foretag/fordonspark/truck/priser';
const FOOD_RESCUE_SOURCE = 'https://www.circlek.se/hallbarhet/riktigt-bra-mat';

const baseRow = {
  chain: 'circle_k' as const,
  country: 'SE' as const,
  currency: 'SEK' as const,
  observedAt: OBSERVED_AT,
  store_id: null,
  region: null,
  is_member_price: false,
  is_subscription_price: false,
  is_coupon_price: false,
  is_clearance: false,
  multi_buy: null,
  priceDelta: null,
  priceMultiplier: null
};

export const circleKSePricingRows: CircleKSePricingRow[] = [
  {
    ...baseRow,
    id: 'circle-k-se-consumer-fuel-local-pylon',
    productName: 'Consumer fuel pump price',
    category: 'fuel',
    price: null,
    unit: 'kr/l',
    channel: 'store',
    format: 'fullservice_or_automat',
    sourceUrl: CONSUMER_FUEL_SOURCE,
    evidence: 'Circle K removed public recommended consumer fuel prices; current consumer price is visible on the local station pylon and varies by locality.'
  },
  ...[
    ['miles 95', 18.89, '2026-05-22'],
    ['miles 98', 20.19, '2026-05-22'],
    ['miles+ 98', 20.49, '2026-05-22'],
    ['miles diesel', 21.34, '2026-05-21'],
    ['miles+ diesel', 21.93, '2026-05-21'],
    ['HVO100', 29.89, '2026-05-21'],
    ['Fordonsgas', 30.19, '2026-03-11'],
    ['E85', 15.84, '2026-05-22']
  ].map(([productName, price, changedAt]) => ({
    ...baseRow,
    id: `circle-k-se-business-${String(productName).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    productName: String(productName),
    category: 'fuel' as const,
    price: Number(price),
    unit: String(productName) === 'Fordonsgas' ? 'kr/kg' : 'kr/l',
    channel: 'business_card' as const,
    format: 'fullservice_or_automat' as const,
    sourceUrl: BUSINESS_FUEL_SOURCE,
    evidence: `Business-card list price changed ${changedAt}; Circle K states business cards use list price minus discount at automat and full-service stations, with lower local pump price winning when applicable.`
  })),
  ...[
    ['miles diesel truck weekly', 21.07, '2026-05-18'],
    ['HVO100 truck weekly', 29.42, '2026-05-18'],
    ['B100 truck weekly', 19.73, '2026-05-11'],
    ['AdBlue truck weekly', 9.89, '2026-05-11']
  ].map(([productName, price, changedAt]) => ({
    ...baseRow,
    id: `circle-k-se-truck-${String(productName).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    productName: String(productName),
    category: 'fuel' as const,
    price: Number(price),
    unit: 'kr/l',
    channel: 'truck_card' as const,
    format: 'truck_network' as const,
    sourceUrl: TRUCK_FUEL_SOURCE,
    evidence: `Truck weekly price changed ${changedAt}; Circle K states truck prices are Monday-Sunday prices for truck diesel customers regardless of pump/pylon price.`
  })),
  {
    ...baseRow,
    id: 'circle-k-se-extra-new-member-fuel',
    productName: 'EXTRA new-member fuel discount',
    category: 'fuel',
    price: null,
    priceDelta: -0.5,
    unit: 'kr/l',
    channel: 'store',
    format: 'fullservice_or_automat',
    is_member_price: true,
    sourceUrl: EXTRA_SOURCE,
    evidence: 'New EXTRA members receive 50 öre/liter discount on the first three fuel purchases when joining with a payment card; valid for two months after joining.'
  },
  {
    ...baseRow,
    id: 'circle-k-se-extra-first-charge',
    productName: 'EXTRA first Charge-app discount',
    category: 'charging',
    price: null,
    priceDelta: -0.5,
    unit: 'kr/kWh',
    channel: 'app',
    format: 'charging',
    is_member_price: true,
    sourceUrl: EXTRA_SOURCE,
    evidence: 'EXTRA gives 50 öre/kWh discount on the first charging session via the Circle K Charge app.'
  },
  {
    ...baseRow,
    id: 'circle-k-se-charge-app-300-400kw',
    productName: 'Circle K 300-400 kW charger via app',
    category: 'charging',
    price: 6.27,
    unit: 'kr/kWh',
    channel: 'app',
    format: 'charging',
    sourceUrl: CHARGING_SOURCE,
    evidence: 'Circle K publishes a 300-400 kW Sweden charging price via app.'
  },
  {
    ...baseRow,
    id: 'circle-k-se-charge-single-payment-300-400kw',
    productName: 'Circle K 300-400 kW charger one-off payment',
    category: 'charging',
    price: 6.27,
    unit: 'kr/kWh',
    channel: 'single_payment',
    format: 'charging',
    sourceUrl: CHARGING_SOURCE,
    evidence: 'Circle K publishes a 300-400 kW Sweden charging price for one-off payment.'
  },
  ...[
    ['Budget car wash from-price', 159],
    ['Standard car wash from-price', 199],
    ['Premium car wash from-price', 299],
    ['Ultimat season car wash from-price', 369]
  ].map(([productName, price]) => ({
    ...baseRow,
    id: `circle-k-se-${String(productName).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    productName: String(productName),
    category: 'car_wash' as const,
    price: Number(price),
    unit: 'kr/service from-price',
    channel: 'store' as const,
    format: 'car_wash' as const,
    sourceUrl: CAR_WASH_SOURCE,
    evidence: 'Circle K publishes car-wash starting prices and states local deviations can occur for prices and programs.'
  })),
  {
    ...baseRow,
    id: 'circle-k-se-too-good-to-go-clearance',
    productName: 'Too Good To Go food rescue bag',
    category: 'clearance_food',
    price: null,
    priceMultiplier: 1 / 3,
    unit: 'fraction of original price',
    channel: 'partner_app',
    format: 'food_rescue',
    is_clearance: true,
    sourceUrl: FOOD_RESCUE_SOURCE,
    evidence: 'Circle K says Too Good To Go sells food that risks being discarded at one third of the price, including sandwiches, pastries, drinks, candy, nuts, and salads.'
  }
];

export function fetchCircleKSePricingRows() {
  return circleKSePricingRows;
}

export function validateCircleKSePricingRows(rows: CircleKSePricingRow[] = circleKSePricingRows) {
  return rows.every((row) => (
    row.country === 'SE'
    && row.currency === 'SEK'
    && Boolean(row.sourceUrl)
    && Boolean(row.evidence)
    && (row.price === null || row.price >= 0)
    && (row.priceDelta === null || Number.isFinite(row.priceDelta))
    && (row.priceMultiplier === null || row.priceMultiplier > 0)
  ));
}
