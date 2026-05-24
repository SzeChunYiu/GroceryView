export type EffectiveUnitPriceListing = {
  price?: number;
  unitPrice?: number;
  list_price?: number;
};

export type EffectiveUnitPricePromotion = {
  type: 'multi_buy' | 'fixed_bundle' | 'percentage_off' | 'threshold_spend';
  quantity?: number;
  eligible_quantity?: number;
  bundlePrice?: number;
  bundle_price?: number;
  price?: number;
  percentOff?: number;
  percent_off?: number;
  thresholdSpend?: number;
  threshold_spend?: number;
};

export type EffectiveUnitPriceResult = {
  effective_price: number;
  eligible_quantity: number;
  savings_vs_list: number;
  threshold_spend?: number;
};

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function positiveNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;
}

function listPriceFor(listing: EffectiveUnitPriceListing) {
  const listPrice = positiveNumber(listing.list_price) ?? positiveNumber(listing.price) ?? positiveNumber(listing.unitPrice);
  if (listPrice === undefined) throw new Error('listing price is required to calculate effective unit price.');
  return listPrice;
}

export function effectiveUnitPrice(input: {
  listing: EffectiveUnitPriceListing;
  promotion?: EffectiveUnitPricePromotion | null;
}): EffectiveUnitPriceResult {
  const listPrice = listPriceFor(input.listing);
  const promotion = input.promotion;

  if (!promotion) {
    return {
      effective_price: money(listPrice),
      eligible_quantity: 1,
      savings_vs_list: 0
    };
  }

  if (promotion.type === 'multi_buy' || promotion.type === 'fixed_bundle') {
    const eligibleQuantity = positiveNumber(promotion.eligible_quantity) ?? positiveNumber(promotion.quantity) ?? 1;
    const bundlePrice = positiveNumber(promotion.bundle_price) ?? positiveNumber(promotion.bundlePrice) ?? positiveNumber(promotion.price);
    const effectivePrice = bundlePrice === undefined ? listPrice : bundlePrice / eligibleQuantity;

    return {
      effective_price: money(effectivePrice),
      eligible_quantity: eligibleQuantity,
      savings_vs_list: money(listPrice - effectivePrice)
    };
  }

  if (promotion.type === 'percentage_off') {
    const percentOff = positiveNumber(promotion.percent_off) ?? positiveNumber(promotion.percentOff) ?? 0;
    const effectivePrice = listPrice * (1 - Math.min(percentOff, 100) / 100);

    return {
      effective_price: money(effectivePrice),
      eligible_quantity: positiveNumber(promotion.eligible_quantity) ?? positiveNumber(promotion.quantity) ?? 1,
      savings_vs_list: money(listPrice - effectivePrice)
    };
  }

  const thresholdSpend = positiveNumber(promotion.threshold_spend) ?? positiveNumber(promotion.thresholdSpend);
  return {
    effective_price: money(listPrice),
    eligible_quantity: positiveNumber(promotion.eligible_quantity) ?? positiveNumber(promotion.quantity) ?? 1,
    savings_vs_list: 0,
    ...(thresholdSpend !== undefined ? { threshold_spend: thresholdSpend } : {})
  };
}

export const calculateEffectiveUnitPrice = effectiveUnitPrice;
