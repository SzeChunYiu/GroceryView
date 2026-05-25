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
