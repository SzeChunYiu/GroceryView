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
  status: PantryStockStatus;
};

export type PantryConsumptionEvent = {
  productId: string;
  quantity: number;
  source: 'trip' | 'manual';
  label: string;
  occurredAt: string;
};

type PantryStatusRow = {
  productId: string;
  name: string;
  unit: string;
  remainingQuantity: number;
  minimumQuantity: number;
  daysUntilExpiry?: number | null;
  expiresAt?: string | null;
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
