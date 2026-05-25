export type ModerationRiskBand = 'low' | 'medium' | 'high';

export const MODERATION_RISK_THRESHOLDS: Record<ModerationRiskBand, number> = {
  high: 0.75,
  medium: 0.45,
  low: 0
} as const;

export const MODERATION_RISK_GUIDANCE = [
  {
    band: 'high',
    label: 'High risk',
    threshold: MODERATION_RISK_THRESHOLDS.high,
    routing: 'Queue for immediate human review before publishing.'
  },
  {
    band: 'medium',
    label: 'Medium risk',
    threshold: MODERATION_RISK_THRESHOLDS.medium,
    routing: 'Keep visible only after reviewer spot-checks the report evidence.'
  },
  {
    band: 'low',
    label: 'Low risk',
    threshold: MODERATION_RISK_THRESHOLDS.low,
    routing: 'Allow normal processing while retaining abuse telemetry.'
  }
] as const;

export function moderationRiskBand(score: number): ModerationRiskBand {
  if (score >= MODERATION_RISK_THRESHOLDS.high) return 'high';
  if (score >= MODERATION_RISK_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function formatModerationThreshold(value: number) {
  return `${Math.round(value * 100)}%`;
}


export type CommunityReviewPromptMetric = 'price_accuracy' | 'product_quality' | 'store_experience';

export type CommunityReviewPrompt = {
  id: CommunityReviewPromptMetric;
  label: string;
  question: string;
  helper: string;
  lowLabel: string;
  highLabel: string;
  trustReason: string;
};

export const COMMUNITY_REVIEW_PROMPTS: CommunityReviewPrompt[] = [
  {
    id: 'price_accuracy',
    label: 'Price accuracy',
    question: 'Was the reported shelf price accurate when you checked it?',
    helper: 'Rate whether the submitted SEK price matched the label, receipt, or app evidence you saw.',
    lowLabel: 'Price looked wrong',
    highLabel: 'Price matched exactly',
    trustReason: 'Confirms crowdsourced grocery prices before they influence cheapest-store and alert surfaces.'
  },
  {
    id: 'product_quality',
    label: 'Product quality',
    question: 'Was the product condition and variant quality correctly described?',
    helper: 'Use this for freshness, size/variant agreement, and whether the item looked shopper-ready.',
    lowLabel: 'Quality issue',
    highLabel: 'Quality as reported',
    trustReason: 'Separates a cheap but poor-quality item from a trustworthy deal candidate.'
  },
  {
    id: 'store_experience',
    label: 'Store experience',
    question: 'Was the in-store experience consistent with the report?',
    helper: 'Consider stock availability, shelf placement, checkout/member-price behavior, and staff correction.',
    lowLabel: 'Hard to verify',
    highLabel: 'Easy to verify in store',
    trustReason: 'Helps community validation identify stores where reports are easy to reproduce.'
  }
];

export const COMMUNITY_REVIEW_PROMPT_COPY = {
  title: 'Review this community price report',
  intro: 'After submitting or checking a report, rate price accuracy, product quality, and store experience so crowdsourced grocery data becomes more trustworthy.',
  guardrail: 'Prompts collect validation signals only; they do not publish anonymous moderation decisions or fabricate price evidence.'
} as const;

export function communityReviewPromptFor(metric: CommunityReviewPromptMetric) {
  return COMMUNITY_REVIEW_PROMPTS.find((prompt) => prompt.id === metric) ?? COMMUNITY_REVIEW_PROMPTS[0]!;
}
