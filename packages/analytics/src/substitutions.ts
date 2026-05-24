export type ItemSubstitutionProduct = {
  productId: string;
  productName: string;
  category: string;
  currentPrice: number | null;
  usualPrice?: number | null;
  inStock: boolean;
  observedAt?: string | null;
};

export type ItemSubstitutionInput = {
  source: ItemSubstitutionProduct;
  candidates: ItemSubstitutionProduct[];
  maxSuggestions?: number;
  expensiveThresholdPercent?: number;
  minimumSavingsPercent?: number;
};

export type ItemSubstitutionSuggestion = {
  productId: string;
  productName: string;
  category: string;
  currentPrice: number;
  savingsPercent: number;
  observedAt: string | null;
  reason: string;
};

export type ItemSubstitutionReport = {
  available: boolean;
  trigger: 'out_of_stock' | 'very_expensive' | 'not_needed' | 'blocked';
  sourceProductId: string;
  sourceProductName: string;
  sourceCategory: string;
  sourceCurrentPrice: number | null;
  baselinePrice: number | null;
  categoryMedianPrice: number | null;
  expensiveThresholdPercent: number;
  suggestions: ItemSubstitutionSuggestion[];
  detail: string;
  guardrail: string;
};

const defaultMaxSuggestions = 3;
const defaultExpensiveThresholdPercent = 20;
const defaultMinimumSavingsPercent = 1;
const guardrail = 'Only same-category, in-stock candidates with a verified lower current price are returned; suggestions never auto-replace the shopper item.';

function isPositivePrice(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function medianFor(values: number[]) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((left, right) => left - right);
  if (sorted.length === 0) return null;
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[midpoint - 1]! + sorted[midpoint]!) / 2 : sorted[midpoint]!;
}

function percentSavings(baselinePrice: number, currentPrice: number) {
  return Math.max(0, ((baselinePrice - currentPrice) / baselinePrice) * 100);
}

function emptyReport(
  input: ItemSubstitutionInput,
  trigger: ItemSubstitutionReport['trigger'],
  baselinePrice: number | null,
  categoryMedianPrice: number | null,
  detail: string
): ItemSubstitutionReport {
  return {
    available: false,
    trigger,
    sourceProductId: input.source.productId,
    sourceProductName: input.source.productName,
    sourceCategory: input.source.category,
    sourceCurrentPrice: input.source.currentPrice,
    baselinePrice,
    categoryMedianPrice,
    expensiveThresholdPercent: input.expensiveThresholdPercent ?? defaultExpensiveThresholdPercent,
    suggestions: [],
    detail,
    guardrail
  };
}

export function buildItemSubstitutionSuggestions(input: ItemSubstitutionInput): ItemSubstitutionReport {
  const maxSuggestions = Math.max(1, Math.floor(input.maxSuggestions ?? defaultMaxSuggestions));
  const expensiveThresholdPercent = Math.max(0, input.expensiveThresholdPercent ?? defaultExpensiveThresholdPercent);
  const minimumSavingsPercent = Math.max(0, input.minimumSavingsPercent ?? defaultMinimumSavingsPercent);

  const sameCategoryCandidates = input.candidates.filter((candidate) => candidate.category === input.source.category && candidate.productId !== input.source.productId);
  const inStockSameCategoryCandidates = sameCategoryCandidates.filter((candidate) => candidate.inStock && isPositivePrice(candidate.currentPrice));
  const categoryMedianPrice = medianFor([
    ...(isPositivePrice(input.source.currentPrice) ? [input.source.currentPrice] : []),
    ...inStockSameCategoryCandidates.map((candidate) => candidate.currentPrice).filter(isPositivePrice)
  ]);
  const baselinePrice = input.source.inStock && isPositivePrice(input.source.currentPrice)
    ? input.source.currentPrice
    : isPositivePrice(input.source.usualPrice)
      ? input.source.usualPrice
      : categoryMedianPrice;

  if (!isPositivePrice(baselinePrice)) {
    return emptyReport(
      input,
      input.source.inStock ? 'blocked' : 'out_of_stock',
      null,
      categoryMedianPrice,
      'Substitution suggestions are withheld because the source item lacks a verified current or usual price baseline.'
    );
  }

  const isOutOfStock = !input.source.inStock;
  const usualPriceExpensive = isPositivePrice(input.source.currentPrice) && isPositivePrice(input.source.usualPrice)
    ? input.source.currentPrice >= input.source.usualPrice * (1 + expensiveThresholdPercent / 100)
    : false;
  const categoryExpensive = isPositivePrice(input.source.currentPrice) && isPositivePrice(categoryMedianPrice)
    ? input.source.currentPrice >= categoryMedianPrice * (1 + expensiveThresholdPercent / 100)
    : false;
  const isVeryExpensive = usualPriceExpensive || categoryExpensive;

  if (!isOutOfStock && !isVeryExpensive) {
    return emptyReport(
      input,
      'not_needed',
      baselinePrice,
      categoryMedianPrice,
      'Substitution suggestions are withheld because the source item is in stock and not very expensive versus its usual price or same-category peers.'
    );
  }

  const suggestions = inStockSameCategoryCandidates
    .filter((candidate): candidate is ItemSubstitutionProduct & { currentPrice: number } => isPositivePrice(candidate.currentPrice) && candidate.currentPrice < baselinePrice)
    .map((candidate) => ({
      productId: candidate.productId,
      productName: candidate.productName,
      category: candidate.category,
      currentPrice: candidate.currentPrice,
      savingsPercent: percentSavings(baselinePrice, candidate.currentPrice),
      observedAt: candidate.observedAt ?? null,
      reason: `${candidate.productName} is in the same category with a verified lower current price.`
    }))
    .filter((candidate) => candidate.savingsPercent >= minimumSavingsPercent)
    .sort((left, right) => {
      const savingsDelta = right.savingsPercent - left.savingsPercent;
      if (savingsDelta !== 0) return savingsDelta;
      return left.currentPrice - right.currentPrice;
    })
    .slice(0, maxSuggestions);

  if (suggestions.length === 0) {
    return emptyReport(
      input,
      isOutOfStock ? 'out_of_stock' : 'very_expensive',
      baselinePrice,
      categoryMedianPrice,
      'Substitution suggestions are withheld because no same-category in-stock item has a verified lower current price.'
    );
  }

  return {
    available: true,
    trigger: isOutOfStock ? 'out_of_stock' : 'very_expensive',
    sourceProductId: input.source.productId,
    sourceProductName: input.source.productName,
    sourceCategory: input.source.category,
    sourceCurrentPrice: input.source.currentPrice,
    baselinePrice,
    categoryMedianPrice,
    expensiveThresholdPercent,
    suggestions,
    detail: isOutOfStock
      ? `Item substitution suggestions are shown because ${input.source.productName} is out of stock; candidates are priced below the verified baseline.`
      : `Item substitution suggestions are shown because ${input.source.productName} is very expensive versus its usual price or same-category peers.`,
    guardrail
  };
}
