export type PriceChangeDirection = 'down' | 'up';

export type PriceChangeEventInput = Readonly<{
  currentPrice: number;
  delta: number;
  direction: PriceChangeDirection;
  previousPrice: number;
  productSlug: string;
  source?: string;
  storeId?: string;
}>;

export type PriceChangeEventRecord = PriceChangeEventInput & Readonly<{
  eventType: 'price_change';
  occurredAt: string;
}>;

const priceChangeEvents: PriceChangeEventRecord[] = [];

export function recordPriceChangeEvent(event: PriceChangeEventInput) {
  const record: PriceChangeEventRecord = {
    ...event,
    eventType: 'price_change',
    occurredAt: new Date().toISOString()
  };

  priceChangeEvents.push(record);
  return record;
}

export function listPriceChangeEvents() {
  return [...priceChangeEvents];
}
