export const searchAliasRejectionReasons = [
  {
    id: 'bad_query',
    label: 'Bad query',
    detail: 'The submitted alias is misspelled, too broad, or not useful as a grocery search query.'
  },
  {
    id: 'wrong_product',
    label: 'Wrong product',
    detail: 'The alias points reviewers to a product that does not match the shopper intent.'
  },
  {
    id: 'duplicate_alias',
    label: 'Duplicate alias',
    detail: 'The same alias is already covered by another accepted search mapping.'
  },
  {
    id: 'insufficient_confidence',
    label: 'Insufficient confidence',
    detail: 'The candidate does not have enough evidence to safely improve search matching.'
  }
] as const;

export type SearchAliasRejectionReason = (typeof searchAliasRejectionReasons)[number]['id'];
export type SearchAliasReviewDecision = 'accept' | 'reject';

export interface SearchAliasCandidate {
  id: string;
  query: string;
  suggestedAlias: string;
  productName: string;
  confidence: number;
  evidence: string;
}

export interface SearchAliasReviewResult {
  candidateId: string;
  decision: SearchAliasReviewDecision;
  rejectionReason?: SearchAliasRejectionReason;
}

export const searchAliasReviewCandidates: SearchAliasCandidate[] = [
  {
    id: 'alias-ica-oat-milk',
    query: 'havremjolk barista',
    suggestedAlias: 'havremjölk barista',
    productName: 'Oatly iKaffe 1l',
    confidence: 0.82,
    evidence: 'Repeated no-result query with close normalized match to verified product title.'
  },
  {
    id: 'alias-tomato-crush',
    query: 'krossad tomat eko',
    suggestedAlias: 'krossade tomater ekologisk',
    productName: 'Garant Ekologiska Krossade Tomater',
    confidence: 0.68,
    evidence: 'One recent no-result query plus category and brand token overlap.'
  }
];

export function rejectionReasonLabelFor(reason: SearchAliasRejectionReason) {
  return searchAliasRejectionReasons.find((option) => option.id === reason)?.label ?? 'Unknown rejection reason';
}

export function buildSearchAliasReviewResult(
  candidateId: string,
  decision: SearchAliasReviewDecision,
  rejectionReason?: SearchAliasRejectionReason,
): SearchAliasReviewResult {
  if (decision === 'reject' && !rejectionReason) {
    return { candidateId, decision, rejectionReason: 'insufficient_confidence' };
  }

  return decision === 'reject'
    ? { candidateId, decision, rejectionReason }
    : { candidateId, decision };
}
