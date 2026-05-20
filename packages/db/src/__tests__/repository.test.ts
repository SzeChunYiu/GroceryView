import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyNotificationTaskAcknowledgements, buildSourceRunHealthReport, createMemoryRepository } from '../index.js';

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

  it('upserts subscription entitlements by user for premium account enforcement', async () => {
    const repo = createMemoryRepository();

    await repo.upsertUser({ id: 'user-1', email: 'premium@example.com' });
    await repo.upsertSubscriptionEntitlement({
      userId: 'user-1',
      tier: 'premium',
      plan: 'premium_yearly',
      status: 'active',
      currentPeriodEndsAt: '2026-06-20T00:00:00.000Z',
      provider: 'stripe_compatible',
      providerCustomerId: 'cus_123',
      providerSubscriptionId: 'sub_123',
      updatedAt: '2026-05-20T00:00:00.000Z'
    });

    assert.deepEqual(await repo.getSubscriptionEntitlement('user-1'), {
      userId: 'user-1',
      tier: 'premium',
      plan: 'premium_yearly',
      status: 'active',
      currentPeriodEndsAt: '2026-06-20T00:00:00.000Z',
      provider: 'stripe_compatible',
      providerCustomerId: 'cus_123',
      providerSubscriptionId: 'sub_123',
      updatedAt: '2026-05-20T00:00:00.000Z'
    });

    await repo.upsertSubscriptionEntitlement({
      userId: 'user-1',
      tier: 'free',
      status: 'canceled',
      updatedAt: '2026-05-21T00:00:00.000Z'
    });

    assert.deepEqual(await repo.getSubscriptionEntitlement('user-1'), {
      userId: 'user-1',
      tier: 'free',
      status: 'canceled',
      updatedAt: '2026-05-21T00:00:00.000Z'
    });
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

  it('persists due notification worker tasks separately from future and completed tasks', async () => {
    const repo = createMemoryRepository();

    await repo.upsertNotificationTask({
      id: 'task-due',
      channel: 'email',
      type: 'human_review_sla_breach',
      title: 'Human review SLA breached',
      body: 'Review review-1 is overdue.',
      priority: 'high',
      sendAt: '2026-05-19T11:55:00.000Z',
      recipient: 'ops@example.com',
      attemptCount: 1,
      maxAttempts: 3,
      status: 'queued'
    });
    await repo.upsertNotificationTask({
      id: 'task-future',
      channel: 'push',
      type: 'human_review_sla_due_soon',
      title: 'Human review SLA due soon',
      body: 'Review review-2 is due soon.',
      priority: 'high',
      sendAt: '2026-05-19T13:00:00.000Z',
      recipient: 'ops-device',
      attemptCount: 0,
      maxAttempts: 3,
      status: 'queued'
    });
    await repo.upsertNotificationTask({
      id: 'task-delivered',
      channel: 'email',
      type: 'weekly_report',
      title: 'Weekly report',
      body: 'Already delivered.',
      priority: 'normal',
      sendAt: '2026-05-19T10:00:00.000Z',
      recipient: 'user@example.com',
      attemptCount: 1,
      maxAttempts: 3,
      status: 'delivered'
    });
    await repo.upsertNotificationTask({
      id: 'task-suppressed',
      channel: 'email',
      type: 'weekly_report',
      title: 'Weekly report',
      body: 'Suppressed.',
      priority: 'normal',
      sendAt: '2026-05-19T10:00:00.000Z',
      recipient: 'unsubscribed@example.com',
      attemptCount: 0,
      maxAttempts: 3,
      status: 'suppressed'
    });

    assert.deepEqual((await repo.listDueNotificationTasks('2026-05-19T12:00:00.000Z')).map((task) => task.id), [
      'task-due'
    ]);
  });

  it('persists active notification suppressions for unsubscribe and bounce handling', async () => {
    const repo = createMemoryRepository();

    await repo.upsertNotificationSuppression({
      id: 'suppress-email-unsub',
      recipient: 'unsubscribed@example.com',
      channel: 'email',
      reason: 'unsubscribed',
      active: true,
      updatedAt: '2026-05-19T20:30:00.000Z'
    });
    await repo.upsertNotificationSuppression({
      id: 'suppress-global-bounce',
      recipient: 'bounced@example.com',
      reason: 'bounce',
      active: true,
      updatedAt: '2026-05-19T20:31:00.000Z'
    });
    await repo.upsertNotificationSuppression({
      id: 'inactive-complaint',
      recipient: 'device-1',
      channel: 'push',
      reason: 'complaint',
      active: false,
      updatedAt: '2026-05-19T20:32:00.000Z'
    });

    assert.deepEqual(await repo.listActiveNotificationSuppressions(), [
      {
        id: 'suppress-global-bounce',
        recipient: 'bounced@example.com',
        reason: 'bounce',
        active: true,
        updatedAt: '2026-05-19T20:31:00.000Z'
      },
      {
        id: 'suppress-email-unsub',
        recipient: 'unsubscribed@example.com',
        channel: 'email',
        reason: 'unsubscribed',
        active: true,
        updatedAt: '2026-05-19T20:30:00.000Z'
      }
    ]);
  });

  it('persists active alert rules for account alert delivery', async () => {
    const repo = createMemoryRepository();

    await repo.upsertUser({ id: 'user-1', email: 'alerts@example.com' });
    await repo.upsertAlertRule({
      id: 'alert-coffee-target',
      userId: 'user-1',
      productId: 'coffee',
      storeId: 'willys-odenplan',
      channel: 'push',
      alertType: 'target_price',
      targetPrice: 49.9,
      active: true,
      createdAt: '2026-05-20T08:00:00.000Z',
      updatedAt: '2026-05-20T08:00:00.000Z'
    });
    await repo.upsertAlertRule({
      id: 'alert-coffee-inactive',
      userId: 'user-1',
      productId: 'coffee',
      channel: 'email',
      alertType: 'deal_score',
      dealScoreThreshold: 80,
      active: false,
      createdAt: '2026-05-20T08:01:00.000Z',
      updatedAt: '2026-05-20T08:01:00.000Z'
    });

    assert.deepEqual(await repo.listActiveAlertRules('user-1'), [
      {
        id: 'alert-coffee-target',
        userId: 'user-1',
        productId: 'coffee',
        storeId: 'willys-odenplan',
        channel: 'push',
        alertType: 'target_price',
        targetPrice: 49.9,
        active: true,
        createdAt: '2026-05-20T08:00:00.000Z',
        updatedAt: '2026-05-20T08:00:00.000Z'
      }
    ]);
  });
});

describe('applyNotificationTaskAcknowledgements', () => {
  it('turns worker acknowledgements into persisted task updates', () => {
    const updates = applyNotificationTaskAcknowledgements({
      tasks: [
        {
          id: 'delivered-task',
          channel: 'push',
          type: 'target_price',
          title: 'Coffee deal',
          body: 'Below target',
          priority: 'high',
          sendAt: '2026-05-19T10:00:00.000Z',
          recipient: 'device-1',
          attemptCount: 0,
          maxAttempts: 3,
          status: 'queued'
        },
        {
          id: 'retry-task',
          channel: 'email',
          type: 'weekly_report',
          title: 'Weekly report',
          body: 'Summary',
          priority: 'normal',
          sendAt: '2026-05-19T10:00:00.000Z',
          recipient: 'user@example.com',
          attemptCount: 1,
          maxAttempts: 3,
          status: 'queued'
        },
        {
          id: 'suppressed-task',
          channel: 'email',
          type: 'weekly_report',
          title: 'Weekly report',
          body: 'Summary',
          priority: 'normal',
          sendAt: '2026-05-19T10:00:00.000Z',
          recipient: 'unsubscribed@example.com',
          attemptCount: 0,
          maxAttempts: 3,
          status: 'queued'
        },
        {
          id: 'not-due-task',
          channel: 'push',
          type: 'target_price',
          title: 'Future deal',
          body: 'Later',
          priority: 'normal',
          sendAt: '2026-05-19T11:00:00.000Z',
          recipient: 'device-2',
          attemptCount: 0,
          maxAttempts: 3,
          status: 'queued'
        }
      ],
      acknowledgements: [
        { taskId: 'delivered-task', status: 'delivered', providerMessageId: 'provider-1' },
        {
          taskId: 'retry-task',
          status: 'retry_scheduled',
          attemptCount: 2,
          nextAttemptAt: '2026-05-19T10:30:00.000Z',
          reason: 'provider down'
        },
        { taskId: 'suppressed-task', status: 'suppressed', reason: 'unsubscribed' },
        { taskId: 'not-due-task', status: 'not_due' }
      ]
    });

    assert.deepEqual(updates.map((task) => ({
      id: task.id,
      status: task.status,
      attemptCount: task.attemptCount,
      sendAt: task.sendAt
    })), [
      { id: 'delivered-task', status: 'delivered', attemptCount: 0, sendAt: '2026-05-19T10:00:00.000Z' },
      { id: 'retry-task', status: 'queued', attemptCount: 2, sendAt: '2026-05-19T10:30:00.000Z' },
      { id: 'suppressed-task', status: 'suppressed', attemptCount: 0, sendAt: '2026-05-19T10:00:00.000Z' }
    ]);
  });

  it('fails closed when an acknowledgement references an unknown task', () => {
    assert.throws(() => applyNotificationTaskAcknowledgements({
      tasks: [],
      acknowledgements: [{ taskId: 'missing-task', status: 'not_due' }]
    }), /Unknown notification task acknowledgement: missing-task/);
  });
});

describe('buildSourceRunHealthReport', () => {
  it('reports healthy fresh source runs as evidence', () => {
    const report = buildSourceRunHealthReport({
      now: '2026-05-20T08:30:00.000Z',
      maxRunningMinutes: 30,
      staleAfterMinutes: 90,
      runs: [
        {
          sourceRunId: 'source-run-1',
          sourceType: 'retailer_api',
          sourceName: 'Willys API',
          startedAt: '2026-05-20T08:00:00.000Z',
          finishedAt: '2026-05-20T08:05:00.000Z',
          status: 'succeeded',
          provenance: { schedule: 'hourly' }
        }
      ]
    });

    assert.deepEqual(report, {
      status: 'healthy',
      blockers: [],
      evidence: ['source_run_succeeded:source-run-1'],
      runningRunIds: [],
      staleRunIds: []
    });
  });

  it('blocks failed, partial, stale, and stuck running source runs', () => {
    const report = buildSourceRunHealthReport({
      now: '2026-05-20T08:30:00.000Z',
      maxRunningMinutes: 30,
      staleAfterMinutes: 60,
      runs: [
        {
          sourceRunId: 'failed-run',
          sourceType: 'retailer_page',
          sourceName: 'Retailer page',
          startedAt: '2026-05-20T08:00:00.000Z',
          finishedAt: '2026-05-20T08:01:00.000Z',
          status: 'failed',
          provenance: {},
          errorMessage: 'HTTP 500'
        },
        {
          sourceRunId: 'partial-run',
          sourceType: 'weekly_leaflet',
          sourceName: 'Weekly leaflet',
          startedAt: '2026-05-20T07:45:00.000Z',
          finishedAt: '2026-05-20T07:50:00.000Z',
          status: 'partial',
          provenance: {}
        },
        {
          sourceRunId: 'running-run',
          sourceType: 'receipt_ocr',
          sourceName: 'Receipt OCR',
          startedAt: '2026-05-20T07:40:00.000Z',
          status: 'running',
          provenance: {}
        },
        {
          sourceRunId: 'stale-run',
          sourceType: 'community_report',
          sourceName: 'Community reports',
          startedAt: '2026-05-20T06:00:00.000Z',
          finishedAt: '2026-05-20T06:05:00.000Z',
          status: 'succeeded',
          provenance: {}
        }
      ]
    });

    assert.deepEqual(report.status, 'blocked');
    assert.deepEqual(report.blockers, [
      'source_run_failed:failed-run',
      'source_run_partial:partial-run',
      'source_run_stuck_running:running-run',
      'source_run_stale:stale-run'
    ]);
    assert.deepEqual(report.runningRunIds, ['running-run']);
    assert.deepEqual(report.staleRunIds, ['stale-run']);
  });
});
