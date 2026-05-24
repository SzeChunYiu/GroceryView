export type CommunityReview = {
  content: string;
  hasPhotoEvidence: boolean;
  id: string;
  productName: string;
  reportCount: number;
  reviewerTrustScore: number;
  submittedAt: string;
  verifiedPurchase: boolean;
};

export type ModerationRiskBand = 'low' | 'medium' | 'high';

export type ModerationScoredReview = CommunityReview & {
  confidenceScore: number;
  moderationReasons: string[];
  priorityRank: number;
  riskBand: ModerationRiskBand;
  riskScore: number;
};

const riskyTerms = ['scam', 'fake', 'fraud', 'hate', 'unsafe', 'poison'];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function riskBandFor(score: number): ModerationRiskBand {
  if (score >= 70) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

export function scoreReviewModerationConfidence(review: CommunityReview): ModerationScoredReview {
  const text = review.content.toLocaleLowerCase('sv-SE');
  const matchedTerms = riskyTerms.filter((term) => text.includes(term));
  const moderationReasons = [
    ...matchedTerms.map((term) => `matched risky term: ${term}`),
    ...(review.reportCount > 0 ? [`${review.reportCount} community report(s)`] : []),
    ...(review.hasPhotoEvidence ? ['photo evidence present'] : ['missing photo evidence']),
    ...(review.verifiedPurchase ? ['verified purchase'] : ['unverified purchase'])
  ];
  const evidenceDiscount = (review.hasPhotoEvidence ? 12 : 0) + (review.verifiedPurchase ? 10 : 0) + Math.round(review.reviewerTrustScore * 15);
  const riskScore = clamp((matchedTerms.length * 24) + (review.reportCount * 16) + (review.content.length < 30 ? 12 : 0) - evidenceDiscount, 0, 100);
  const confidenceScore = clamp(100 - riskScore + Math.round(review.reviewerTrustScore * 10), 0, 100);

  return {
    ...review,
    confidenceScore,
    moderationReasons,
    priorityRank: riskScore * 10 + review.reportCount,
    riskBand: riskBandFor(riskScore),
    riskScore
  };
}

export function prioritizeModerationQueue(reviews: CommunityReview[]): ModerationScoredReview[] {
  return reviews
    .map(scoreReviewModerationConfidence)
    .sort((left, right) => right.priorityRank - left.priorityRank || left.submittedAt.localeCompare(right.submittedAt));
}

export const communityReviewModerationQueue: CommunityReview[] = [
  {
    id: 'review-risky-claim-001',
    productName: 'Havregryn Extra Fylliga',
    content: 'This shelf price is fake and unsafe compared with the receipt I saw.',
    hasPhotoEvidence: false,
    reportCount: 3,
    reviewerTrustScore: 0.3,
    submittedAt: '2026-05-20T08:30:00.000Z',
    verifiedPurchase: false
  },
  {
    id: 'review-photo-evidence-002',
    productName: 'Kaffe',
    content: 'Matched shelf label and receipt price, both show the same SEK total.',
    hasPhotoEvidence: true,
    reportCount: 0,
    reviewerTrustScore: 0.82,
    submittedAt: '2026-05-20T09:10:00.000Z',
    verifiedPurchase: true
  },
  {
    id: 'review-short-text-003',
    productName: 'Fresh fruit',
    content: 'Wrong price.',
    hasPhotoEvidence: false,
    reportCount: 1,
    reviewerTrustScore: 0.55,
    submittedAt: '2026-05-20T10:00:00.000Z',
    verifiedPurchase: false
  }
];

export const prioritizedModerationQueue = prioritizeModerationQueue(communityReviewModerationQueue);
