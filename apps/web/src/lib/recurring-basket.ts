import { matchPurchaseHistoryRowToProduct, type PurchaseHistoryProductMatch } from './normalization';

export type BasketSubstitutePrice = {
  chainName: string;
  price: number;
};

export type BasketSubstituteProduct = {
  productId: string;
  productName: string;
  categoryLabel?: string;
  prices: BasketSubstitutePrice[];
};

export type BasketSubstituteSuggestion = {
  productId: string;
  productName: string;
  substituteProductId: string;
  substituteProductName: string;
  chainName: string;
  reason: 'high_unit_price' | 'unavailable_chain';
  savings: number;
  savingsLabel: string;
};

export type RecurringBasketLine = {
  productId: string;
  productName: string;
  quantity: number;
  templateQuantity: number;
};

export type RecurringBasketWindow = {
  startsOn: string;
  endsOn: string;
  label: string;
};

export type RecurringBasketDuplicate = {
  label: string;
  targetWindow: RecurringBasketWindow;
  preserveTemplate: boolean;
};

export type RecurringBasketPlan = {
  forecastSnapshotAt: string;
  id: string;
  templateName: string;
  cadence: 'weekly';
  nextWindow: RecurringBasketWindow;
  reusableTemplateId: string;
  lines: RecurringBasketLine[];
  duplicateControls: RecurringBasketDuplicate[];
  guardrails: string[];
};

export type PurchaseHistoryImportRow = {
  purchasedAt: string;
  productName: string;
  storeName: string;
  quantity: number;
  totalSpend: number;
  productMatch: PurchaseHistoryProductMatch | null;
};

export type PurchaseHistoryImportPreview = {
  rows: PurchaseHistoryImportRow[];
  recurringCandidates: Array<{
    productName: string;
    productId?: string;
    matchScore: number;
    purchaseCount: number;
    totalSpend: number;
    recommendationSeed: string;
    budgetSeedLabel: string;
  }>;
  totalSpend: number;
};

function normalizedSuggestionTokens(value: string) {
  return new Set(
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('sv-SE')
      .split(/[^a-z0-9]+/i)
      .filter((token) => token.length >= 3)
  );
}

function equivalentBasketProducts(product: BasketSubstituteProduct, candidate: BasketSubstituteProduct) {
  if (product.productId === candidate.productId) return false;
  if (product.categoryLabel && candidate.categoryLabel && product.categoryLabel === candidate.categoryLabel) return true;

  const productTokens = normalizedSuggestionTokens(product.productName);
  const candidateTokens = normalizedSuggestionTokens(candidate.productName);
  return [...productTokens].some((token) => candidateTokens.has(token));
}

function cheapestSubstitutePrice(product: BasketSubstituteProduct, chainName?: string) {
  const prices = chainName ? product.prices.filter((price) => price.chainName === chainName) : product.prices;
  const validPrices = prices.filter((price) => Number.isFinite(price.price) && price.price > 0);
  return validPrices.sort((left, right) => left.price - right.price)[0];
}

function formatSubstituteSavings(value: number, locale = 'sv-SE', currency = 'SEK') {
  return new Intl.NumberFormat(locale, { currency, maximumFractionDigits: 2, style: 'currency' }).format(value);
}

export function buildSmartBasketSubstituteSuggestions({
  catalog,
  items,
  locale = 'sv-SE',
  currency = 'SEK',
  unavailableChainNames = []
}: {
  catalog: readonly BasketSubstituteProduct[];
  items: readonly BasketSubstituteProduct[];
  locale?: string;
  currency?: string;
  unavailableChainNames?: readonly string[];
}): BasketSubstituteSuggestion[] {
  const suggestions: BasketSubstituteSuggestion[] = [];

  for (const item of items) {
    const itemCheapest = cheapestSubstitutePrice(item);
    const equivalents = catalog.filter((candidate) => equivalentBasketProducts(item, candidate));

    if (itemCheapest) {
      const cheaperCandidate = equivalents
        .map((candidate) => ({ candidate, price: cheapestSubstitutePrice(candidate) }))
        .filter((row): row is { candidate: BasketSubstituteProduct; price: BasketSubstitutePrice } => Boolean(row.price))
        .filter((row) => itemCheapest.price - row.price.price >= Math.max(1, itemCheapest.price * 0.08))
        .sort((left, right) => left.price.price - right.price.price)[0];

      if (cheaperCandidate) {
        const savings = itemCheapest.price - cheaperCandidate.price.price;
        suggestions.push({
          productId: item.productId,
          productName: item.productName,
          substituteProductId: cheaperCandidate.candidate.productId,
          substituteProductName: cheaperCandidate.candidate.productName,
          chainName: cheaperCandidate.price.chainName,
          reason: 'high_unit_price',
          savings,
          savingsLabel: formatSubstituteSavings(savings, locale, currency)
        });
      }
    }

    for (const chainName of unavailableChainNames) {
      if (item.prices.some((price) => price.chainName === chainName)) continue;
      const availableCandidate = equivalents
        .map((candidate) => ({ candidate, price: cheapestSubstitutePrice(candidate, chainName) }))
        .filter((row): row is { candidate: BasketSubstituteProduct; price: BasketSubstitutePrice } => Boolean(row.price))
        .sort((left, right) => left.price.price - right.price.price)[0];

      if (availableCandidate) {
        suggestions.push({
          productId: item.productId,
          productName: item.productName,
          substituteProductId: availableCandidate.candidate.productId,
          substituteProductName: availableCandidate.candidate.productName,
          chainName,
          reason: 'unavailable_chain',
          savings: 0,
          savingsLabel: formatSubstituteSavings(0, locale, currency)
        });
        break;
      }
    }
  }

  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = `${suggestion.productId}:${suggestion.substituteProductId}:${suggestion.reason}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 4);
}

const nextWeeklyWindow: RecurringBasketWindow = { startsOn: '2026-05-25', endsOn: '2026-05-31', label: 'Week 22 grocery window' };
const followingWeeklyWindow: RecurringBasketWindow = { startsOn: '2026-06-01', endsOn: '2026-06-07', label: 'Week 23 grocery window' };
const twoWeeksAheadWindow: RecurringBasketWindow = { startsOn: '2026-06-08', endsOn: '2026-06-14', label: 'Week 24 grocery window' };
const purchaseHistoryCatalog = [
  { name: 'Milk 1L', productId: 'milk-1l', aliases: ['mjolk', 'milk'] },
  { name: 'Eggs 12-pack', productId: 'eggs-12-pack', aliases: ['egg', 'eggs', 'agg'] },
  { name: 'Sourdough bread', productId: 'bread-sourdough', aliases: ['bread', 'brod', 'sourdough'] },
  { name: 'Kaffe', productId: 'kaffe', aliases: ['coffee', 'bryggkaffe'] },
  { name: 'Havregryn Extra Fylliga', productId: 'havregryn-extra-fylliga-101758934-st', aliases: ['oats', 'oatmeal', 'havregryn'] }
];

export const weeklyRecurringBasketPlan: RecurringBasketPlan = {
  id: 'weekly-family-basics',
  forecastSnapshotAt: '2026-05-25T00:00:00.000Z',
  templateName: 'Weekly family basics',
  cadence: 'weekly',
  reusableTemplateId: 'template-family-basics-v1',
  nextWindow: nextWeeklyWindow,
  lines: [
    { productId: 'milk-1l', productName: 'Milk 1L', quantity: 4, templateQuantity: 4 },
    { productId: 'eggs-12-pack', productName: 'Eggs 12-pack', quantity: 1, templateQuantity: 1 },
    { productId: 'bread-sourdough', productName: 'Sourdough bread', quantity: 2, templateQuantity: 2 }
  ],
  duplicateControls: [
    { label: 'Duplicate to next week', targetWindow: followingWeeklyWindow, preserveTemplate: true },
    { label: 'Duplicate two weeks ahead', targetWindow: twoWeeksAheadWindow, preserveTemplate: true }
  ],
  guardrails: [
    'Duplicating creates a draft basket only; it does not place an order.',
    'Template quantities are reused unless the shopper edits the draft.',
    'Expected windows stay visible so shoppers can review pickup timing before saving.'
  ]
};

export function createRecurringBasketDuplicate(plan: RecurringBasketPlan, targetWindow?: RecurringBasketWindow) {
  const duplicateWindow = targetWindow ?? plan.duplicateControls[0]?.targetWindow ?? plan.nextWindow;

  return {
    sourcePlanId: plan.id,
    reusableTemplateId: plan.reusableTemplateId,
    cadence: plan.cadence,
    targetWindow: duplicateWindow,
    lines: plan.lines.map((line) => ({
      productId: line.productId,
      productName: line.productName,
      quantity: line.templateQuantity
    }))
  };
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let quoted = false;

  for (const character of line) {
    if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }

  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"|"$/g, '').trim());
}

export function parsePurchaseHistoryCsv(csv: string): PurchaseHistoryImportRow[] {
  const [headerLine, ...lines] = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!headerLine) return [];

  const headers = parseCsvLine(headerLine).map((header) => header.toLocaleLowerCase('sv-SE'));
  const indexFor = (...names: string[]) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
  const dateIndex = indexFor('date', 'purchased_at', 'purchasedat');
  const productIndex = indexFor('product', 'product_name', 'productname', 'item');
  const storeIndex = indexFor('store', 'store_name', 'storename', 'chain');
  const quantityIndex = indexFor('quantity', 'qty', 'count');
  const totalIndex = indexFor('total', 'total_spend', 'totalspend', 'amount');

  return lines
    .map((line) => {
      const cells = parseCsvLine(line);
      const productName = cells[productIndex]?.trim();
      if (!productName) return null;
      const quantity = Number(cells[quantityIndex] ?? 1);
      const totalSpend = Number((cells[totalIndex] ?? 0).replace(/[^0-9.]/g, ''));
      return {
        purchasedAt: cells[dateIndex] || 'date not provided',
        productName,
        storeName: cells[storeIndex] || 'store not provided',
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        totalSpend: Number.isFinite(totalSpend) && totalSpend >= 0 ? totalSpend : 0,
        productMatch: matchPurchaseHistoryRowToProduct(productName, purchaseHistoryCatalog)
      };
    })
    .filter((row): row is PurchaseHistoryImportRow => row !== null);
}

export function buildPurchaseHistoryImportPreview(rows: readonly PurchaseHistoryImportRow[]): PurchaseHistoryImportPreview {
  const grouped = new Map<string, PurchaseHistoryImportRow[]>();
  for (const row of rows) {
    grouped.set(row.productName, [...(grouped.get(row.productName) ?? []), row]);
  }

  const recurringCandidates = Array.from(grouped.entries())
    .map(([productName, productRows]) => {
      const totalSpend = productRows.reduce((sum, row) => sum + row.totalSpend, 0);
      return {
        productName: productRows[0]?.productMatch?.productName ?? productName,
        productId: productRows[0]?.productMatch?.productId,
        matchScore: productRows[0]?.productMatch?.matchScore ?? 0,
        purchaseCount: productRows.length,
        totalSpend,
        recommendationSeed: `${productRows.length} historical purchase${productRows.length === 1 ? '' : 's'} for recommendation ranking`,
        budgetSeedLabel: `${totalSpend.toFixed(2)} SEK imported budget history`
      };
    })
    .sort((a, b) => b.purchaseCount - a.purchaseCount || b.totalSpend - a.totalSpend || a.productName.localeCompare(b.productName, 'sv'))
    .slice(0, 6);

  return {
    rows: [...rows],
    recurringCandidates,
    totalSpend: rows.reduce((sum, row) => sum + row.totalSpend, 0)
  };
}

export const recurringBasketHistoryByProduct = Object.fromEntries(
  weeklyRecurringBasketPlan.lines.map((line, index) => [
    line.productId,
    {
      purchaseCount: Math.max(1, line.templateQuantity),
      lastPurchasedAt: index === 0 ? '2026-05-18' : '2026-05-20'
    }
  ] as const)
);
