export type SearchAliasRejectionReason = 'bad_query' | 'wrong_product' | 'duplicate_alias' | 'insufficient_confidence';

export type SearchAliasReviewCandidate = {
  id: string;
  query: string;
  suggestedAlias: string;
  matchedProductName: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
};

export const searchAliasRejectionReasons: Array<{ value: SearchAliasRejectionReason; label: string; helperText: string }> = [
  {
    value: 'bad_query',
    label: 'Bad query',
    helperText: 'The submitted no-result query is misspelled, too vague, or not grocery related.',
  },
  {
    value: 'wrong_product',
    label: 'Wrong product',
    helperText: 'The proposed alias points shoppers to a different product than the query intent.',
  },
  {
    value: 'duplicate_alias',
    label: 'Duplicate alias',
    helperText: 'An equivalent alias already exists and should be reused instead of creating another row.',
  },
  {
    value: 'insufficient_confidence',
    label: 'Insufficient confidence',
    helperText: 'The matcher evidence is too weak to safely improve search matching without more data.',
  },
];

export const searchAliasReviewQueue: SearchAliasReviewCandidate[] = [
  {
    id: 'alias-review-001',
    query: 'arla mellan mjolk',
    suggestedAlias: 'Arla Mellanmjölk 1L',
    matchedProductName: 'Arla Ko Mellanmjölk 1L',
    confidence: 0.91,
    status: 'pending',
  },
  {
    id: 'alias-review-002',
    query: 'kaffe skane gul',
    suggestedAlias: 'Zoégas Skåne 450g',
    matchedProductName: 'Zoégas Skåne Mellanrost 450g',
    confidence: 0.74,
    status: 'pending',
  },
  {
    id: 'alias-review-003',
    query: 'banan eko 1kg',
    suggestedAlias: 'Ekologiska bananer',
    matchedProductName: 'Änglamark Bananer Ekologiska',
    confidence: 0.66,
    status: 'pending',
  },
];

export function rejectionReasonForValue(value: SearchAliasRejectionReason) {
  return searchAliasRejectionReasons.find((reason) => reason.value === value);
}

export function buildRejectedSearchAliasReview(candidate: SearchAliasReviewCandidate, rejectionReason: SearchAliasRejectionReason) {
  return {
    ...candidate,
    status: 'rejected' as const,
    rejectionReason,
    rejectionReasonLabel: rejectionReasonForValue(rejectionReason)?.label ?? rejectionReason,
  };
}
