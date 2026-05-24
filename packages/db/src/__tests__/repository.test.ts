import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyNotificationTaskAcknowledgements,
  buildSourceRunHealthReport,
  checkSourceRunHealth,
  createMemoryRepository,
  summarizeSourceRunHealthReport
} from '../index.js';

describe('createMemoryRepository', () => {
  it('persists users, favorite stores, budgets, watchlist items, and baskets', async () => {
    const repo = createMemoryRepository();

    await repo.upsertUser({ id: 'user-1', email: 'shopper@example.com' });
    await repo.addFavoriteStore('user-1', 'willys-odenplan');
    await repo.upsertBudget('user-1', { weeklyBudget: 800, monthlyBudget: 3200 });
    await repo.upsertHiddenPreferences('user-1', {
      hiddenProductIds: ['coffee'],
      hiddenStoreIds: ['lidl-sveavagen']
    });
    await repo.addWatchlistItem('user-1', {
      productId: 'coffee',
      targetPrice: 50,
      alertDealScoreAt: 80,
      favoriteStoresOnly: true,
      allowedPriceTypes: ['shelf', 'promotion']
    });
    await repo.addBasketItem('user-1', { productId: 'coffee', quantity: 2 });

    assert.deepEqual(await repo.getFavoriteStoreIds('user-1'), ['willys-odenplan']);
    assert.deepEqual(await repo.getBudget('user-1'), { weeklyBudget: 800, monthlyBudget: 3200 });
    assert.deepEqual(await repo.getHiddenPreferences('user-1'), {
      hiddenProductIds: ['coffee'],
      hiddenStoreIds: ['lidl-sveavagen']
    });
    assert.deepEqual(await repo.getWatchlist('user-1'), [
      {
        productId: 'coffee',
        targetPrice: 50,
        alertDealScoreAt: 80,
        favoriteStoresOnly: true,
        allowedPriceTypes: ['shelf', 'promotion']
      }
    ]);
    assert.deepEqual(await repo.getBasket('user-1'), [{ productId: 'coffee', quantity: 2 }]);
  });

  it('persists account-bound basket import review rows and resolves only open rows', async () => {
    const repo = createMemoryRepository();

    await repo.upsertUser({ id: 'user-1', email: 'importer@example.com' });
    await repo.upsertUser({ id: 'user-2', email: 'other@example.com' });

    await repo.saveBasketImportReviewItems('user-1', [
      {
        reviewItemId: 'review-1',
        rawName: 'Retailer-only bakery bun',
        quantity: 3,
        reason: 'No verified GroceryView product match.',
        retailerId: 'willys',
        sourceKind: 'bookmarklet',
        capturedAt: '2026-05-22T09:35:00.000Z',
        status: 'open',
        createdAt: '2026-05-22T09:35:00.000Z'
      }
    ]);

    assert.deepEqual(await repo.listOpenBasketImportReviewItems('user-1'), [
      {
        reviewItemId: 'review-1',
        rawName: 'Retailer-only bakery bun',
        quantity: 3,
        reason: 'No verified GroceryView product match.',
        retailerId: 'willys',
        sourceKind: 'bookmarklet',
        capturedAt: '2026-05-22T09:35:00.000Z',
        status: 'open',
        createdAt: '2026-05-22T09:35:00.000Z'
      }
    ]);
    assert.deepEqual(await repo.listOpenBasketImportReviewItems('user-2'), []);

    const resolved = await repo.resolveBasketImportReviewItem('user-1', 'review-1', {
      status: 'accepted',
      resolvedAt: '2026-05-22T09:36:00.000Z',
      resolvedProductId: 'coffee',
      quantity: 2
    });

    assert.equal(resolved.status, 'accepted');
    assert.equal(resolved.resolvedProductId, 'coffee');
    assert.equal(resolved.quantity, 2);
    assert.deepEqual(await repo.listOpenBasketImportReviewItems('user-1'), []);
    await assert.rejects(
      repo.resolveBasketImportReviewItem('user-2', 'review-1', {
        status: 'dismissed',
        resolvedAt: '2026-05-22T09:37:00.000Z'
      }),
      /Basket import review item not found: review-1/
    );
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
      id: 'assignment-review-commodity-map-1-curator-1',
      reviewId: 'review-commodity-map-1',
      subjectType: 'commodity_mapping',
      subjectId: 'commodity-map-1',
      priority: 'medium',
      reason: 'Low-confidence loose produce mapping.',
      assigneeId: 'curator-1',
      assignedAt: '2026-05-19T10:10:00.000Z',
      dueAt: '2026-05-19T16:10:00.000Z',
      status: 'assigned'
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
      'assignment-review-commodity-map-1-curator-1',
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

  it('persists pantry inventory for replenishment planning', async () => {
    const repo = createMemoryRepository();

    await repo.upsertUser({ id: 'user-1', email: 'pantry@example.com' });
    await repo.upsertPantryItem({
      id: 'pantry-coffee',
      userId: 'user-1',
      productId: 'coffee',
      name: 'Coffee',
      category: 'pantry',
      quantity: 1,
      unit: 'bag',
      minimumQuantity: 1,
      targetQuantity: 3,
      expiresOn: '2026-07-01',
      updatedAt: '2026-05-20T08:00:00.000Z'
    });
    await repo.upsertPantryItem({
      id: 'pantry-yogurt',
      userId: 'user-1',
      productId: 'yogurt',
      name: 'Yogurt',
      category: 'dairy',
      quantity: 2,
      unit: 'kg',
      minimumQuantity: 1,
      updatedAt: '2026-05-20T08:01:00.000Z'
    });

    assert.deepEqual(await repo.listPantryItems('user-1'), [
      {
        id: 'pantry-yogurt',
        userId: 'user-1',
        productId: 'yogurt',
        name: 'Yogurt',
        category: 'dairy',
        quantity: 2,
        unit: 'kg',
        minimumQuantity: 1,
        updatedAt: '2026-05-20T08:01:00.000Z'
      },
      {
        id: 'pantry-coffee',
        userId: 'user-1',
        productId: 'coffee',
        name: 'Coffee',
        category: 'pantry',
        quantity: 1,
        unit: 'bag',
        minimumQuantity: 1,
        targetQuantity: 3,
        expiresOn: '2026-07-01',
        updatedAt: '2026-05-20T08:00:00.000Z'
      }
    ]);
  });

  it('persists receipt uploads with parsed line items', async () => {
    const repo = createMemoryRepository();

    await repo.upsertUser({ id: 'user-1', email: 'receipts@example.com' });
    await repo.upsertReceiptUpload({
      id: 'receipt-1',
      userId: 'user-1',
      storeId: 'willys-odenplan',
      imageUri: 'scan://receipts/receipt-1.jpg',
      purchasedAt: '2026-05-20T08:00:00.000Z',
      totalAmount: 64.9,
      ocrConfidence: 0.94,
      status: 'parsed',
      createdAt: '2026-05-20T08:01:00.000Z',
      updatedAt: '2026-05-20T08:02:00.000Z',
      items: [
        {
          id: 'receipt-item-1',
          receiptId: 'receipt-1',
          rawName: 'BRYGGKAFFE 450G',
          productId: 'coffee',
          canonicalName: 'Bryggkaffe 450 g',
          quantity: 1,
          itemTotal: 64.9,
          matchConfidence: 0.91
        }
      ]
    });

    assert.deepEqual(await repo.listReceiptUploads('user-1'), [
      {
        id: 'receipt-1',
        userId: 'user-1',
        storeId: 'willys-odenplan',
        imageUri: 'scan://receipts/receipt-1.jpg',
        purchasedAt: '2026-05-20T08:00:00.000Z',
        totalAmount: 64.9,
        ocrConfidence: 0.94,
        status: 'parsed',
        createdAt: '2026-05-20T08:01:00.000Z',
        updatedAt: '2026-05-20T08:02:00.000Z',
        items: [
          {
            id: 'receipt-item-1',
            receiptId: 'receipt-1',
            rawName: 'BRYGGKAFFE 450G',
            productId: 'coffee',
            canonicalName: 'Bryggkaffe 450 g',
            quantity: 1,
            itemTotal: 64.9,
            matchConfidence: 0.91
          }
        ]
      }
    ]);
  });

  it('persists household plans with shared lines and member attribution', async () => {
    const repo = createMemoryRepository();

    await repo.upsertUser({ id: 'user-1', email: 'household@example.com' });
    await repo.upsertHouseholdPlan({
      householdId: 'house-1',
      userId: 'user-1',
      name: 'Odenplan Household',
      weeklyBudget: 800,
      approvalLimit: 400,
      reviewer: 'user-1',
      members: [
        { userId: 'user-1', displayName: 'Alex' },
        { userId: 'partner', displayName: 'Mina' }
      ],
      basketItems: [{ productId: 'milk', quantity: 2, addedBy: 'partner' }],
      watchlistItems: [{ productId: 'coffee', addedBy: 'user-1', targetPrice: 50 }],
      sharedFavoriteStoreIds: ['lidl-sveavagen', 'willys-odenplan'],
      createdAt: '2026-05-20T08:00:00.000Z',
      updatedAt: '2026-05-20T08:01:00.000Z'
    });

    assert.deepEqual(await repo.getHouseholdPlan('user-1'), {
      householdId: 'house-1',
      userId: 'user-1',
      name: 'Odenplan Household',
      weeklyBudget: 800,
      approvalLimit: 400,
      reviewer: 'user-1',
      members: [
        { userId: 'user-1', displayName: 'Alex' },
        { userId: 'partner', displayName: 'Mina' }
      ],
      basketItems: [{ productId: 'milk', quantity: 2, addedBy: 'partner' }],
      watchlistItems: [{ productId: 'coffee', addedBy: 'user-1', targetPrice: 50 }],
      sharedFavoriteStoreIds: ['lidl-sveavagen', 'willys-odenplan'],
      createdAt: '2026-05-20T08:00:00.000Z',
      updatedAt: '2026-05-20T08:01:00.000Z'
    });
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
      staleRunIds: [],
      latestSuccessfulRunId: 'source-run-1',
      latestSuccessfulFinishedAt: '2026-05-20T08:05:00.000Z'
    });
    assert.deepEqual(summarizeSourceRunHealthReport(report), {
      status: 'healthy',
      blockers: {
        total: 0,
        failed: 0,
        partial: 0,
        stale: 0,
        stuckRunning: 0,
        missingFinishedAt: 0,
        startedInFuture: 0,
        finishedInFuture: 0,
        noFreshRuns: 0,
        missingFreshChains: 0,
        insufficientAcceptedRows: 0
      },
      evidence: {
        total: 1,
        succeeded: 1
      },
      running: 0,
      stale: 0,
      latestSuccessfulRunId: 'source-run-1',
      latestSuccessfulFinishedAt: '2026-05-20T08:05:00.000Z'
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
      'source_run_stale:stale-run',
      'source_run_no_fresh_success'
    ]);
    assert.deepEqual(report.runningRunIds, ['running-run']);
    assert.deepEqual(report.staleRunIds, ['stale-run']);
    assert.equal(report.latestSuccessfulRunId, 'stale-run');
    assert.equal(report.latestSuccessfulFinishedAt, '2026-05-20T06:05:00.000Z');
    assert.deepEqual(summarizeSourceRunHealthReport(report), {
      status: 'blocked',
      blockers: {
        total: 5,
        failed: 1,
        partial: 1,
        stale: 1,
        stuckRunning: 1,
        missingFinishedAt: 0,
        startedInFuture: 0,
        finishedInFuture: 0,
        noFreshRuns: 1,
        missingFreshChains: 0,
        insufficientAcceptedRows: 0
      },
      evidence: {
        total: 0,
        succeeded: 0
      },
      running: 1,
      stale: 1,
      latestSuccessfulRunId: 'stale-run',
      latestSuccessfulFinishedAt: '2026-05-20T06:05:00.000Z'
    });
  });

  it('summarizes source run timing blockers for operator dashboards', () => {
    const report = buildSourceRunHealthReport({
      now: '2026-05-20T08:30:00.000Z',
      maxRunningMinutes: 30,
      staleAfterMinutes: 90,
      runs: [
        {
          sourceRunId: 'future-start',
          sourceType: 'retailer_api',
          sourceName: 'Future start',
          startedAt: '2026-05-20T08:45:00.000Z',
          status: 'running',
          provenance: {}
        },
        {
          sourceRunId: 'missing-finish',
          sourceType: 'retailer_page',
          sourceName: 'Missing finish',
          startedAt: '2026-05-20T08:00:00.000Z',
          status: 'failed',
          provenance: {}
        },
        {
          sourceRunId: 'future-finish',
          sourceType: 'weekly_leaflet',
          sourceName: 'Future finish',
          startedAt: '2026-05-20T08:00:00.000Z',
          finishedAt: '2026-05-20T08:45:00.000Z',
          status: 'succeeded',
          provenance: {}
        }
      ]
    });

    assert.deepEqual(summarizeSourceRunHealthReport(report), {
      status: 'blocked',
      blockers: {
        total: 4,
        failed: 0,
        partial: 0,
        stale: 0,
        stuckRunning: 0,
        missingFinishedAt: 1,
        startedInFuture: 1,
        finishedInFuture: 1,
        noFreshRuns: 1,
        missingFreshChains: 0,
        insufficientAcceptedRows: 0
      },
      evidence: {
        total: 0,
        succeeded: 0
      },
      running: 0,
      stale: 0
    });
  });

  it('checks source run health through a repository reader without hiding terminal blockers', async () => {
    const calls: unknown[] = [];
    const result = await checkSourceRunHealth({
      now: '2026-05-20T08:30:00.000Z',
      maxRunningMinutes: 30,
      staleAfterMinutes: 60,
      filter: { sourceType: 'retailer_api', limit: 25 },
      reader: {
        async listSourceRuns(filter) {
          calls.push(filter);
          return [
            {
              sourceRunId: 'successful-run',
              sourceType: 'retailer_api',
              sourceName: 'Willys API',
              startedAt: '2026-05-20T08:00:00.000Z',
              finishedAt: '2026-05-20T08:05:00.000Z',
              status: 'succeeded',
              provenance: {}
            },
            {
              sourceRunId: 'failed-run',
              sourceType: 'retailer_api',
              sourceName: 'Willys API',
              startedAt: '2026-05-20T08:10:00.000Z',
              finishedAt: '2026-05-20T08:11:00.000Z',
              status: 'failed',
              provenance: {}
            }
          ];
        }
      }
    });

    assert.deepEqual(calls, [{ sourceType: 'retailer_api', limit: 25 }]);
    assert.equal(result.runCount, 2);
    assert.deepEqual(result.filter, { sourceType: 'retailer_api', limit: 25 });
    assert.deepEqual(result.report.blockers, ['source_run_failed:failed-run']);
    assert.deepEqual(result.report.evidence, ['source_run_succeeded:successful-run']);
    assert.deepEqual(result.summary, {
      status: 'blocked',
      blockers: {
        total: 1,
        failed: 1,
        partial: 0,
        stale: 0,
        stuckRunning: 0,
        missingFinishedAt: 0,
        startedInFuture: 0,
        finishedInFuture: 0,
        noFreshRuns: 0,
        missingFreshChains: 0,
        insufficientAcceptedRows: 0
      },
      evidence: {
        total: 1,
        succeeded: 1
      },
      running: 0,
      stale: 0,
      latestSuccessfulRunId: 'successful-run',
      latestSuccessfulFinishedAt: '2026-05-20T08:05:00.000Z'
    });
  });

  it('uses a bounded default source run health read window', async () => {
    const calls: unknown[] = [];
    const result = await checkSourceRunHealth({
      now: '2026-05-20T08:30:00.000Z',
      maxRunningMinutes: 30,
      staleAfterMinutes: 60,
      reader: {
        async listSourceRuns(filter) {
          calls.push(filter);
          return [];
        }
      }
    });

    assert.deepEqual(calls, [{ limit: 100 }]);
    assert.equal(result.runCount, 0);
    assert.deepEqual(result.filter, { limit: 100 });
    assert.deepEqual(result.summary, {
      status: 'blocked',
      blockers: {
        total: 1,
        failed: 0,
        partial: 0,
        stale: 0,
        stuckRunning: 0,
        missingFinishedAt: 0,
        startedInFuture: 0,
        finishedInFuture: 0,
        noFreshRuns: 1,
        missingFreshChains: 0,
        insufficientAcceptedRows: 0
      },
      evidence: {
        total: 0,
        succeeded: 0
      },
      running: 0,
      stale: 0
    });
    assert.deepEqual(result.report.blockers, ['source_run_no_fresh_success']);
  });

  it('blocks daily ingestion readiness until every required chain has a fresh successful source run', () => {
    const report = buildSourceRunHealthReport({
      now: '2026-05-20T08:30:00.000Z',
      maxRunningMinutes: 30,
      staleAfterMinutes: 24 * 60,
      requiredFreshChainIds: ['ica', 'willys', 'coop'],
      runs: [
        {
          sourceRunId: 'fresh-willys',
          sourceType: 'official_api',
          sourceName: 'Willys normalized products',
          startedAt: '2026-05-20T08:00:00.000Z',
          finishedAt: '2026-05-20T08:05:00.000Z',
          status: 'succeeded',
          provenance: { chainId: 'willys', cadence: 'daily' }
        },
        {
          sourceRunId: 'fresh-ica',
          sourceType: 'retailer_page',
          sourceName: 'ICA products',
          startedAt: '2026-05-20T08:00:00.000Z',
          finishedAt: '2026-05-20T08:06:00.000Z',
          status: 'succeeded',
          provenance: { chainId: 'ica', cadence: 'daily' }
        }
      ]
    });

    assert.equal(report.status, 'blocked');
    assert.deepEqual(report.evidence, ['source_run_succeeded:fresh-ica', 'source_run_succeeded:fresh-willys']);
    assert.deepEqual(report.blockers, ['source_run_missing_fresh_chain:coop']);
    assert.deepEqual(summarizeSourceRunHealthReport(report).blockers, {
      total: 1,
      failed: 0,
      partial: 0,
      stale: 0,
      stuckRunning: 0,
      missingFinishedAt: 0,
      startedInFuture: 0,
      finishedInFuture: 0,
      noFreshRuns: 0,
      missingFreshChains: 1,
      insufficientAcceptedRows: 0
    });
  });

  it('blocks daily ingestion readiness when a fresh chain run has too few accepted rows', () => {
    const report = buildSourceRunHealthReport({
      now: '2026-05-20T08:30:00.000Z',
      maxRunningMinutes: 30,
      staleAfterMinutes: 24 * 60,
      requiredFreshChainIds: ['ica', 'willys'],
      requiredAcceptedCountByChain: { ica: 10, willys: 10 },
      runs: [
        {
          sourceRunId: 'fresh-willys',
          sourceType: 'official_api',
          sourceName: 'Willys normalized products',
          startedAt: '2026-05-20T08:00:00.000Z',
          finishedAt: '2026-05-20T08:05:00.000Z',
          status: 'succeeded',
          provenance: { chainId: 'willys', cadence: 'daily', acceptedCount: 25 }
        },
        {
          sourceRunId: 'fresh-ica-empty',
          sourceType: 'retailer_page',
          sourceName: 'ICA products',
          startedAt: '2026-05-20T08:00:00.000Z',
          finishedAt: '2026-05-20T08:06:00.000Z',
          status: 'succeeded',
          provenance: { chainId: 'ica', cadence: 'daily', acceptedCount: 0 }
        }
      ]
    });

    assert.equal(report.status, 'blocked');
    assert.deepEqual(report.blockers, ['source_run_insufficient_accepted_rows:ica:0/10']);
    assert.deepEqual(summarizeSourceRunHealthReport(report).blockers, {
      total: 1,
      failed: 0,
      partial: 0,
      stale: 0,
      stuckRunning: 0,
      missingFinishedAt: 0,
      startedInFuture: 0,
      finishedInFuture: 0,
      noFreshRuns: 0,
      missingFreshChains: 0,
      insufficientAcceptedRows: 1
    });
  });
});
