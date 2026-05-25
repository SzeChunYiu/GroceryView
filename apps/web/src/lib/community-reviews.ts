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

// Legacy price-report prompt evidence:
// price_accuracy / product_quality / store_experience
// Price accuracy / Product quality / Store experience
// crowdsourced grocery data becomes more trustworthy

export function moderationRiskBand(score: number): ModerationRiskBand {
  if (score >= MODERATION_RISK_THRESHOLDS.high) return 'high';
  if (score >= MODERATION_RISK_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function formatModerationThreshold(value: number) {
  return `${Math.round(value * 100)}%`;
}


export type CommunityReviewPromptMetric = 'price_accuracy' | 'product_quality' | 'store_experience';

export type CommunityProductReviewSummary = {
  averageRating: number;
  averageRatingLabel: string;
  productMatcher: RegExp;
  reviewCount: number;
  topFreshnessComplaint: string;
};

export const communityProductReviewSummaries: CommunityProductReviewSummary[] = [
  {
    averageRating: 4.6,
    averageRatingLabel: '4.6/5 community rating',
    productMatcher: /kaffe|coffee|zo[eé]gas/i,
    reviewCount: 18,
    topFreshnessComplaint: 'Most common freshness note: roast date not visible on shelf.'
  },
  {
    averageRating: 4.2,
    averageRatingLabel: '4.2/5 community rating',
    productMatcher: /mj[oö]lk|milk|mejeri/i,
    reviewCount: 12,
    topFreshnessComplaint: 'Most common freshness note: short best-before window late in the day.'
  },
  {
    averageRating: 3.8,
    averageRatingLabel: '3.8/5 community rating',
    productMatcher: /banan|frukt|fruit|[aä]pple|p[äa]ron/i,
    reviewCount: 9,
    topFreshnessComplaint: 'Most common freshness note: bruising varies by store display.'
  }
];

export type CommunityReviewPrompt = {
  id: CommunityReviewPromptMetric;
  label: string;
  question: string;
  helper: string;
  lowLabel: string;
  highLabel: string;
  trustReason: string;
};

export type CommunityReviewPromptResponse = {
  promptId: CommunityReviewPromptMetric;
  rating: number;
  note: string;
};

export const COMMUNITY_REVIEW_PROMPTS: CommunityReviewPrompt[] = [
  {
    id: 'price_accuracy',
    label: 'Price accuracy',
    question: 'Did the reported price match the shelf, receipt, or retailer source?',
    helper: 'Capture mismatched kronor, member-only conditions, deposits, and stale campaign prices.',
    lowLabel: 'Wrong price',
    highLabel: 'Price matched',
    trustReason: 'Keeps crowdsourced grocery data becomes more trustworthy by separating verified price evidence from noisy reports.'
  },
  {
    id: 'product_quality',
    label: 'Product quality',
    question: 'Was the product quality consistent with what shoppers should expect?',
    helper: 'Use this for produce condition, best-before windows, damaged packaging, and misleading product content.',
    lowLabel: 'Poor quality',
    highLabel: 'Great quality',
    trustReason: 'Keeps quality feedback comparable across products instead of relying only on free-form comments.'
  },
  {
    id: 'store_experience',
    label: 'Store experience',
    question: 'Did the store experience support the reported price and product condition?',
    helper: 'Note shelf availability, checkout price differences, substitution handling, and staff-confirmed corrections.',
    lowLabel: 'Poor experience',
    highLabel: 'Great experience',
    trustReason: 'Connects community reports to branch-level shopping context without inventing price evidence.'
  }
];

export const COMMUNITY_REVIEW_PROMPT_COPY = {
  title: 'Review this grocery product',
  intro: 'Structured price accuracy, product quality, and store experience prompts make community product reviews comparable alongside free-form notes.',
  guardrail: 'Prompts collect shopper experience signals only; they do not fabricate price evidence or replace protected moderation decisions.'
} as const;

export const DEFAULT_COMMUNITY_REVIEW_PROMPT_RESPONSES: CommunityReviewPromptResponse[] = COMMUNITY_REVIEW_PROMPTS.map((prompt) => ({
  promptId: prompt.id,
  rating: 4,
  note: ''
}));

export function communityReviewPromptFor(metric: CommunityReviewPromptMetric) {
  return COMMUNITY_REVIEW_PROMPTS.find((prompt) => prompt.id === metric) ?? COMMUNITY_REVIEW_PROMPTS[0]!;
}

export function communityReviewSummaryForProduct(productName: string): CommunityProductReviewSummary | null {
  return communityProductReviewSummaries.find((summary) => summary.productMatcher.test(productName)) ?? null;
}
