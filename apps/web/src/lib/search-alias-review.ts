export const searchAliasRejectionReasons = [
  { id: 'bad_query', label: 'Bad query' },
  { id: 'wrong_product', label: 'Wrong product' },
  { id: 'duplicate_alias', label: 'Duplicate alias' },
  { id: 'insufficient_confidence', label: 'Insufficient confidence' }
] as const;

export type SearchAliasRejectionReasonId = (typeof searchAliasRejectionReasons)[number]['id'];

export type SearchAliasReviewCandidate = {
  id: string;
  query: string;
  suggestedAlias: string;
  locale: 'sv-SE';
  confidence: number;
  reason: string;
};

const swedishAliasReviewSeeds = [
  { query: 'zogas', suggestedAlias: 'Zoégas coffee', confidence: 0.91, reason: 'Common missing-accent brand query' },
  { query: 'mjolk', suggestedAlias: 'mjölk', confidence: 0.88, reason: 'Swedish vowel typed without diacritic' },
  { query: 'agg', suggestedAlias: 'ägg', confidence: 0.86, reason: 'Swedish vowel typed without diacritic' },
  { query: 'kyck', suggestedAlias: 'kyckling', confidence: 0.82, reason: 'Short local synonym for chicken' }
];

export function buildSearchAliasReviewCandidates(limit = 4): SearchAliasReviewCandidate[] {
  return swedishAliasReviewSeeds.slice(0, limit).map((seed) => ({
    id: `alias-review-${seed.query}`,
    locale: 'sv-SE',
    ...seed
  }));
}

export function buildSearchAliasRejection(candidateId: string, reason: SearchAliasRejectionReasonId) {
  return {
    candidateId,
    status: 'rejected',
    rejectionReason: reason
  } as const;
}
