import { NextResponse } from 'next/server';

import {
  applyCommunityReviewVote,
  defaultCommunityPriceReviews,
  sortCommunityReviewsByTrust,
  type CommunityPriceReview,
  type CommunityReviewVote
} from '@/lib/reviews';

let communityReviews: CommunityPriceReview[] = sortCommunityReviewsByTrust(defaultCommunityPriceReviews);

function isCommunityReviewVote(value: unknown): value is CommunityReviewVote {
  return value === 'upvote' || value === 'downvote';
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { reviewId?: unknown; vote?: unknown } | null;
  const reviewId = typeof body?.reviewId === 'string' ? body.reviewId : '';
  const vote = body?.vote;

  if (!reviewId || !isCommunityReviewVote(vote)) {
    return NextResponse.json({ error: 'reviewId and vote are required.' }, { status: 400 });
  }

  if (!communityReviews.some((review) => review.id === reviewId)) {
    return NextResponse.json({ error: 'Review not found.' }, { status: 404 });
  }

  communityReviews = applyCommunityReviewVote(communityReviews, reviewId, vote);
  return NextResponse.json({
    review: communityReviews.find((review) => review.id === reviewId),
    reviews: communityReviews
  });
}
