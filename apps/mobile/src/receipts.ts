import { planMobileOfflineMutation, type MobileOfflineMutation } from './offlineMutations.js';

export type MobileReceiptReviewItem = {
  rawName: string;
  productId: string | null;
  canonicalName: string | null;
  itemTotal: number;
  matchConfidence: number;
  deltaVsMedian: number;
};

export type MobileReceiptReview = {
  storeId: string;
  purchasedAt: string;
  confidenceLabel: 'high' | 'medium-high' | 'medium' | 'low';
  matchedItems: MobileReceiptReviewItem[];
  goodBuys: MobileReceiptReviewItem[];
  overspend: MobileReceiptReviewItem[];
  comparedWithLocalMedianDelta: number;
  budget: {
    weeklyBudget: number;
    beforeReceiptSpend: number;
    afterReceiptSpend: number;
    remaining: number;
    status: 'under' | 'over';
  };
};

export type MobileReceiptReviewInput = {
  userId: string;
  receiptId: string;
  review: MobileReceiptReview;
  now: string;
  networkOnline: boolean;
  cameraPermissionReady: boolean;
};

export type MobileReceiptReviewPlan = {
  route: '/scan/receipt';
  status: 'ready_to_confirm' | 'needs_review' | 'blocked';
  receiptId: string;
  confidenceLabel: MobileReceiptReview['confidenceLabel'];
  summary: {
    lineCount: number;
    matchedCount: number;
    needsReviewCount: number;
    goodBuyCount: number;
    overspendCount: number;
    budgetImpact: number;
    weeklyRemainingAfterReceipt: number;
    weeklyStatus: MobileReceiptReview['budget']['status'];
  };
  blockers: Array<'camera_permission_required' | 'line_match_review_required' | 'network_required_for_immediate_sync'>;
  actions: Array<'request_camera_permission' | 'review_line_matches' | 'confirm_receipt_items' | 'queue_for_sync' | 'sync_when_online'>;
  confirmationMutation: MobileOfflineMutation | null;
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

export function buildMobileReceiptReviewPlan(input: MobileReceiptReviewInput): MobileReceiptReviewPlan {
  const userId = requireNonEmpty(input.userId, 'userId');
  const receiptId = requireNonEmpty(input.receiptId, 'receiptId');
  requireIsoDate(input.now, 'now');

  const needsReview = input.review.matchedItems.filter((item) => item.productId === null || item.matchConfidence < 0.8);
  const blockers: MobileReceiptReviewPlan['blockers'] = [];
  const actions: MobileReceiptReviewPlan['actions'] = [];

  if (!input.cameraPermissionReady) {
    blockers.push('camera_permission_required');
    actions.push('request_camera_permission');
  }

  if (needsReview.length > 0) {
    blockers.push('line_match_review_required');
    actions.push('review_line_matches');
  }

  if (!input.networkOnline) {
    blockers.push('network_required_for_immediate_sync');
    actions.push('queue_for_sync', 'sync_when_online');
  }

  const canConfirm = input.cameraPermissionReady && needsReview.length === 0;
  if (canConfirm) actions.unshift('confirm_receipt_items');

  const budgetImpact = Math.round((input.review.budget.afterReceiptSpend - input.review.budget.beforeReceiptSpend) * 100) / 100;
  const confirmationMutation = canConfirm
    ? planMobileOfflineMutation({
        id: `receipt-confirm:${receiptId}`,
        userId,
        type: 'receipt_confirm_items',
        payload: { receiptId, itemCount: input.review.matchedItems.length, budgetImpact },
        createdAt: input.now
      })
    : null;

  return {
    route: '/scan/receipt',
    status: canConfirm ? 'ready_to_confirm' : needsReview.length > 0 ? 'needs_review' : 'blocked',
    receiptId,
    confidenceLabel: input.review.confidenceLabel,
    summary: {
      lineCount: input.review.matchedItems.length,
      matchedCount: input.review.matchedItems.length - needsReview.filter((item) => item.productId === null).length,
      needsReviewCount: needsReview.length,
      goodBuyCount: input.review.goodBuys.length,
      overspendCount: input.review.overspend.length,
      budgetImpact,
      weeklyRemainingAfterReceipt: input.review.budget.remaining,
      weeklyStatus: input.review.budget.status
    },
    blockers,
    actions,
    confirmationMutation
  };
}

export function selectMobileReceiptReviewRows(review: MobileReceiptReview): Array<{
  rawName: string;
  label: string;
  itemTotal: number;
  matchConfidence: number;
  reviewRequired: boolean;
  tone: 'positive' | 'warning' | 'neutral';
}> {
  return review.matchedItems.map((item) => ({
    rawName: item.rawName,
    label: item.canonicalName ?? 'Unmatched item',
    itemTotal: item.itemTotal,
    matchConfidence: item.matchConfidence,
    reviewRequired: item.productId === null || item.matchConfidence < 0.8,
    tone: item.deltaVsMedian < 0 ? 'positive' : item.deltaVsMedian > 0 ? 'warning' : 'neutral'
  }));
}
