import type { MobileQueryId } from './queryCache.js';

export type MobileOfflineMutationType = 'basket_add_item' | 'basket_update_quantity' | 'budget_set_weekly' | 'watchlist_add_item' | 'receipt_confirm_items';

export type MobileOfflineMutationStatus = 'pending' | 'syncing' | 'completed' | 'failed' | 'dead_lettered';

export type MobileOfflineMutationPayload =
  | { productId: string; quantity: number }
  | { productId: string; quantity: number; previousQuantity: number }
  | { weeklyBudget: number }
  | { productId: string; targetPrice?: number; alertDealScoreAt?: number }
  | { receiptId: string; itemCount: number; budgetImpact: number };

export type MobileOfflineMutation = {
  id: string;
  userId: string;
  type: MobileOfflineMutationType;
  payload: MobileOfflineMutationPayload;
  createdAt: string;
  status: MobileOfflineMutationStatus;
  attempt: number;
  retryAfter: string | null;
  invalidates: MobileQueryId[];
  sensitiveLocalOnly: boolean;
};

export type MobileOfflineMutationInput = {
  id: string;
  userId: string;
  type: MobileOfflineMutationType;
  payload: MobileOfflineMutationPayload;
  createdAt: string;
};

export type MobileOfflineMutationSummary = {
  total: number;
  pending: number;
  syncing: number;
  completed: number;
  failed: number;
  deadLettered: number;
  readyToSync: number;
  sensitiveLocalOnly: number;
};

export type MobileMutationSyncResult =
  | { status: 'synced' }
  | { status: 'retry'; reason: string }
  | { status: 'dead_letter'; reason: string };

const invalidationsByType: Record<MobileOfflineMutationType, MobileQueryId[]> = {
  basket_add_item: ['today', 'basket', 'budget'],
  basket_update_quantity: ['today', 'basket', 'budget'],
  budget_set_weekly: ['today', 'budget'],
  watchlist_add_item: ['today', 'product'],
  receipt_confirm_items: ['today', 'basket', 'budget']
};

function requireNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function requireIsoDate(value: string, label: string): string {
  if (Number.isNaN(Date.parse(value))) throw new Error(`${label} must be an ISO date.`);
  return value;
}

function assertPayload(input: MobileOfflineMutationInput): void {
  if (input.type === 'budget_set_weekly' && (!('weeklyBudget' in input.payload) || input.payload.weeklyBudget < 0)) {
    throw new Error('weeklyBudget must be zero or positive.');
  }
  if ((input.type === 'basket_add_item' || input.type === 'basket_update_quantity') && (!('quantity' in input.payload) || input.payload.quantity < 1)) {
    throw new Error('quantity must be positive.');
  }
  if ((input.type === 'basket_add_item' || input.type === 'basket_update_quantity' || input.type === 'watchlist_add_item') && !('productId' in input.payload)) {
    throw new Error('productId is required.');
  }
  if (input.type === 'receipt_confirm_items' && (!('receiptId' in input.payload) || !input.payload.receiptId.trim())) {
    throw new Error('receiptId is required.');
  }
}

export function planMobileOfflineMutation(input: MobileOfflineMutationInput): MobileOfflineMutation {
  requireNonEmpty(input.id, 'id');
  requireNonEmpty(input.userId, 'userId');
  requireIsoDate(input.createdAt, 'createdAt');
  assertPayload(input);

  return {
    id: input.id,
    userId: input.userId.trim(),
    type: input.type,
    payload: { ...input.payload },
    createdAt: input.createdAt,
    status: 'pending',
    attempt: 0,
    retryAfter: null,
    invalidates: [...invalidationsByType[input.type]],
    sensitiveLocalOnly: input.type === 'receipt_confirm_items'
  };
}

export function summarizeMobileOfflineMutations(queue: MobileOfflineMutation[], now: string): MobileOfflineMutationSummary {
  const nowMs = Date.parse(requireIsoDate(now, 'now'));
  return queue.reduce<MobileOfflineMutationSummary>(
    (summary, mutation) => {
      summary.total += 1;
      if (mutation.status === 'pending') summary.pending += 1;
      if (mutation.status === 'syncing') summary.syncing += 1;
      if (mutation.status === 'completed') summary.completed += 1;
      if (mutation.status === 'failed') summary.failed += 1;
      if (mutation.status === 'dead_lettered') summary.deadLettered += 1;
      if (mutation.sensitiveLocalOnly) summary.sensitiveLocalOnly += 1;
      if ((mutation.status === 'pending' || mutation.status === 'failed') && (!mutation.retryAfter || Date.parse(mutation.retryAfter) <= nowMs)) {
        summary.readyToSync += 1;
      }
      return summary;
    },
    { total: 0, pending: 0, syncing: 0, completed: 0, failed: 0, deadLettered: 0, readyToSync: 0, sensitiveLocalOnly: 0 }
  );
}

export function selectMobileMutationsForSync(queue: MobileOfflineMutation[], input: { now: string; limit: number }): MobileOfflineMutation[] {
  const nowMs = Date.parse(requireIsoDate(input.now, 'now'));
  if (!Number.isInteger(input.limit) || input.limit < 1) throw new Error('limit must be a positive integer.');

  return queue
    .filter((mutation) => (mutation.status === 'pending' || mutation.status === 'failed') && (!mutation.retryAfter || Date.parse(mutation.retryAfter) <= nowMs))
    .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))
    .slice(0, input.limit)
    .map((mutation) => ({ ...mutation, payload: { ...mutation.payload }, invalidates: [...mutation.invalidates] }));
}

export function applyMobileMutationSyncResult(
  mutation: MobileOfflineMutation,
  result: MobileMutationSyncResult,
  input: { attemptedAt: string; maxAttempts: number; backoffMinutes: number[] }
): MobileOfflineMutation {
  const attemptedAtMs = Date.parse(requireIsoDate(input.attemptedAt, 'attemptedAt'));
  if (!Number.isInteger(input.maxAttempts) || input.maxAttempts < 1) throw new Error('maxAttempts must be a positive integer.');
  if (input.backoffMinutes.length === 0 || input.backoffMinutes.some((minutes) => !Number.isFinite(minutes) || minutes < 0)) {
    throw new Error('backoffMinutes must contain non-negative numbers.');
  }

  if (result.status === 'synced') return { ...mutation, status: 'completed', attempt: mutation.attempt + 1, retryAfter: null };
  if (result.status === 'dead_letter' || mutation.attempt + 1 >= input.maxAttempts) {
    return { ...mutation, status: 'dead_lettered', attempt: mutation.attempt + 1, retryAfter: null };
  }

  const backoffIndex = Math.min(mutation.attempt, input.backoffMinutes.length - 1);
  return {
    ...mutation,
    status: 'failed',
    attempt: mutation.attempt + 1,
    retryAfter: new Date(attemptedAtMs + input.backoffMinutes[backoffIndex] * 60_000).toISOString()
  };
}
