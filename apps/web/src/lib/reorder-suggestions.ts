import type { RecurringBasketDigest, RecurringBasketDigestLine } from '@groceryview/core';
import { weeklyBasketChangeDigest } from './verified-data';

export type ReorderSuggestionListItem = {
  id: string;
  matchedProductSlug?: string;
  name: string;
};

export type ReorderSuggestionSignal = {
  changeType: RecurringBasketDigestLine['changeType'];
  confidence: number;
  currentStoreName?: string;
  currentUnitPrice: number | null;
  previousUnitPrice: number | null;
  productName: string;
  productSlug: string;
  recommendedAction: string;
};

export type ReorderSuggestionWarning = ReorderSuggestionSignal & {
  itemId: string;
  itemName: string;
  label: string;
};

const warningChangeTypes = new Set<RecurringBasketDigestLine['changeType']>([
  'missing_current_price',
  'price_up',
  'substitute_available'
]);

function labelForSignal(signal: ReorderSuggestionSignal) {
  if (signal.changeType === 'missing_current_price') return 'Missing verified current price';
  if (signal.changeType === 'substitute_available') return 'Price increased; review substitute';
  return 'Latest verified price is higher';
}

export function reorderSignalsFromVerifiedDigest(digest: RecurringBasketDigest = weeklyBasketChangeDigest): ReorderSuggestionSignal[] {
  return digest.lines.map((line) => ({
    changeType: line.changeType,
    confidence: line.confidence,
    currentStoreName: line.currentStoreName,
    currentUnitPrice: line.currentUnitPrice,
    previousUnitPrice: line.previousUnitPrice,
    productName: line.productName,
    productSlug: line.productId,
    recommendedAction: line.recommendedAction
  }));
}

export function reorderWarningsForMatchedProducts(
  items: ReorderSuggestionListItem[],
  signals: ReorderSuggestionSignal[] = reorderSignalsFromVerifiedDigest()
): ReorderSuggestionWarning[] {
  const signalBySlug = new Map(signals.map((signal) => [signal.productSlug, signal]));

  return items.flatMap((item) => {
    const productSlug = item.matchedProductSlug?.trim();
    if (!productSlug) return [];
    const signal = signalBySlug.get(productSlug);
    if (!signal || !warningChangeTypes.has(signal.changeType)) return [];

    return [{
      ...signal,
      itemId: item.id,
      itemName: item.name,
      label: labelForSignal(signal)
    }];
  });
}
