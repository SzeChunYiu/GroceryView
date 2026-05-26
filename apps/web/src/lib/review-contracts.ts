// Client-safe review/source-discrepancy contracts.
//
// These are pure static literals with no server-only dependencies. They live in
// their own module (rather than verified-data.ts) so client components can import
// them without dragging in the @groceryview/db barrel, which pulls node:crypto into
// the browser bundle and fails the webpack build (UnhandledSchemeError).
export const sourceDiscrepancyReportOptions = [
  { id: 'wrong_price', label: 'Wrong price', reviewerHint: 'Compare shopper evidence with the latest raw price row before approving.' },
  { id: 'wrong_unit', label: 'Wrong unit', reviewerHint: 'Check package text, normalized unit, and unit-price conversion.' },
  { id: 'missing_image', label: 'Missing image', reviewerHint: 'Confirm the source image URL is absent or broken before requesting a refresh.' },
  { id: 'unavailable_product', label: 'Unavailable product', reviewerHint: 'Verify store availability or stale catalogue rows before hiding the item.' }
] as const;

export const storeProductStockFreshnessExamples = [
  {
    productId: 'demo-live-stock',
    storeId: 'willys',
    availability: 'live',
    observedAt: '2026-05-25T08:00:00.000Z',
    source: 'retailer store feed'
  },
  {
    productId: 'demo-stale-stock',
    storeId: 'hemkop',
    availability: 'stale',
    observedAt: '2026-05-12T08:00:00.000Z',
    source: 'retailer store feed'
  },
  {
    productId: 'demo-inferred-stock',
    storeId: 'willys',
    availability: 'inferred',
    observedAt: null,
    source: 'priced row without stock field'
  },
  {
    productId: 'demo-unavailable-stock',
    storeId: 'hemkop',
    availability: 'unavailable',
    observedAt: '2026-05-25T08:00:00.000Z',
    source: 'retailer store feed'
  }
] as const;

export const sourceDiscrepancyReviewContract = {
  protectedEndpoint: '/api/source-discrepancies',
  subjectType: 'source_discrepancy_report',
  queue: 'human_review_assignments',
  guardrails: [
    'Reports are attached to productId and storeId so reviewers can trace the exact product row.',
    'Wrong price, wrong unit, missing image, and unavailable product reports enter human review before verified data changes.',
    'Approvals create source QA follow-up instead of directly mutating source prices.'
  ]
};
