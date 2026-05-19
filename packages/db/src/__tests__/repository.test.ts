import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryRepository } from '../index.js';

describe('createMemoryRepository', () => {
  it('persists users, favorite stores, budgets, watchlist items, and baskets', async () => {
    const repo = createMemoryRepository();

    await repo.upsertUser({ id: 'user-1', email: 'shopper@example.com' });
    await repo.addFavoriteStore('user-1', 'willys-odenplan');
    await repo.upsertBudget('user-1', { weeklyBudget: 800, monthlyBudget: 3200 });
    await repo.addWatchlistItem('user-1', { productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true });
    await repo.addBasketItem('user-1', { productId: 'coffee', quantity: 2 });

    assert.deepEqual(await repo.getFavoriteStoreIds('user-1'), ['willys-odenplan']);
    assert.deepEqual(await repo.getBudget('user-1'), { weeklyBudget: 800, monthlyBudget: 3200 });
    assert.deepEqual(await repo.getWatchlist('user-1'), [{ productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, favoriteStoresOnly: true }]);
    assert.deepEqual(await repo.getBasket('user-1'), [{ productId: 'coffee', quantity: 2 }]);
  });

  it('persists open human review assignments separately from completed work', async () => {
    const repo = createMemoryRepository();

    await repo.saveHumanReviewAssignment({
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
    });
    await repo.saveHumanReviewAssignment({
      id: 'assignment-review-report-1-moderator-2',
      reviewId: 'review-report-1',
      subjectType: 'community_report',
      subjectId: 'report-1',
      priority: 'medium',
      reason: 'Low-confidence community price report.',
      assigneeId: 'moderator-2',
      assignedAt: '2026-05-19T10:05:00.000Z',
      dueAt: '2026-05-20T10:05:00.000Z',
      status: 'in_progress'
    });
    await repo.saveHumanReviewAssignment({
      id: 'assignment-review-match-3-moderator-3',
      reviewId: 'review-match-3',
      subjectType: 'product_match',
      subjectId: 'match-3',
      priority: 'low',
      reason: 'Completed review.',
      assigneeId: 'moderator-3',
      assignedAt: '2026-05-18T10:00:00.000Z',
      dueAt: '2026-05-21T10:00:00.000Z',
      status: 'completed'
    });

    assert.deepEqual((await repo.listOpenHumanReviewAssignments()).map((assignment) => assignment.id), [
      'assignment-review-match-1-moderator-1',
      'assignment-review-report-1-moderator-2'
    ]);
  });

  it('persists reviewer roles for permission checks', async () => {
    const repo = createMemoryRepository();

    await repo.upsertHumanReviewer({ id: 'moderator-1', role: 'moderator', active: true });
    await repo.upsertHumanReviewer({ id: 'lead-1', role: 'lead', active: false });

    assert.deepEqual(await repo.getHumanReviewer('moderator-1'), {
      id: 'moderator-1',
      role: 'moderator',
      active: true
    });
    assert.deepEqual(await repo.getHumanReviewer('lead-1'), {
      id: 'lead-1',
      role: 'lead',
      active: false
    });
    assert.equal(await repo.getHumanReviewer('missing-reviewer'), null);
  });

  it('persists community reporter trust state for abuse controls', async () => {
    const repo = createMemoryRepository();

    await repo.upsertCommunityReporterTrust({
      reporterId: 'reporter-1',
      reportsLast24Hours: 7,
      pendingReports: 2,
      acceptedReportsLast30Days: 11,
      rejectedReportsLast30Days: 1,
      updatedAt: '2026-05-19T20:00:00.000Z'
    });

    assert.deepEqual(await repo.getCommunityReporterTrust('reporter-1'), {
      reporterId: 'reporter-1',
      reportsLast24Hours: 7,
      pendingReports: 2,
      acceptedReportsLast30Days: 11,
      rejectedReportsLast30Days: 1,
      updatedAt: '2026-05-19T20:00:00.000Z'
    });
    assert.equal(await repo.getCommunityReporterTrust('missing-reporter'), null);
  });
});
