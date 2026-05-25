export type PriceDropReasonKind = 'promotion' | 'supplier_update' | 'temporary_stock_event' | 'clearance' | 'unusual_drop';

export interface PriceDropReasonInput {
  currentPrice?: number | null;
  previousPrice?: number | null;
  priceType?: string | null;
  campaignLabel?: string | null;
  productName?: string | null;
  source?: string | null;
  stockStatus?: string | null;
  inStock?: boolean | null;
  stockDelta?: number | null;
}

export interface PriceDropReason {
  kind: PriceDropReasonKind;
  icon: string;
  label: string;
  detail: string;
}

export type PriceAnomalyReviewStatus = 'clear' | 'queued_for_auto_verification' | 'queued_for_manual_review';
export type PriceAnomalyReviewSeverity = 'normal' | 'watch' | 'block_deal_highlight';

export type PriceAnomalyReviewInput = PriceDropReasonInput & {
  productId: string;
  observedAt?: string | null;
  sourceConfidence?: number | null;
};

export type PriceAnomalyReviewDecision = {
  status: PriceAnomalyReviewStatus;
  severity: PriceAnomalyReviewSeverity;
  dropPercent: number | null;
  canHighlightDeal: boolean;
  assignmentReason: string;
  requiredWriteback: 'none' | 'automated_price_event_verified' | 'human_price_anomaly_review';
};

export const priceAnomalyReviewWorkflow = {
  queueTable: 'human_review_assignments',
  subjectType: 'price_anomaly',
  reviewEndpoint: '/api/human-review/assignments',
  autoVerificationEndpoint: '/api/price-events/anomaly-verification',
  thresholds: {
    autoVerificationDropPercent: 0.35,
    manualReviewDropPercent: 0.6,
    lowSourceConfidence: 0.55
  },
  guardrails: [
    'Sudden extreme price changes are queued before deal badges or savings claims are highlighted.',
    'Automated verification may clear a known campaign only when source confidence is high.',
    'Manual review is required for unexplained large drops, low-confidence sources, or near-zero prices.'
  ]
} as const;

function includesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function normalizeText(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(' ').toLocaleLowerCase('sv-SE');
}

export function getPriceDropPercent({ currentPrice, previousPrice }: PriceDropReasonInput): number | null {
  if (!currentPrice || !previousPrice || currentPrice >= previousPrice) return null;
  return (previousPrice - currentPrice) / previousPrice;
}

export function getPriceDropReasons(input: PriceDropReasonInput): PriceDropReason[] {
  const text = normalizeText(input.priceType, input.campaignLabel, input.productName, input.source, input.stockStatus);
  const dropPercent = getPriceDropPercent(input);
  const reasons: PriceDropReason[] = [];

  if (includesAny(text, ['kampanj', 'promotion', 'promo', 'rabatt', 'erbjudande', 'deal'])) {
    reasons.push({
      kind: 'promotion',
      icon: '🏷️',
      label: 'Promotion likely',
      detail: 'The price event carries campaign or discount wording, so the drop is likely promotional.',
    });
  }

  if (includesAny(text, ['supplier', 'leverantör', 'vendor', 'base price', 'list price', 'article update'])) {
    reasons.push({
      kind: 'supplier_update',
      icon: '📦',
      label: 'Supplier update',
      detail: 'Supplier or list-price metadata changed around this alert, which can move the shelf price without a shopper-facing campaign.',
    });
  }

  if (input.inStock === false || (input.stockDelta ?? 0) < 0 || includesAny(text, ['limited stock', 'low stock', 'out of stock', 'slut'])) {
    reasons.push({
      kind: 'temporary_stock_event',
      icon: '⏱️',
      label: 'Temporary stock event',
      detail: 'Fresh stock signals changed near the price drop, so availability may be temporary or store-specific.',
    });
  }

  if (includesAny(text, ['clearance', 'utförsäljning', 'utgår', 'short date', 'kort datum'])) {
    reasons.push({
      kind: 'clearance',
      icon: '⚡',
      label: 'Clearance or short date',
      detail: 'Clearance wording suggests the lower price may be tied to expiring or discontinued stock.',
    });
  }

  if (reasons.length === 0 && (dropPercent === null || dropPercent >= 0.2)) {
    reasons.push({
      kind: 'unusual_drop',
      icon: '🔎',
      label: 'Large unexplained drop',
      detail: 'No campaign, supplier, or stock clue explains the change yet; verify the shelf price before acting.',
    });
  }

  return reasons;
}

export function getPriceAnomalyReviewDecision(input: PriceAnomalyReviewInput): PriceAnomalyReviewDecision {
  const dropPercent = getPriceDropPercent(input);
  const reasons = getPriceDropReasons(input);
  const hasKnownReason = reasons.some((reason) => reason.kind !== 'unusual_drop');
  const sourceConfidence = input.sourceConfidence ?? 1;
  const nearZeroPrice = typeof input.currentPrice === 'number' && input.currentPrice <= 0.1;
  const needsManualReview = nearZeroPrice
    || sourceConfidence < priceAnomalyReviewWorkflow.thresholds.lowSourceConfidence
    || (dropPercent !== null && dropPercent >= priceAnomalyReviewWorkflow.thresholds.manualReviewDropPercent && !hasKnownReason);

  if (needsManualReview) {
    return {
      status: 'queued_for_manual_review',
      severity: 'block_deal_highlight',
      dropPercent,
      canHighlightDeal: false,
      assignmentReason: `Queue ${input.productId} as price_anomaly before highlighting savings; observed ${dropPercent === null ? 'unknown' : `${Math.round(dropPercent * 100)}%`} drop from ${input.source ?? 'unknown source'}.`,
      requiredWriteback: 'human_price_anomaly_review'
    };
  }

  if (dropPercent !== null && dropPercent >= priceAnomalyReviewWorkflow.thresholds.autoVerificationDropPercent) {
    return {
      status: 'queued_for_auto_verification',
      severity: 'watch',
      dropPercent,
      canHighlightDeal: false,
      assignmentReason: `Run automated anomaly verification for ${input.productId} before promoting the drop as a deal.`,
      requiredWriteback: 'automated_price_event_verified'
    };
  }

  return {
    status: 'clear',
    severity: 'normal',
    dropPercent,
    canHighlightDeal: true,
    assignmentReason: 'Price event can be displayed without anomaly review because the drop is below queue thresholds.',
    requiredWriteback: 'none'
  };
}
