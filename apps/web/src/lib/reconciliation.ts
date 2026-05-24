export type PurchasedQuantityDraft = Record<string, number>;

export type ReconciliationRow = {
  id: string;
  name: string;
  plannedQuantity: number;
  purchasedQuantity: number;
  delta: number;
  status: 'matched' | 'short' | 'extra' | 'missing';
};

export type ReconciliationSummary = {
  rows: ReconciliationRow[];
  plannedItemCount: number;
  matchedItemCount: number;
  missingItemCount: number;
  totalPlannedQuantity: number;
  totalPurchasedQuantity: number;
  totalDelta: number;
  accuracyPercent: number;
};

type ReconciliationItem = {
  id?: unknown;
  name?: unknown;
  title?: unknown;
  label?: unknown;
  quantity?: unknown;
  plannedQuantity?: unknown;
  amount?: unknown;
  checked?: unknown;
  isChecked?: unknown;
  completed?: unknown;
  purchased?: unknown;
};

function asRecord(item: unknown): ReconciliationItem {
  return item && typeof item === 'object' ? (item as ReconciliationItem) : {};
}

function toQuantity(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return Math.max(0, parsed);
  }
  return fallback;
}

export function getPlannedItemId(item: unknown): string {
  const record = asRecord(item);
  return String(record.id ?? getPlannedItemLabel(item));
}

export function getPlannedItemLabel(item: unknown): string {
  const record = asRecord(item);
  const label = record.name ?? record.title ?? record.label;
  return typeof label === 'string' && label.trim() ? label : 'Planned item';
}

export function getPlannedItemQuantity(item: unknown): number {
  const record = asRecord(item);
  return toQuantity(record.plannedQuantity ?? record.quantity ?? record.amount, 1);
}

export function isPlannedItemPurchased(item: unknown): boolean {
  const record = asRecord(item);
  return Boolean(record.checked ?? record.isChecked ?? record.completed ?? record.purchased);
}

export function reconcileTrip(items: readonly unknown[], purchasedQuantities: PurchasedQuantityDraft = {}): ReconciliationSummary {
  const rows = items.map((item) => {
    const id = getPlannedItemId(item);
    const plannedQuantity = getPlannedItemQuantity(item);
    const purchasedQuantity = Object.prototype.hasOwnProperty.call(purchasedQuantities, id)
      ? toQuantity(purchasedQuantities[id], 0)
      : isPlannedItemPurchased(item)
        ? plannedQuantity
        : 0;
    const delta = purchasedQuantity - plannedQuantity;
    const status: ReconciliationRow['status'] = purchasedQuantity === 0
      ? 'missing'
      : delta === 0
        ? 'matched'
        : delta < 0
          ? 'short'
          : 'extra';

    return {
      id,
      name: getPlannedItemLabel(item),
      plannedQuantity,
      purchasedQuantity,
      delta,
      status
    };
  });

  const totalPlannedQuantity = rows.reduce((sum, row) => sum + row.plannedQuantity, 0);
  const totalPurchasedQuantity = rows.reduce((sum, row) => sum + row.purchasedQuantity, 0);
  const matchedItemCount = rows.filter((row) => row.status === 'matched').length;
  const missingItemCount = rows.filter((row) => row.status === 'missing' || row.status === 'short').length;
  const accuracyPercent = rows.length > 0 ? Math.round((matchedItemCount / rows.length) * 100) : 0;

  return {
    rows,
    plannedItemCount: rows.length,
    matchedItemCount,
    missingItemCount,
    totalPlannedQuantity,
    totalPurchasedQuantity,
    totalDelta: totalPurchasedQuantity - totalPlannedQuantity,
    accuracyPercent
  };
}

export const sampleTripReconciliation = reconcileTrip([
  { id: 'milk', name: 'Milk', quantity: 2, checked: true },
  { id: 'bananas', name: 'Bananas', quantity: 6, checked: true },
  { id: 'coffee', name: 'Coffee', quantity: 1, checked: false }
], {
  milk: 2,
  bananas: 5,
  coffee: 0
});
