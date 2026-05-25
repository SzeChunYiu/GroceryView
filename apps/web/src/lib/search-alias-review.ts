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

const noResultCategoryShortcuts = [
  { label: 'Dairy & lactose-free', href: '/products?category=mejeri-ost-och-agg' },
  { label: 'Fruit & vegetables', href: '/products?category=frukt-och-gront' },
  { label: 'Pantry staples', href: '/products?category=skafferi' },
  { label: 'Coffee & drinks', href: '/products?category=dryck' }
];

const correctionHints = [
  { match: 'mjolk', correction: 'mjölk' },
  { match: 'yogurt', correction: 'yoghurt' },
  { match: 'kaffe', correction: 'kaffe' },
  { match: 'havre', correction: 'havregryn' },
  { match: 'agg', correction: 'ägg' }
];

export function buildNoResultCorrectionWorkflow(query: string) {
  const normalizedQuery = query.trim();
  const lowerQuery = normalizedQuery.toLocaleLowerCase('sv-SE');
  const suggestedCorrections = correctionHints
    .filter((hint) => lowerQuery.includes(hint.match) && hint.correction !== lowerQuery)
    .map((hint) => hint.correction);

  return {
    query: normalizedQuery,
    suggestedCorrections: [...new Set(suggestedCorrections)],
    aliasSubmissionHref: `/admin/search-aliases?candidate=${encodeURIComponent(normalizedQuery)}`,
    categoryShortcuts: noResultCategoryShortcuts
  };
}
