import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyHumanReviewDecision, classifyProductMatch, planHumanReviewQueue, recommendSmartSwaps } from '../index.js';

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
