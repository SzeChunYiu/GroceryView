export type CommunityReviewVote = 'upvote' | 'downvote';
export type CommunityReportModerationStatus = 'active' | 'reported' | 'under_review' | 'dismissed';

export type CommunityPriceReview = {
  body: string;
  downvotes: number;
  id: string;
  lastReportReason?: string;
  moderationStatus?: CommunityReportModerationStatus;
  priceLabel: string;
  productName: string;
  reportCount?: number;
  reviewerLabel: string;
  storeName: string;
  submittedAt: string;
  upvotes: number;
};

export const defaultCommunityPriceReviews: CommunityPriceReview[] = [
  {
    body: 'Shelf label matched the receipt total and the package size was visible.',
    downvotes: 1,
    id: 'review-coffee-willys-verified',
    priceLabel: '49.90 SEK',
    productName: 'Zoégas Coffee 450g',
    reviewerLabel: 'Verified shopper',
    storeName: 'Willys Odenplan',
    submittedAt: '2026-05-19T10:30:00.000Z',
    upvotes: 9
  },
  {
    body: 'Promo looked member-only, so double-check before using it for public basket totals.',
    downvotes: 0,
    id: 'review-milk-lidl-member-note',
    priceLabel: '13.90 SEK',
    productName: 'Milk 1L',
    reviewerLabel: 'Community reviewer',
    storeName: 'Lidl Sveavägen',
    submittedAt: '2026-05-18T15:45:00.000Z',
    upvotes: 4
  },
  {
    body: 'Could not confirm whether the fruit price was per kilo or per package.',
    downvotes: 3,
    id: 'review-fruit-unit-unclear',
    lastReportReason: 'Unit price evidence is unclear and needs a moderator check before reuse.',
    moderationStatus: 'under_review',
    priceLabel: '24.90 SEK',
    productName: 'Fresh fruit basket',
    reportCount: 2,
    reviewerLabel: 'New contributor',
    storeName: 'Hemköp City',
    submittedAt: '2026-05-17T12:00:00.000Z',
    upvotes: 1
  }
];

export function communityReviewTrustScore(review: Pick<CommunityPriceReview, 'downvotes' | 'upvotes'>): number {
  return review.upvotes - review.downvotes;
}

export function sortCommunityReviewsByTrust(reviews: CommunityPriceReview[]): CommunityPriceReview[] {
  return [...reviews].sort((left, right) => {
    const trustDelta = communityReviewTrustScore(right) - communityReviewTrustScore(left);
    if (trustDelta !== 0) return trustDelta;
    const upvoteDelta = right.upvotes - left.upvotes;
    if (upvoteDelta !== 0) return upvoteDelta;
    return Date.parse(right.submittedAt) - Date.parse(left.submittedAt);
  });
}

export function applyCommunityReviewVote(
  reviews: CommunityPriceReview[],
  reviewId: string,
  vote: CommunityReviewVote
): CommunityPriceReview[] {
  return sortCommunityReviewsByTrust(reviews.map((review) => {
    if (review.id !== reviewId) return review;
    return vote === 'upvote'
      ? { ...review, upvotes: review.upvotes + 1 }
      : { ...review, downvotes: review.downvotes + 1 };
  }));
}

export function reportCommunityPriceReview(
  reviews: CommunityPriceReview[],
  reviewId: string,
  reason: string
): CommunityPriceReview[] {
  return sortCommunityReviewsByTrust(reviews.map((review) => {
    if (review.id !== reviewId) return review;
    const reportCount = (review.reportCount ?? 0) + 1;
    return {
      ...review,
      lastReportReason: reason,
      moderationStatus: reportCount >= 2 ? 'under_review' : 'reported',
      reportCount
    };
  }));
}

export function moderationStatusLabel(status: CommunityReportModerationStatus | undefined): string {
  if (status === 'under_review') return 'Under moderator review';
  if (status === 'reported') return 'Reported by community';
  if (status === 'dismissed') return 'Report dismissed';
  return 'Active';
}

export const suspiciousCommunityPriceReports = defaultCommunityPriceReviews.filter((review) =>
  (review.moderationStatus === 'reported' || review.moderationStatus === 'under_review') || (review.reportCount ?? 0) > 0
);
