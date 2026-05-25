import { groceryIndexMarketComparisons, type GroceryIndexMarketComparison } from './grocery-index-widget';

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
};

export type PurchaseHistoryImportPreview = {
  rows: PurchaseHistoryImportRow[];
  recurringCandidates: Array<{
    productName: string;
    purchaseCount: number;
    totalSpend: number;
    recommendationSeed: string;
    budgetSeedLabel: string;
  }>;
  totalSpend: number;
};

export type RecurringBasketInflationComparison = {
  window: GroceryIndexMarketComparison['window'];
  label: string;
  currentCost: number;
  baselineCost: number;
  basketChangePercent: number;
  marketIndexChangePercent: number;
  deltaVsMarketPercent: number;
  verdict: 'personal-rising-faster' | 'tracking-market' | 'personal-rising-slower';
};

export type RecurringBasketInflationTracker = {
  basketName: string;
  currentWindow: RecurringBasketWindow;
  recurringLineCount: number;
  comparisons: RecurringBasketInflationComparison[];
  source: 'recurring-basket-observed-costs';
  guardrails: string[];
};

const nextWeeklyWindow: RecurringBasketWindow = { startsOn: '2026-05-25', endsOn: '2026-05-31', label: 'Week 22 grocery window' };
const followingWeeklyWindow: RecurringBasketWindow = { startsOn: '2026-06-01', endsOn: '2026-06-07', label: 'Week 23 grocery window' };
const twoWeeksAheadWindow: RecurringBasketWindow = { startsOn: '2026-06-08', endsOn: '2026-06-14', label: 'Week 24 grocery window' };

export const weeklyRecurringBasketPlan: RecurringBasketPlan = {
  id: 'weekly-family-basics',
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

function percentChange(currentCost: number, baselineCost: number) {
  if (baselineCost <= 0) return 0;
  return Math.round(((currentCost - baselineCost) / baselineCost) * 1000) / 10;
}

function comparisonVerdict(deltaVsMarketPercent: number): RecurringBasketInflationComparison['verdict'] {
  if (deltaVsMarketPercent > 1) return 'personal-rising-faster';
  if (deltaVsMarketPercent < -1) return 'personal-rising-slower';
  return 'tracking-market';
}

export function buildRecurringBasketInflationTracker({
  basketName,
  currentCost,
  lastMonthCost,
  lastQuarterCost,
  marketComparisons = groceryIndexMarketComparisons,
  plan = weeklyRecurringBasketPlan
}: {
  basketName: string;
  currentCost: number;
  lastMonthCost: number;
  lastQuarterCost: number;
  marketComparisons?: GroceryIndexMarketComparison[];
  plan?: RecurringBasketPlan;
}): RecurringBasketInflationTracker {
  const baselines: Record<GroceryIndexMarketComparison['window'], number> = {
    'last-month': lastMonthCost,
    'last-quarter': lastQuarterCost
  };

  const comparisons = marketComparisons.map((market) => {
    const baselineCost = baselines[market.window];
    const basketChangePercent = percentChange(currentCost, baselineCost);
    const deltaVsMarketPercent = Math.round((basketChangePercent - market.marketIndexChangePercent) * 10) / 10;

    return {
      window: market.window,
      label: market.label,
      currentCost,
      baselineCost,
      basketChangePercent,
      marketIndexChangePercent: market.marketIndexChangePercent,
      deltaVsMarketPercent,
      verdict: comparisonVerdict(deltaVsMarketPercent)
    };
  });

  return {
    basketName,
    currentWindow: plan.nextWindow,
    recurringLineCount: plan.lines.length,
    comparisons,
    source: 'recurring-basket-observed-costs',
    guardrails: [
      'Uses saved recurring basket costs only; no missing household trips are estimated.',
      'Market comparisons use observed Grocery Index chain-basket movement.',
      'Verdicts compare percentage movement, not total household spend.'
    ]
  };
}

export const recurringBasketInflationTracker = buildRecurringBasketInflationTracker({
  basketName: weeklyRecurringBasketPlan.templateName,
  currentCost: 704.2,
  lastMonthCost: 681.4,
  lastQuarterCost: 646.8
});

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
        totalSpend: Number.isFinite(totalSpend) && totalSpend >= 0 ? totalSpend : 0
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
        productName,
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
