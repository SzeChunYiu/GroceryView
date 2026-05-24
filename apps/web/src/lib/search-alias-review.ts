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
