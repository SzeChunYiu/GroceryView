export type BasketForecastItem = {
  checked?: unknown;
  name?: unknown;
  quantity?: unknown;
  title?: unknown;
};

export type BasketForecastLine = {
  confidence: number;
  expected: number;
  high: number;
  low: number;
  name: string;
  quantity: number;
};

export type BasketForecast = {
  confidence: number;
  expectedTotal: number;
  highTotal: number;
  itemCount: number;
  lines: BasketForecastLine[];
  lowTotal: number;
  variance: number;
};

type PriceBand = {
  confidence: number;
  high: number;
  low: number;
  price: number;
};

const DEFAULT_BAND: PriceBand = { confidence: 0.7, high: 4.75, low: 2.25, price: 3.5 };

const PRICE_BANDS: Array<[RegExp, PriceBand]> = [
  [/milk|yogurt|cheese|cream/i, { confidence: 0.82, high: 5.4, low: 3.1, price: 4.2 }],
  [/egg|butter/i, { confidence: 0.78, high: 6.25, low: 3.75, price: 4.9 }],
  [/bread|bagel|tortilla|bun/i, { confidence: 0.8, high: 4.6, low: 2.6, price: 3.5 }],
  [/apple|banana|orange|berry|grape|fruit/i, { confidence: 0.74, high: 5.2, low: 2.4, price: 3.8 }],
  [/tomato|lettuce|onion|potato|carrot|pepper|vegetable|salad/i, { confidence: 0.72, high: 4.8, low: 1.9, price: 3.2 }],
  [/chicken|beef|pork|fish|salmon|turkey|meat/i, { confidence: 0.68, high: 14.5, low: 7.5, price: 10.8 }],
  [/rice|pasta|cereal|oat|flour|grain/i, { confidence: 0.79, high: 5.8, low: 2.9, price: 4.1 }],
  [/coffee|tea|juice|soda|water|drink/i, { confidence: 0.76, high: 7.2, low: 3.2, price: 5.1 }],
  [/soap|detergent|paper|tooth|clean/i, { confidence: 0.66, high: 10.8, low: 4.8, price: 7.4 }],
];

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const quantityFor = (quantity: unknown) => {
  if (typeof quantity === 'number' && Number.isFinite(quantity)) {
    return Math.max(1, quantity);
  }

  if (typeof quantity === 'string') {
    const parsed = Number.parseFloat(quantity);
    return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
  }

  return 1;
};

const nameFor = (item: BasketForecastItem) => {
  if (typeof item.name === 'string' && item.name.trim()) {
    return item.name;
  }

  if (typeof item.title === 'string' && item.title.trim()) {
    return item.title;
  }

  return 'Basket item';
};

const isChecked = (item: BasketForecastItem) => item.checked === true;

const bandFor = (name: string) => PRICE_BANDS.find(([pattern]) => pattern.test(name))?.[1] ?? DEFAULT_BAND;

export function calculateBasketForecast(items: readonly BasketForecastItem[] = []): BasketForecast {
  const selectedItems = items.filter((item) => !isChecked(item));
  const lines = selectedItems.map((item) => {
    const name = nameFor(item);
    const quantity = quantityFor(item.quantity);
    const band = bandFor(name);

    return {
      confidence: band.confidence,
      expected: roundMoney(band.price * quantity),
      high: roundMoney(band.high * quantity),
      low: roundMoney(band.low * quantity),
      name,
      quantity,
    };
  });

  const expectedTotal = roundMoney(lines.reduce((total, line) => total + line.expected, 0));
  const highTotal = roundMoney(lines.reduce((total, line) => total + line.high, 0));
  const lowTotal = roundMoney(lines.reduce((total, line) => total + line.low, 0));
  const confidence = lines.length
    ? Math.round((lines.reduce((total, line) => total + line.confidence, 0) / lines.length) * 100)
    : 0;

  return {
    confidence,
    expectedTotal,
    highTotal,
    itemCount: lines.length,
    lines,
    lowTotal,
    variance: roundMoney(highTotal - lowTotal),
  };
}
