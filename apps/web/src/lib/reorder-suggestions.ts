type PurchaseSignal = {
  productId: string;
  productName: string;
  lastPurchasedAt: string;
  purchasesLast90Days: number;
  averageGapDays: number;
  usualQuantity: string;
};

export type ReorderSuggestion = PurchaseSignal & {
  daysSincePurchase: number;
  reorderScore: number;
  reason: string;
  listActionLabel: string;
  productCardPrompt: string;
};

const asOfDate = '2026-05-24';

const purchaseSignals: PurchaseSignal[] = [
  {
    productId: 'milk-oat-1l',
    productName: 'Oat milk 1L',
    lastPurchasedAt: '2026-05-15',
    purchasesLast90Days: 11,
    averageGapDays: 8,
    usualQuantity: '2 cartons'
  },
  {
    productId: 'eggs-free-range-12',
    productName: 'Free range eggs 12-pack',
    lastPurchasedAt: '2026-05-10',
    purchasesLast90Days: 8,
    averageGapDays: 11,
    usualQuantity: '1 pack'
  },
  {
    productId: 'bananas-kg',
    productName: 'Bananas',
    lastPurchasedAt: '2026-05-18',
    purchasesLast90Days: 14,
    averageGapDays: 6,
    usualQuantity: '1.2 kg'
  }
];

const toDaysSincePurchase = (lastPurchasedAt: string) => {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((Date.parse(asOfDate) - Date.parse(lastPurchasedAt)) / msPerDay));
};

export const buildReorderSuggestions = (signals: PurchaseSignal[] = purchaseSignals): ReorderSuggestion[] =>
  signals
    .map((signal) => {
      const daysSincePurchase = toDaysSincePurchase(signal.lastPurchasedAt);
      const recencyPressure = daysSincePurchase / signal.averageGapDays;
      const frequencyScore = Math.min(signal.purchasesLast90Days / 12, 1) * 45;
      const recencyScore = Math.min(recencyPressure, 1.4) * 40;
      const reorderScore = Math.round(frequencyScore + recencyScore);

      return {
        ...signal,
        daysSincePurchase,
        reorderScore,
        reason: `${signal.purchasesLast90Days} purchases in 90 days and ${daysSincePurchase} days since the last basket add.`,
        listActionLabel: `Add ${signal.usualQuantity} to next list`,
        productCardPrompt: `Usually reordered every ${signal.averageGapDays} days; suggest ${signal.usualQuantity} on this product card.`
      };
    })
    .filter((suggestion) => suggestion.reorderScore >= 55)
    .sort((left, right) => right.reorderScore - left.reorderScore);

export const pastPurchaseReorderSuggestions = buildReorderSuggestions();

export const reorderSuggestionSummary = {
  title: 'Past-purchase reorder suggestions',
  basis: 'Frequency over the last 90 days plus recency versus the shopper’s usual reorder gap.',
  listLevel: 'Add high-scoring staples to the next shopping list as one-tap suggestions.',
  productCardLevel: 'Show product-card nudges when a shopper revisits a frequently purchased item.'
};
