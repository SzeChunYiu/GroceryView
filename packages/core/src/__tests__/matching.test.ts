import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyHumanReviewDecision,
  authorizeHumanReviewAction,
  classifyProductMatch,
  compareCommodityUnitPrices,
  planCommunityReportAbuseControls,
  planStockoutSubstitutionOptions,
  planHumanReviewAssignments,
  planHumanReviewQueue,
  recommendSmartSwaps,
  summarizeHumanReviewSla
} from '../index.js';

describe('classifyProductMatch', () => {
  it('detects exact matches by barcode and size', () => {
    const match = classifyProductMatch({
      source: { id: 'barilla-500', barcode: '123', brand: 'Barilla', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'national' },
      candidate: { id: 'barilla-500-willys', barcode: '123', brand: 'Barilla', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'national' }
    });

    assert.deepEqual(match, { mode: 'exact', confidence: 'high', qualityRisk: 'low', reason: 'Barcode and package size match.' });
  });

  it('detects equivalent category matches with medium confidence when barcode differs', () => {
    const match = classifyProductMatch({
      source: { id: 'spaghetti-a', brand: 'Barilla', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'national' },
      candidate: { id: 'spaghetti-b', brand: 'Garant', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'standard_private_label' }
    });

    assert.deepEqual(match, { mode: 'equivalent', confidence: 'high', qualityRisk: 'low', reason: 'Same category and comparable package size.' });
  });

  it('blocks smart substitution for do-not-auto-substitute categories', () => {
    const match = classifyProductMatch({
      source: { id: 'formula-a', brand: 'A', category: 'baby_formula', packageSize: 1, packageUnit: 'piece', brandTier: 'national' },
      candidate: { id: 'formula-b', brand: 'B', category: 'baby_formula', packageSize: 1, packageUnit: 'piece', brandTier: 'standard_private_label' }
    });

    assert.equal(match.mode, 'not_recommended');
    assert.equal(match.qualityRisk, 'high');
  });
});

describe('recommendSmartSwaps', () => {
  it('recommends private-label swaps only when savings and user preference allow it', () => {
    const swaps = recommendSmartSwaps({
      source: { id: 'barilla-500', brand: 'Barilla', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'national', unitPrice: 28 },
      candidates: [
        { id: 'garant-500', brand: 'Garant', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'standard_private_label', unitPrice: 20 },
        { id: 'premium-500', brand: 'Premium', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'premium', unitPrice: 32 }
      ],
      acceptPrivateLabel: 'yes',
      minimumSavingsPercent: 10
    });

    assert.deepEqual(swaps.map((swap) => ({ productId: swap.productId, savingsPercent: swap.savingsPercent, confidence: swap.confidence })), [
      { productId: 'garant-500', savingsPercent: 28.57, confidence: 'high' }
    ]);
  });

  it('honors accepted private-label tiers and blocked categories', () => {
    const swaps = recommendSmartSwaps({
      source: { id: 'barilla-500', brand: 'Barilla', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'national', unitPrice: 28 },
      candidates: [
        { id: 'garant-500', brand: 'Garant', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'standard_private_label', unitPrice: 20 },
        { id: 'budget-500', brand: 'Budget', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'budget_private_label', unitPrice: 15 }
      ],
      acceptPrivateLabel: 'yes',
      minimumSavingsPercent: 10,
      privateLabelPreference: {
        acceptedTiers: ['standard_private_label'],
        blockedCategories: []
      }
    });

    assert.deepEqual(swaps.map((swap) => swap.productId), ['garant-500']);

    const blocked = recommendSmartSwaps({
      source: { id: 'barilla-500', brand: 'Barilla', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'national', unitPrice: 28 },
      candidates: [
        { id: 'garant-500', brand: 'Garant', category: 'pasta', packageSize: 500, packageUnit: 'g', brandTier: 'standard_private_label', unitPrice: 20 }
      ],
      acceptPrivateLabel: 'yes',
      minimumSavingsPercent: 10,
      privateLabelPreference: {
        acceptedTiers: ['standard_private_label'],
        blockedCategories: ['pasta']
      }
    });

    assert.deepEqual(blocked, []);
  });
});

describe('planStockoutSubstitutionOptions', () => {
  it('offers verified in-stock substitutes for missing basket lines without auto-accepting them', () => {
    const plan = planStockoutSubstitutionOptions({
      basketLine: {
        basketLineId: 'line:milk',
        productId: 'arla-milk',
        productName: 'Arla Mellanmjölk 1l',
        category: 'milk',
        packageSize: 1,
        packageUnit: 'l',
        brandTier: 'national',
        unitPrice: 16.9,
        requestedQuantity: 2,
        status: 'out_of_stock'
      },
      acceptableSubstitutionPolicy: {
        allowPrivateLabel: true,
        minimumConfidence: 'medium',
        maxUnitPriceIncreasePercent: 10,
        blockedCategories: ['baby_formula'],
        dietaryTagsRequired: ['lactose_free']
      },
      candidates: [
        {
          productId: 'garant-lactose-free-milk',
          productName: 'Garant Laktosfri Mellanmjölk 1l',
          category: 'milk',
          packageSize: 1,
          packageUnit: 'l',
          brandTier: 'standard_private_label',
          unitPrice: 15.9,
          inStock: true,
          source: 'willys-storefront',
          observedAt: '2026-05-22T08:00:00.000Z',
          dietaryTags: ['lactose_free']
        },
        {
          productId: 'cheap-unknown-milk',
          productName: 'Unknown milk 1l',
          category: 'milk',
          packageSize: 1,
          packageUnit: 'l',
          brandTier: 'budget_private_label',
          unitPrice: 12.9,
          inStock: false,
          source: 'stale-cache',
          observedAt: '2026-05-20T08:00:00.000Z',
          dietaryTags: ['lactose_free']
        },
        {
          productId: 'regular-milk',
          productName: 'Regular milk 1l',
          category: 'milk',
          packageSize: 1,
          packageUnit: 'l',
          brandTier: 'national',
          unitPrice: 14.9,
          inStock: true,
          source: 'coop-storefront',
          observedAt: '2026-05-22T08:00:00.000Z',
          dietaryTags: []
        }
      ]
    });

    assert.equal(plan.status, 'substitution_options');
    assert.equal(plan.lineStatus, 'out_of_stock');
    assert.deepEqual(plan.options.map((option) => ({
      productId: option.productId,
      replacementAccepted: option.replacementAccepted,
      confidence: option.confidence,
      priceDeltaPercent: option.priceDeltaPercent
    })), [
      {
        productId: 'garant-lactose-free-milk',
        replacementAccepted: false,
        confidence: 'high',
        priceDeltaPercent: -5.92
      }
    ]);
    assert.deepEqual(plan.rejectedCandidates.map((candidate) => candidate.reason), [
      'Candidate is not verified in stock.',
      'Candidate is missing required dietary evidence: lactose_free.'
    ]);
    assert.match(plan.guardrails.join(' '), /never auto-accepted/i);
  });

  it('fails closed when the basket line is already available or no verified substitute clears policy', () => {
    const available = planStockoutSubstitutionOptions({
      basketLine: {
        basketLineId: 'line:pasta',
        productId: 'pasta',
        productName: 'Pasta',
        category: 'pasta',
        packageSize: 500,
        packageUnit: 'g',
        brandTier: 'national',
        unitPrice: 20,
        requestedQuantity: 1,
        status: 'available'
      },
      candidates: []
    });

    assert.equal(available.status, 'not_needed');

    const blocked = planStockoutSubstitutionOptions({
      basketLine: {
        basketLineId: 'line:formula',
        productId: 'formula-a',
        productName: 'Baby formula',
        category: 'baby_formula',
        packageSize: 1,
        packageUnit: 'piece',
        brandTier: 'national',
        unitPrice: 120,
        requestedQuantity: 1,
        status: 'out_of_stock'
      },
      candidates: [
        {
          productId: 'formula-b',
          productName: 'Other formula',
          category: 'baby_formula',
          packageSize: 1,
          packageUnit: 'piece',
          brandTier: 'national',
          unitPrice: 100,
          inStock: true,
          source: 'retailer',
          observedAt: '2026-05-22T08:00:00.000Z'
        }
      ]
    });

    assert.equal(blocked.status, 'blocked');
    assert.deepEqual(blocked.options, []);
    assert.equal(blocked.rejectedCandidates[0]?.reason, 'Category should not be auto-substituted.');
  });
});

describe('compareCommodityUnitPrices', () => {
  it('ranks confidence-cleared commodity prices by comparable unit and fails closed on non-matching evidence', () => {
    const comparison = compareCommodityUnitPrices({
      commodityId: 'tomato',
      commodityName: 'Tomat',
      comparableUnit: 'kg',
      minimumConfidence: 0.6,
      observations: [
        {
          productId: 'willys-kvisttomat',
          productName: 'Kvisttomat Klass 1',
          chainId: 'willys',
          chainName: 'Willys',
          commodityId: 'tomato',
          unitPrice: 34.9,
          comparableUnit: 'kg',
          sourceConfidence: 0.82,
          observedAt: '2026-05-21T09:00:00.000Z'
        },
        {
          productId: 'hemkop-kvisttomat',
          productName: 'Kvisttomat Klass 1',
          chainId: 'hemkop',
          chainName: 'Hemköp',
          commodityId: 'tomato',
          unitPrice: 39.9,
          comparableUnit: 'kg',
          sourceConfidence: 0.78,
          observedAt: '2026-05-21T09:00:00.000Z'
        },
        {
          productId: 'hemkop-premium-tomato',
          productName: 'Premium tomat',
          chainId: 'hemkop',
          chainName: 'Hemköp',
          commodityId: 'tomato',
          unitPrice: 43.6,
          comparableUnit: 'kg',
          sourceConfidence: 0.86,
          observedAt: '2026-05-21T09:00:00.000Z'
        },
        {
          productId: 'coop-tomato',
          productName: 'Tomat styck',
          chainId: 'coop',
          chainName: 'Coop',
          commodityId: 'tomato',
          unitPrice: 9.9,
          comparableUnit: 'st',
          sourceConfidence: 0.9,
          observedAt: '2026-05-21T09:00:00.000Z'
        },
        {
          productId: 'ica-tomato',
          productName: 'Tomat',
          chainId: 'ica',
          chainName: 'ICA',
          commodityId: 'tomato',
          unitPrice: 33.9,
          comparableUnit: 'kg',
          sourceConfidence: 0.3,
          observedAt: '2026-05-21T09:00:00.000Z'
        }
      ]
    });

    assert.equal(comparison.status, 'priced');
    assert.equal(comparison.cheapestChain?.chainId, 'willys');
    assert.equal(comparison.cheapestChain?.priceGapToNext, 5);
    assert.deepEqual(comparison.rows.map((row) => ({
      rank: row.rank,
      chainId: row.chainId,
      productId: row.productId,
      unitPrice: row.unitPrice,
      savingsVsNextPercent: row.savingsVsNextPercent
    })), [
      { rank: 1, chainId: 'willys', productId: 'willys-kvisttomat', unitPrice: 34.9, savingsVsNextPercent: 12.53 },
      { rank: 2, chainId: 'hemkop', productId: 'hemkop-kvisttomat', unitPrice: 39.9, savingsVsNextPercent: 0 }
    ]);
    assert.deepEqual(comparison.coverage, {
      chainCount: 2,
      observationCount: 3,
      rejectedObservationCount: 2,
      comparableUnit: 'kg'
    });
    assert.match(comparison.confidenceLabel, /2 chains/);
    assert.match(comparison.confidenceLabel, /commodity\/alias match/);
  });
});

describe('planHumanReviewQueue', () => {
  it('prioritizes low-confidence product matches and community reports for human review', () => {
    const queue = planHumanReviewQueue({
      productMatches: [
        { id: 'match-1', sourceProductId: 'tomato-a', candidateProductId: 'tomato-b', confidence: 'low', qualityRisk: 'high', reason: 'Produce sizes vary.' },
        { id: 'match-2', sourceProductId: 'pasta-a', candidateProductId: 'pasta-b', confidence: 'high', qualityRisk: 'low', reason: 'Barcode match.' }
      ],
      communityReports: [
        { id: 'report-1', productId: 'coffee', reporterId: 'user-1', reportType: 'wrong_price', confidenceScore: 0.4, createdAt: '2026-05-19T09:00:00.000Z' },
        { id: 'report-2', productId: 'milk', reporterId: 'user-2', reportType: 'missing_product', confidenceScore: 0.95, createdAt: '2026-05-19T08:00:00.000Z' }
      ]
    });

    assert.deepEqual(queue, [
      {
        id: 'review-match-1',
        subjectType: 'product_match',
        subjectId: 'match-1',
        priority: 'high',
        reason: 'Product match tomato-a → tomato-b has low confidence and high quality risk: Produce sizes vary.'
      },
      {
        id: 'review-report-1',
        subjectType: 'community_report',
        subjectId: 'report-1',
        priority: 'medium',
        reason: 'Community report wrong_price for coffee has low confidence score 0.4.'
      }
    ]);
  });
});


describe('applyHumanReviewDecision', () => {
  it('approves a product-match review with an auditable writeback action', () => {
    const result = applyHumanReviewDecision({
      item: {
        id: 'review-match-1',
        subjectType: 'product_match',
        subjectId: 'match-1',
        priority: 'high',
        reason: 'Product match tomato-a → tomato-b has low confidence and high quality risk: Produce sizes vary.'
      },
      decision: 'approve',
      reviewerId: 'moderator-1',
      decidedAt: '2026-05-19T12:00:00.000Z',
      notes: 'Package sizes verified from shelf photo.'
    });

    assert.deepEqual(result, {
      reviewId: 'review-match-1',
      subjectType: 'product_match',
      subjectId: 'match-1',
      status: 'approved',
      reviewerId: 'moderator-1',
      decidedAt: '2026-05-19T12:00:00.000Z',
      notes: 'Package sizes verified from shelf photo.',
      writeback: { action: 'approve_product_match', subjectId: 'match-1', reviewedByHuman: true }
    });
  });

  it('rejects community reports or keeps them in review with explicit operations actions', () => {
    const reportItem = {
      id: 'review-report-1',
      subjectType: 'community_report' as const,
      subjectId: 'report-1',
      priority: 'medium' as const,
      reason: 'Community report wrong_price for coffee has low confidence score 0.4.'
    };

    assert.deepEqual(
      applyHumanReviewDecision({
        item: reportItem,
        decision: 'reject',
        reviewerId: 'moderator-2',
        decidedAt: '2026-05-19T12:05:00.000Z'
      }).writeback,
      { action: 'dismiss_community_report', subjectId: 'report-1', reviewedByHuman: true }
    );

    assert.deepEqual(
      applyHumanReviewDecision({
        item: reportItem,
        decision: 'needs_more_info',
        reviewerId: 'moderator-2',
        decidedAt: '2026-05-19T12:10:00.000Z',
        notes: 'Ask reporter for shelf photo.'
      }).writeback,
      { action: 'keep_in_review', subjectId: 'report-1', reviewedByHuman: false }
    );
  });
});

describe('planHumanReviewAssignments', () => {
  it('assigns open review tasks to active moderators with SLA due dates', () => {
    const result = planHumanReviewAssignments({
      assignedAt: '2026-05-19T10:00:00.000Z',
      queue: [
        {
          id: 'review-match-1',
          subjectType: 'product_match',
          subjectId: 'match-1',
          priority: 'high',
          reason: 'Low-confidence produce match.'
        },
        {
          id: 'review-report-1',
          subjectType: 'community_report',
          subjectId: 'report-1',
          priority: 'medium',
          reason: 'Low-confidence community price report.'
        }
      ],
      reviewers: [
        { id: 'moderator-1', active: true, openAssignmentCount: 0, maxOpenAssignments: 1 },
        { id: 'moderator-2', active: true, openAssignmentCount: 1, maxOpenAssignments: 3, specialties: ['community_report'] },
        { id: 'moderator-paused', active: false, openAssignmentCount: 0, maxOpenAssignments: 5 }
      ]
    });

    assert.deepEqual(result.assignments, [
      {
        id: 'assignment-review-match-1-moderator-1',
        reviewId: 'review-match-1',
        subjectType: 'product_match',
        subjectId: 'match-1',
        priority: 'high',
        reason: 'Low-confidence produce match.',
        assigneeId: 'moderator-1',
        assignedAt: '2026-05-19T10:00:00.000Z',
        dueAt: '2026-05-19T14:00:00.000Z',
        status: 'assigned'
      },
      {
        id: 'assignment-review-report-1-moderator-2',
        reviewId: 'review-report-1',
        subjectType: 'community_report',
        subjectId: 'report-1',
        priority: 'medium',
        reason: 'Low-confidence community price report.',
        assigneeId: 'moderator-2',
        assignedAt: '2026-05-19T10:00:00.000Z',
        dueAt: '2026-05-20T10:00:00.000Z',
        status: 'assigned'
      }
    ]);
    assert.deepEqual(result.unassigned, []);
  });

  it('does not double-assign existing open tasks and reports capacity blockers', () => {
    const result = planHumanReviewAssignments({
      assignedAt: '2026-05-19T10:00:00.000Z',
      queue: [
        {
          id: 'review-match-1',
          subjectType: 'product_match',
          subjectId: 'match-1',
          priority: 'high',
          reason: 'Already assigned.'
        },
        {
          id: 'review-match-2',
          subjectType: 'product_match',
          subjectId: 'match-2',
          priority: 'low',
          reason: 'No remaining capacity.'
        }
      ],
      reviewers: [{ id: 'moderator-1', active: true, openAssignmentCount: 1, maxOpenAssignments: 1 }],
      existingAssignments: [
        {
          id: 'assignment-review-match-1-moderator-1',
          reviewId: 'review-match-1',
          subjectType: 'product_match',
          subjectId: 'match-1',
          priority: 'high',
          reason: 'Already assigned.',
          assigneeId: 'moderator-1',
          assignedAt: '2026-05-19T09:00:00.000Z',
          dueAt: '2026-05-19T13:00:00.000Z',
          status: 'assigned'
        }
      ]
    });

    assert.deepEqual(result.assignments, []);
    assert.deepEqual(result.unassigned, [
      { reviewId: 'review-match-1', reason: 'already_assigned' },
      { reviewId: 'review-match-2', reason: 'no_active_reviewer_capacity' }
    ]);
  });
});

describe('summarizeHumanReviewSla', () => {
  it('counts overdue and due-soon open assignments for operations dashboards', () => {
    const summary = summarizeHumanReviewSla({
      now: '2026-05-19T12:00:00.000Z',
      dueSoonHours: 2,
      assignments: [
        {
          id: 'assignment-review-match-1-moderator-1',
          reviewId: 'review-match-1',
          subjectType: 'product_match',
          subjectId: 'match-1',
          priority: 'high',
          reason: 'Overdue.',
          assigneeId: 'moderator-1',
          assignedAt: '2026-05-19T08:00:00.000Z',
          dueAt: '2026-05-19T11:00:00.000Z',
          status: 'assigned'
        },
        {
          id: 'assignment-review-report-1-moderator-2',
          reviewId: 'review-report-1',
          subjectType: 'community_report',
          subjectId: 'report-1',
          priority: 'medium',
          reason: 'Due soon.',
          assigneeId: 'moderator-2',
          assignedAt: '2026-05-19T10:00:00.000Z',
          dueAt: '2026-05-19T13:30:00.000Z',
          status: 'in_progress'
        },
        {
          id: 'assignment-review-match-3-moderator-3',
          reviewId: 'review-match-3',
          subjectType: 'product_match',
          subjectId: 'match-3',
          priority: 'low',
          reason: 'Completed work should not count.',
          assigneeId: 'moderator-3',
          assignedAt: '2026-05-18T10:00:00.000Z',
          dueAt: '2026-05-19T10:00:00.000Z',
          status: 'completed'
        }
      ]
    });

    assert.deepEqual(summary, {
      status: 'breached',
      openAssignments: 2,
      overdueAssignments: 1,
      dueSoonAssignments: 1,
      openByPriority: { high: 1, medium: 1, low: 0 },
      breachedReviewIds: ['review-match-1'],
      dueSoonReviewIds: ['review-report-1']
    });
  });

  it('reports healthy SLA status when open assignments are not near their due date', () => {
    const summary = summarizeHumanReviewSla({
      now: '2026-05-19T12:00:00.000Z',
      assignments: [
        {
          id: 'assignment-review-match-1-moderator-1',
          reviewId: 'review-match-1',
          subjectType: 'product_match',
          subjectId: 'match-1',
          priority: 'low',
          reason: 'Plenty of time left.',
          assigneeId: 'moderator-1',
          assignedAt: '2026-05-19T10:00:00.000Z',
          dueAt: '2026-05-21T12:00:00.000Z',
          status: 'assigned'
        }
      ]
    });

    assert.deepEqual(summary, {
      status: 'healthy',
      openAssignments: 1,
      overdueAssignments: 0,
      dueSoonAssignments: 0,
      openByPriority: { high: 0, medium: 0, low: 1 },
      breachedReviewIds: [],
      dueSoonReviewIds: []
    });
  });
});

describe('planCommunityReportAbuseControls', () => {
  it('plans moderation controls for bursty, low-trust, and healthy reporters', () => {
    const controls = planCommunityReportAbuseControls({
      reporters: [
        {
          reporterId: 'trusted-reporter',
          reportsLast24Hours: 3,
          pendingReports: 1,
          acceptedReportsLast30Days: 18,
          rejectedReportsLast30Days: 1
        },
        {
          reporterId: 'bursty-reporter',
          reportsLast24Hours: 27,
          pendingReports: 2,
          acceptedReportsLast30Days: 4,
          rejectedReportsLast30Days: 1
        },
        {
          reporterId: 'low-trust-reporter',
          reportsLast24Hours: 4,
          pendingReports: 1,
          acceptedReportsLast30Days: 1,
          rejectedReportsLast30Days: 12
        },
        {
          reporterId: 'backlogged-reporter',
          reportsLast24Hours: 5,
          pendingReports: 8,
          acceptedReportsLast30Days: 6,
          rejectedReportsLast30Days: 2
        }
      ]
    });

    assert.deepEqual(controls, [
      {
        reporterId: 'trusted-reporter',
        action: 'allow',
        reason: 'Reporter history is within trust limits.'
      },
      {
        reporterId: 'bursty-reporter',
        action: 'throttle',
        reason: 'Reporter exceeded 20 community reports in the last 24 hours.'
      },
      {
        reporterId: 'low-trust-reporter',
        action: 'suspend_reporting',
        reason: 'Reporter has high rejected-report volume and a low acceptance ratio.'
      },
      {
        reporterId: 'backlogged-reporter',
        action: 'require_manual_review',
        reason: 'Reporter has more than 5 unresolved community reports.'
      }
    ]);
  });

  it('uses caller-provided burst and pending thresholds', () => {
    const controls = planCommunityReportAbuseControls({
      maxReportsPer24Hours: 5,
      maxPendingReports: 2,
      reporters: [
        {
          reporterId: 'custom-burst',
          reportsLast24Hours: 6,
          pendingReports: 0,
          acceptedReportsLast30Days: 2,
          rejectedReportsLast30Days: 0
        },
        {
          reporterId: 'custom-pending',
          reportsLast24Hours: 1,
          pendingReports: 3,
          acceptedReportsLast30Days: 2,
          rejectedReportsLast30Days: 0
        }
      ]
    });

    assert.deepEqual(controls.map((control) => control.action), ['throttle', 'require_manual_review']);
  });
});

describe('authorizeHumanReviewAction', () => {
  const assignment = {
    id: 'assignment-review-match-1-moderator-1',
    reviewId: 'review-match-1',
    subjectType: 'product_match' as const,
    subjectId: 'match-1',
    priority: 'high' as const,
    reason: 'Low-confidence produce match.',
    assigneeId: 'moderator-1',
    assignedAt: '2026-05-19T10:00:00.000Z',
    dueAt: '2026-05-19T14:00:00.000Z',
    status: 'assigned' as const
  };

  it('allows leads to manage queue assignments and abuse controls', () => {
    assert.deepEqual(
      authorizeHumanReviewAction({
        reviewer: { id: 'lead-1', role: 'lead', active: true },
        action: 'assign_review'
      }),
      { allowed: true, reason: 'Lead reviewers can perform human-review operations.' }
    );
    assert.deepEqual(
      authorizeHumanReviewAction({
        reviewer: { id: 'lead-1', role: 'lead', active: true },
        action: 'manage_abuse_controls'
      }).allowed,
      true
    );
  });

  it('limits moderators to viewing and deciding their own open assignments', () => {
    assert.deepEqual(
      authorizeHumanReviewAction({
        reviewer: { id: 'moderator-1', role: 'moderator', active: true },
        action: 'decide_review',
        assignment
      }),
      { allowed: true, reason: 'Moderator is assigned to this open review.' }
    );
    assert.deepEqual(
      authorizeHumanReviewAction({
        reviewer: { id: 'moderator-2', role: 'moderator', active: true },
        action: 'decide_review',
        assignment
      }),
      { allowed: false, reason: 'Moderators can only decide reviews assigned to them.' }
    );
    assert.deepEqual(
      authorizeHumanReviewAction({
        reviewer: { id: 'moderator-1', role: 'moderator', active: true },
        action: 'assign_review'
      }).allowed,
      false
    );
  });

  it('allows viewers to view only and blocks inactive reviewers', () => {
    assert.deepEqual(
      authorizeHumanReviewAction({
        reviewer: { id: 'viewer-1', role: 'viewer', active: true },
        action: 'view_queue'
      }),
      { allowed: true, reason: 'Viewer can inspect the review queue.' }
    );
    assert.deepEqual(
      authorizeHumanReviewAction({
        reviewer: { id: 'viewer-1', role: 'viewer', active: true },
        action: 'decide_review',
        assignment
      }).allowed,
      false
    );
    assert.deepEqual(
      authorizeHumanReviewAction({
        reviewer: { id: 'inactive-lead', role: 'lead', active: false },
        action: 'assign_review'
      }),
      { allowed: false, reason: 'Reviewer is inactive.' }
    );
  });
});
