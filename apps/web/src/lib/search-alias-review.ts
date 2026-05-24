import { adaptiveProductCards } from '@/lib/verified-data';

export type PendingSearchAliasReview = {
  candidateProducts: Array<{ confidence: number; productName: string; productSlug: string }>;
  freshnessLabel: string;
  id: string;
  normalizedQuery: string;
  query: string;
  source: 'faceted-search:no-result';
  submittedAt: string;
};

const candidatePool = adaptiveProductCards.slice(0, 8).map((product, index) => ({
  confidence: Math.max(0.52, 0.86 - index * 0.04),
  productName: product.name,
  productSlug: product.slug
}));

export const pendingSearchAliasReviews: PendingSearchAliasReview[] = [
  {
    id: 'search-alias-glutenfri-toast',
    query: 'glutenfri toast brod',
    normalizedQuery: 'glutenfri toast brod',
    source: 'faceted-search:no-result',
    submittedAt: '2026-05-20T12:30:00.000Z',
    freshnessLabel: 'captured from faceted-search no-result telemetry in the current generated snapshot',
    candidateProducts: candidatePool.slice(0, 4)
  },
  {
    id: 'search-alias-kaffe-mellanrost',
    query: 'mellanrost kaffe billigt',
    normalizedQuery: 'mellanrost kaffe billigt',
    source: 'faceted-search:no-result',
    submittedAt: '2026-05-20T13:15:00.000Z',
    freshnessLabel: 'waiting for reviewer endpoint before alias writeback',
    candidateProducts: candidatePool.slice(2, 6)
  }
];

export const searchAliasReviewContract = {
  endpointDependency: '/api/admin/search-aliases/pending',
  approveAction: 'approve_pending_search_alias',
  source: 'faceted-search:no-result',
  guardrails: [
    'UI-only until the reviewer endpoint is available.',
    'Reviewer must select an existing GroceryView product match before approval.',
    'Confidence and freshness metadata stay visible next to every pending alias.'
  ]
};
