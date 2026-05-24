export type PriceChangeDirection = 'down' | 'up';

export type ScrapedPriceSnapshot = Readonly<{
  price: number;
  productSlug: string;
  source?: string;
  storeId?: string;
}>;

export type PriceChangeEvent = Readonly<{
  currentPrice: number;
  delta: number;
  direction: PriceChangeDirection;
  previousPrice: number;
  productSlug: string;
  source?: string;
  storeId?: string;
}>;

export function detectPriceChange(previous: ScrapedPriceSnapshot | null, current: ScrapedPriceSnapshot): PriceChangeEvent | null {
  if (!previous || previous.price === current.price) return null;

  const delta = Number((current.price - previous.price).toFixed(2));

  return {
    currentPrice: current.price,
    delta: Math.abs(delta),
    direction: delta > 0 ? 'up' : 'down',
    previousPrice: previous.price,
    productSlug: current.productSlug,
    source: current.source ?? previous.source,
    storeId: current.storeId ?? previous.storeId
  };
}

export async function detectAndLogPriceChange(
  previous: ScrapedPriceSnapshot | null,
  current: ScrapedPriceSnapshot,
  writeEvent: (event: PriceChangeEvent) => Promise<void> | void
) {
  const event = detectPriceChange(previous, current);
  if (event) await writeEvent(event);
  return event;
}
