import { scoreSearchAliasMatch, trigramSimilarity } from './search-suggest';

export const searchAliasRejectionReasons = [
  { id: 'bad_query', label: 'Bad query' },
  { id: 'wrong_product', label: 'Wrong product' },
  { id: 'duplicate_alias', label: 'Duplicate alias' },
  { id: 'insufficient_confidence', label: 'Insufficient confidence' }
] as const;

export type SearchAliasRejectionReasonId = (typeof searchAliasRejectionReasons)[number]['id'];

export function buildSearchAliasRejection(candidateId: string, reason: SearchAliasRejectionReasonId) {
  return {
    candidateId,
    status: 'rejected',
    rejectionReason: reason
  } as const;
}

export type SearchAliasReviewCandidate = {
  candidateId: string;
  query: string;
  productName: string;
  brand?: string | null;
  suggestedAlias?: string;
};

export function buildSearchAliasReview(candidate: SearchAliasReviewCandidate) {
  const aliasScore = candidate.suggestedAlias ? scoreSearchAliasMatch(candidate.query, candidate.suggestedAlias) : 0;
  const productScore = trigramSimilarity(candidate.query, candidate.productName);
  const brandScore = candidate.brand ? trigramSimilarity(candidate.query, candidate.brand) : 0;
  const confidence = Math.max(aliasScore, productScore, brandScore);

  return {
    candidateId: candidate.candidateId,
    status: 'pending',
    query: candidate.query,
    productName: candidate.productName,
    brand: candidate.brand ?? null,
    suggestedAlias: candidate.suggestedAlias ?? null,
    confidence,
    scoring: {
      aliasScore,
      productScore,
      brandScore
    }
  } as const;
}
