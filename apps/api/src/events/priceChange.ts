export type PriceChangeDirection = 'increase' | 'decrease';

export type PriceChangeEventInput = {
  changedAt?: Date | string;
  newPrice: number;
  oldPrice: number;
  productId: string;
  storeId: string;
};

export type PriceChangeEvent = {
  changedAt: string;
  direction: PriceChangeDirection;
  newPrice: number;
  oldPrice: number;
  priceDelta: number;
  productId: string;
  storeId: string;
};

export const PRICE_CHANGES_TABLE = 'price_changes';

function assertFinitePrice(value: number, fieldName: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative finite price.`);
  }
}

export function buildPriceChangeEvent(input: PriceChangeEventInput): PriceChangeEvent | null {
  const productId = input.productId.trim();
  const storeId = input.storeId.trim();
  if (!productId) throw new Error('productId is required.');
  if (!storeId) throw new Error('storeId is required.');
  assertFinitePrice(input.oldPrice, 'oldPrice');
  assertFinitePrice(input.newPrice, 'newPrice');
  if (input.oldPrice === input.newPrice) return null;

  const changedAt = input.changedAt instanceof Date
    ? input.changedAt.toISOString()
    : input.changedAt ?? new Date().toISOString();
  const priceDelta = Math.round((input.newPrice - input.oldPrice) * 100) / 100;

  return {
    changedAt,
    direction: priceDelta > 0 ? 'increase' : 'decrease',
    newPrice: input.newPrice,
    oldPrice: input.oldPrice,
    priceDelta,
    productId,
    storeId
  };
}

export function priceChangeTriggersTargetAlert(event: PriceChangeEvent, targetPrice: number): boolean {
  assertFinitePrice(targetPrice, 'targetPrice');
  return event.oldPrice > targetPrice && event.newPrice <= targetPrice;
}
