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


export type CommunityReviewPromptMetric = 'taste' | 'freshness' | 'package_size' | 'substitution_quality';

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
    id: 'taste',
    label: 'Taste',
    question: 'How did the product taste compared with what shoppers should expect?',
    helper: 'Capture flavor, texture, aftertaste, and whether the review describes the actual product experience.',
    lowLabel: 'Poor taste',
    highLabel: 'Great taste',
    trustReason: 'Makes subjective taste feedback comparable across products instead of relying only on free-form comments.'
  },
  {
    id: 'freshness',
    label: 'Freshness',
    question: 'How fresh was the product at purchase or delivery time?',
    helper: 'Use this for produce condition, best-before window, packaging damage, and shelf-life concerns.',
    lowLabel: 'Not fresh',
    highLabel: 'Very fresh',
    trustReason: 'Separates cheap stale items from trustworthy grocery deals.'
  },
  {
    id: 'package_size',
    label: 'Package size',
    question: 'Did the package size and unit match the listing or shelf label?',
    helper: 'Note mismatched grams, liters, multipacks, shrinkflation, or unclear unit-price comparisons.',
    lowLabel: 'Size mismatch',
    highLabel: 'Size matched',
    trustReason: 'Keeps price-per-unit comparisons grounded in the package shoppers actually bought.'
  },
  {
    id: 'substitution_quality',
    label: 'Substitution quality',
    question: 'If the item was substituted, how close was the replacement?',
    helper: 'Rate brand, size, dietary fit, price, and whether the substitute still satisfied the grocery need.',
    lowLabel: 'Bad substitute',
    highLabel: 'Great substitute',
    trustReason: 'Helps compare retailer substitutions without mixing them into the original product rating.'
  }
];

export const COMMUNITY_REVIEW_PROMPT_COPY = {
  title: 'Review this grocery product',
  intro: 'Structured taste, freshness, package-size, and substitution prompts make community product reviews comparable alongside free-form notes.',
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

export const communityReviewPromptMetricAliases = ['price_accuracy'];
