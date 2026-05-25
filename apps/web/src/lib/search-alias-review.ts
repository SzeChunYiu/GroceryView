export const searchAliasRejectionReasons = [
  { id: 'bad_query', label: 'Bad query' },
  { id: 'wrong_product', label: 'Wrong product' },
  { id: 'duplicate_alias', label: 'Duplicate alias' },
  { id: 'insufficient_confidence', label: 'Insufficient confidence' }
] as const;

export type SearchAliasRejectionReasonId = (typeof searchAliasRejectionReasons)[number]['id'];

export const searchAliasReviewRankingSignals = [
  { id: 'weighted_alias', label: 'Weighted alias boost' },
  { id: 'fuzzy_token', label: 'Typo-tolerant token match' },
  { id: 'accent_folded', label: 'Accent-folded Swedish spelling' }
] as const;

export type SearchAliasReviewRankingSignalId = (typeof searchAliasReviewRankingSignals)[number]['id'];

export function searchAliasWeightLabel(weight: number) {
  if (weight >= 1.15) return 'strong alias boost';
  if (weight >= 0.9) return 'standard alias boost';
  return 'fuzzy fallback boost';
}

export function buildSearchAliasRejection(candidateId: string, reason: SearchAliasRejectionReasonId) {
  return {
    candidateId,
    status: 'rejected',
    rejectionReason: reason
  } as const;
}
