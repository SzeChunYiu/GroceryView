export type PantryStockStatus = 'healthy' | 'low' | 'depleted';

export type PantryExpiryUrgency = 'expired' | 'use-soon' | 'planned' | 'unknown';

export type PantryExpiryReminder = {
  daysUntilExpiry: number | null;
  label: string;
  urgency: PantryExpiryUrgency;
};

export type PantryStockItem = {
  productId: string;
  name: string;
  unit: string;
  ownedQuantity: number;
  minimumQuantity: number;
  estimatedDailyUse: number;
  depletionEstimateDays: number | null;
  expiryReminder: PantryExpiryReminder;
  isStaple?: boolean;
  status: PantryStockStatus;
};

export type PantryConsumptionEvent = {
  productId: string;
  quantity: number;
  source: 'trip' | 'manual';
  label: string;
  occurredAt: string;
};

export type PantryShoppingDeal = {
  productId: string;
  storeName: string;
  price: number;
  dealScore?: number | null;
};

export type PantryShoppingSuggestionPriority = 'high' | 'medium' | 'low';

export type PantryShoppingSuggestion = {
  productId: string;
  name: string;
  priority: PantryShoppingSuggestionPriority;
  reason: string;
  quantityLabel: string;
  bestDeal: PantryShoppingDeal | null;
  signals: string[];
};

type PantryStatusRow = {
  productId: string;
  name: string;
  unit: string;
  remainingQuantity: number;
  minimumQuantity: number;
  daysUntilExpiry?: number | null;
  expiresAt?: string | null;
  isStaple?: boolean;
};

function roundQuantity(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100;
}

function estimateDailyUse(row: PantryStatusRow) {
  const buffer = Math.max(row.remainingQuantity - row.minimumQuantity, row.minimumQuantity);
  return roundQuantity(Math.max(buffer / 7, 0.25));
}

export function estimateDepletionDays(ownedQuantity: number, estimatedDailyUse: number) {
  if (ownedQuantity <= 0) return 0;
  if (estimatedDailyUse <= 0) return null;
  return Math.ceil(ownedQuantity / estimatedDailyUse);
}

export function buildExpiryReminder(row: Pick<PantryStatusRow, 'daysUntilExpiry' | 'expiresAt'>): PantryExpiryReminder {
  const daysUntilExpiry = typeof row.daysUntilExpiry === 'number'
    ? Math.ceil(row.daysUntilExpiry)
    : row.expiresAt
      ? Math.ceil((new Date(row.expiresAt).getTime() - Date.now()) / 86_400_000)
      : null;

  if (daysUntilExpiry === null || !Number.isFinite(daysUntilExpiry)) {
    return { daysUntilExpiry: null, label: 'No expiry date tracked', urgency: 'unknown' };
  }

  if (daysUntilExpiry < 0) return { daysUntilExpiry, label: `Expired ${Math.abs(daysUntilExpiry)} days ago`, urgency: 'expired' };
  if (daysUntilExpiry === 0) return { daysUntilExpiry, label: 'Expires today', urgency: 'expired' };
  if (daysUntilExpiry <= 7) return { daysUntilExpiry, label: `Use within ${daysUntilExpiry} days`, urgency: 'use-soon' };
  return { daysUntilExpiry, label: `Expires in ${daysUntilExpiry} days`, urgency: 'planned' };
}

function getStockStatus(ownedQuantity: number, minimumQuantity: number): PantryStockStatus {
  if (ownedQuantity <= 0) return 'depleted';
  if (ownedQuantity <= minimumQuantity) return 'low';
  return 'healthy';
}

function priorityRank(priority: PantryShoppingSuggestionPriority) {
  return { high: 0, medium: 1, low: 2 }[priority];
}

function formatDealPrice(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function bestDealFor(productId: string, deals: PantryShoppingDeal[]) {
  const matches = deals.filter((deal) => deal.productId === productId);
  if (matches.length === 0) return null;

  return matches.sort((a, b) => {
    const scoreDelta = (b.dealScore ?? 0) - (a.dealScore ?? 0);
    return scoreDelta || a.price - b.price;
  })[0] ?? null;
}

export function buildPantryStockItems(rows: PantryStatusRow[]): PantryStockItem[] {
  return rows.map((row) => {
    const ownedQuantity = roundQuantity(row.remainingQuantity);
    const estimatedDailyUse = estimateDailyUse(row);

    return {
      productId: row.productId,
      name: row.name,
      unit: row.unit,
      ownedQuantity,
      minimumQuantity: row.minimumQuantity,
      estimatedDailyUse,
      depletionEstimateDays: estimateDepletionDays(ownedQuantity, estimatedDailyUse),
      expiryReminder: buildExpiryReminder(row),
      isStaple: row.isStaple,
      status: getStockStatus(ownedQuantity, row.minimumQuantity)
    };
  });
}

export function applyPantryConsumptionEvents(items: PantryStockItem[], events: PantryConsumptionEvent[]) {
  const consumedByProduct = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.productId] = (acc[event.productId] ?? 0) + Math.max(0, event.quantity);
    return acc;
  }, {});

  return items.map((item) => {
    const ownedQuantity = roundQuantity(item.ownedQuantity - (consumedByProduct[item.productId] ?? 0));

    return {
      ...item,
      ownedQuantity,
      depletionEstimateDays: estimateDepletionDays(ownedQuantity, item.estimatedDailyUse),
      status: getStockStatus(ownedQuantity, item.minimumQuantity)
    };
  });
}

export function buildPantryShoppingSuggestions(
  items: PantryStockItem[],
  deals: PantryShoppingDeal[] = []
): PantryShoppingSuggestion[] {
  return items.flatMap((item): PantryShoppingSuggestion[] => {
    const signals: string[] = [];
    const bestDeal = bestDealFor(item.productId, deals);
    let priority: PantryShoppingSuggestionPriority | null = null;
    let reason = '';

    if (item.expiryReminder.urgency === 'expired') {
      priority = 'high';
      reason = 'Replace expired pantry stock before the next trip.';
      signals.push(item.expiryReminder.label);
    } else if (item.status === 'depleted') {
      priority = 'high';
      reason = item.isStaple ? 'Staple is depleted and should be added to the next list.' : 'Pantry item is depleted.';
      signals.push('Depleted');
    } else if (item.expiryReminder.urgency === 'use-soon' && item.status === 'low') {
      priority = 'high';
      reason = 'Use the expiring remainder and buy a replacement while stock is low.';
      signals.push(item.expiryReminder.label, 'Low stock');
    } else if (item.status === 'low') {
      priority = 'medium';
      reason = item.isStaple ? 'Staple is at or below its household minimum.' : 'Pantry item is at or below minimum stock.';
      signals.push('Low stock');
    } else if (item.depletionEstimateDays !== null && item.depletionEstimateDays <= 3) {
      priority = 'medium';
      reason = 'Current usage will deplete this item before the next weekly shop.';
      signals.push(`${item.depletionEstimateDays} days left`);
    } else if (item.expiryReminder.urgency === 'use-soon') {
      priority = 'low';
      reason = 'Use soon before buying more; queue a deal-backed replacement if needed.';
      signals.push(item.expiryReminder.label);
    } else if (item.isStaple && bestDeal && (bestDeal.dealScore ?? 0) >= 80) {
      priority = 'low';
      reason = 'Staple is healthy, but a strong current deal is visible for planned stock-up.';
      signals.push('Staple deal');
    }

    if (!priority) return [];

    if (bestDeal) {
      signals.push(`${bestDeal.storeName} ${formatDealPrice(bestDeal.price)}`);
    }

    return [{
      productId: item.productId,
      name: item.name,
      priority,
      reason,
      quantityLabel: item.status === 'depleted'
        ? `Buy at least ${item.minimumQuantity} ${item.unit}`
        : `Top up from ${item.ownedQuantity} ${item.unit}`,
      bestDeal,
      signals
    }];
  }).sort((a, b) => {
    const priorityDelta = priorityRank(a.priority) - priorityRank(b.priority);
    return priorityDelta || (b.bestDeal?.dealScore ?? 0) - (a.bestDeal?.dealScore ?? 0) || a.name.localeCompare(b.name);
  });
}
