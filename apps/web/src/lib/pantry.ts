export type PantryStockStatus = 'healthy' | 'low' | 'depleted';

export type PantryExpiryUrgency = 'expired' | 'use-soon' | 'planned' | 'unknown';

export type PantryExpiryReminder = {
  daysUntilExpiry: number | null;
  label: string;
  urgency: PantryExpiryUrgency;
};

export type PantryDepletionUrgency = 'reorder-now' | 'reorder-soon' | 'covered' | 'unknown';

export type PantryDepletionPrediction = {
  daysUntilDepleted: number | null;
  expectedDepletedAt: string | null;
  reminderDate: string | null;
  reminderLabel: string;
  urgency: PantryDepletionUrgency;
  householdSize: number;
  observedDailyUse: number;
};

export type PantryStockItem = {
  productId: string;
  name: string;
  unit: string;
  ownedQuantity: number;
  minimumQuantity: number;
  estimatedDailyUse: number;
  depletionEstimateDays: number | null;
  depletionPrediction: PantryDepletionPrediction;
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
  purchasedQuantity?: number | null;
  purchasedAt?: string | null;
  householdSize?: number | null;
  daysUntilExpiry?: number | null;
  expiresAt?: string | null;
};

function roundQuantity(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100;
}

function daysBetween(start: Date, end: Date) {
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
}

function normalizeHouseholdSize(value: number | null | undefined) {
  return Math.max(1, Math.round(Number.isFinite(value) ? value ?? 1 : 1));
}

function estimateDailyUse(row: PantryStatusRow, asOf: Date) {
  const purchasedAt = row.purchasedAt ? new Date(row.purchasedAt) : null;
  const purchasedQuantity = typeof row.purchasedQuantity === 'number' ? row.purchasedQuantity : null;

  if (purchasedAt && Number.isFinite(purchasedAt.getTime()) && purchasedQuantity !== null && purchasedQuantity > row.remainingQuantity) {
    return roundQuantity((purchasedQuantity - row.remainingQuantity) / daysBetween(purchasedAt, asOf));
  }

  const householdSize = normalizeHouseholdSize(row.householdSize);
  const buffer = Math.max(row.remainingQuantity - row.minimumQuantity, row.minimumQuantity);
  return roundQuantity(Math.max((buffer / 7) * Math.sqrt(householdSize), 0.25));
}

export function estimateDepletionDays(ownedQuantity: number, estimatedDailyUse: number) {
  if (ownedQuantity <= 0) return 0;
  if (estimatedDailyUse <= 0) return null;
  return Math.ceil(ownedQuantity / estimatedDailyUse);
}

function addDays(asOf: Date, days: number) {
  const date = new Date(asOf);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildDepletionPrediction({
  asOf = new Date(),
  estimatedDailyUse,
  ownedQuantity,
  row
}: {
  asOf?: Date;
  estimatedDailyUse: number;
  ownedQuantity: number;
  row: Pick<PantryStatusRow, 'householdSize'>;
}): PantryDepletionPrediction {
  const householdSize = normalizeHouseholdSize(row.householdSize);
  const daysUntilDepleted = estimateDepletionDays(ownedQuantity, estimatedDailyUse);

  if (daysUntilDepleted === null) {
    return {
      daysUntilDepleted: null,
      expectedDepletedAt: null,
      reminderDate: null,
      reminderLabel: 'No observed depletion estimate yet',
      urgency: 'unknown',
      householdSize,
      observedDailyUse: estimatedDailyUse
    };
  }

  const reminderLeadDays = householdSize >= 4 ? 5 : householdSize >= 2 ? 3 : 2;
  const reminderOffset = Math.max(0, daysUntilDepleted - reminderLeadDays);
  const urgency: PantryDepletionUrgency = daysUntilDepleted <= reminderLeadDays
    ? 'reorder-now'
    : daysUntilDepleted <= reminderLeadDays + 4
      ? 'reorder-soon'
      : 'covered';

  return {
    daysUntilDepleted,
    expectedDepletedAt: addDays(asOf, daysUntilDepleted),
    reminderDate: addDays(asOf, reminderOffset),
    reminderLabel: daysUntilDepleted === 0
      ? 'Restock now'
      : `Remind ${reminderLeadDays} days before depletion`,
    urgency,
    householdSize,
    observedDailyUse: estimatedDailyUse
  };
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

export function buildPantryStockItems(rows: PantryStatusRow[], asOf: Date = new Date()): PantryStockItem[] {
  return rows.map((row) => {
    const ownedQuantity = roundQuantity(row.remainingQuantity);
    const estimatedDailyUse = estimateDailyUse(row, asOf);

    return {
      productId: row.productId,
      name: row.name,
      unit: row.unit,
      ownedQuantity,
      minimumQuantity: row.minimumQuantity,
      estimatedDailyUse,
      depletionEstimateDays: estimateDepletionDays(ownedQuantity, estimatedDailyUse),
      depletionPrediction: buildDepletionPrediction({ asOf, estimatedDailyUse, ownedQuantity, row }),
      expiryReminder: buildExpiryReminder(row),
      status: getStockStatus(ownedQuantity, row.minimumQuantity)
    };
  });
}

export function applyPantryConsumptionEvents(items: PantryStockItem[], events: PantryConsumptionEvent[]) {
  if (events.length === 0) return items;

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
      depletionPrediction: buildDepletionPrediction({
        estimatedDailyUse: item.estimatedDailyUse,
        ownedQuantity,
        row: { householdSize: item.depletionPrediction.householdSize }
      }),
      status: getStockStatus(ownedQuantity, item.minimumQuantity)
    };
  });
}
