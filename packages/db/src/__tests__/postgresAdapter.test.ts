import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPostgresCatalogReader,
  createPostgresPriceObservationWriter,
  createPostgresPriceReader,
  createPostgresProductAliasRepository,
  createPostgresRepository,
  createPostgresSourceRecordReader,
  createPostgresSourceRecordWriter,
  persistOpenPricesArtifact,
  type OpenPricesNormalizedArtifact,
  type QueryExecutor
} from '../index.js';

class RecordingQueryExecutor implements QueryExecutor {
  calls: Array<{ sql: string; params: unknown[] }> = [];
  basketId: string | number | undefined = 'basket-1';
  observationId: string | undefined = 'observation-1';
  sourceRunId: string | undefined = 'source-run-1';
  rawRecordId: string | undefined = 'raw-record-1';
  chainId: string | undefined = 'chain-open-prices';
  productId: string | undefined = 'product-open-prices';
  productRows: unknown[] = [
    {
      id: 'product-1',
      slug: 'bryggkaffe-450g',
      canonical_name: 'Bryggkaffe mellanrost 450 g',
      brand: 'Rosteriet',
      brand_owner: null,
      private_label_owner: 'Willys',
      barcode: '0731000000000',
      category_path: ['Pantry', 'Coffee'],
      package_size: '450.000',
      package_unit: 'g',
      comparable_unit: 'kg',
      nutrition: '{"caffeineMg":85}',
      image_url: 'https://example.invalid/coffee.png',
      created_at: new Date('2026-05-20T07:00:00.000Z'),
      updated_at: '2026-05-20T07:01:00.000Z'
    }
  ];
  storeRows: unknown[] = [
    {
      id: 'store-1',
      chain_id: 'chain-1',
      chain_slug: 'willys',
      chain_name: 'Willys',
      slug: 'willys-hemma-stockholm-torsplan',
      external_ref: 'seed:willys:torsplan',
      name: 'Willys Hemma Stockholm Torsplan',
      address_line1: 'Norra Stationsgatan 90',
      address_line2: null,
      postal_code: '113 64',
      city: 'Stockholm',
      region: 'Stockholm',
      country_code: 'SE',
      longitude: '18.0346',
      latitude: '59.3495',
      store_type: 'supermarket',
      opening_hours: '{"mon":"08:00-21:00"}',
      online_order_url: 'https://example.invalid/willys/torsplan',
      created_at: new Date('2026-05-20T06:00:00.000Z'),
      updated_at: '2026-05-20T06:01:00.000Z'
    }
  ];
  aliasRows: unknown[] = [
    {
      id: 'alias-1',
      product_id: 'product-1',
      alias: 'ZOEGA SKANEROST',
      normalized_alias: 'zoega skanerost',
      source_type: 'receipt',
      source_ref: 'receipt-ocr',
      match_confidence: '0.9100',
      reviewed_at: new Date('2026-05-20T07:30:00.000Z'),
      created_at: '2026-05-20T07:29:00.000Z'
    }
  ];
  pantryItemRows: unknown[] = [
    {
      id: 'pantry-coffee',
      user_id: 'user-1',
      product_id: 'coffee',
      name: 'Coffee',
      category: 'pantry',
      quantity: '1.000',
      unit: 'bag',
      minimum_quantity: '1.000',
      target_quantity: '3.000',
      expires_on: '2026-07-01',
      updated_at: '2026-05-20T08:00:00.000Z'
    }
  ];
  receiptUploadRows: unknown[] = [
    {
      id: 'receipt-1',
      user_id: 'user-1',
      store_id: 'willys-odenplan',
      image_uri: 'scan://receipts/receipt-1.jpg',
      purchased_at: new Date('2026-05-20T08:00:00.000Z'),
      total_amount: '64.90',
      ocr_confidence: '0.9400',
      status: 'parsed',
      created_at: '2026-05-20T08:01:00.000Z',
      updated_at: '2026-05-20T08:02:00.000Z'
    }
  ];
  receiptItemRows: unknown[] = [
    {
      id: 'receipt-item-1',
      receipt_id: 'receipt-1',
      raw_name: 'BRYGGKAFFE 450G',
      product_id: 'coffee',
      canonical_name: 'Bryggkaffe 450 g',
      quantity: '1.000',
      item_total: '64.90',
      match_confidence: '0.9100'
    }
  ];
  sourceRunRows: unknown[] = [
    {
      id: 'source-run-1',
      source_type: 'retailer_api',
      source_name: 'Willys',
      source_url: 'https://example.invalid/willys/offers',
      started_at: new Date('2026-05-20T08:00:00.000Z'),
      finished_at: '2026-05-20T08:01:00.000Z',
      status: 'succeeded',
      provenance: '{"collectorVersion":"2026.05.20"}',
      error_message: null
    },
    {
      id: 'source-run-2',
      source_type: 'retailer_page',
      source_name: 'Retailer',
      source_url: null,
      started_at: '2026-05-20T07:00:00.000Z',
      finished_at: null,
      status: 'running',
      provenance: { schedule: 'hourly' },
      error_message: 'last fetch pending'
    }
  ];
  rawRecordRows: unknown[] = [
    {
      id: 'raw-record-1',
      source_run_id: 'source-run-1',
      record_type: 'price',
      external_ref: 'retailer-price-1',
      observed_at: new Date('2026-05-20T08:00:00.000Z'),
      payload: '{"product":"coffee","price":49.9}',
      payload_hash: 'sha256:payload-1',
      provenance: { fetchUrl: 'https://example.invalid/coffee', parserVersion: 'retailer-v1' },
      created_at: '2026-05-20T08:00:01.000Z'
    }
  ];
  subscriptionEntitlementRows: unknown[] = [
    {
      user_id: 'user-1',
      tier: 'premium',
      plan: 'premium_monthly',
      status: 'active',
      current_period_ends_at: new Date('2026-06-20T00:00:00.000Z'),
      provider: 'stripe_compatible',
      provider_customer_id: 'cus_123',
      provider_subscription_id: 'sub_123',
      updated_at: '2026-05-20T00:00:00.000Z'
    }
  ];
  alertRuleRows: unknown[] = [
    {
      id: 'alert-coffee-target',
      user_id: 'user-1',
      product_id: 'coffee',
      store_id: 'willys-odenplan',
      channel: 'push',
      alert_type: 'target_price',
      target_price: '49.90',
      deal_score_threshold: null,
      active: true,
      created_at: new Date('2026-05-20T08:00:00.000Z'),
      updated_at: '2026-05-20T08:00:00.000Z'
    },
    {
      id: 'alert-coffee-score',
      user_id: 'user-1',
      product_id: 'coffee',
      store_id: null,
      channel: 'email',
      alert_type: 'deal_score',
      target_price: null,
      deal_score_threshold: 80,
      active: true,
      created_at: '2026-05-20T08:01:00.000Z',
      updated_at: '2026-05-20T08:01:00.000Z'
    }
  ];
  observationHistoryRows: unknown[] = [
    {
      id: 'observation-3',
      product_id: 'product-1',
      chain_id: 'chain-1',
      store_id: 'store-1',
      source_run_id: 'source-run-1',
      raw_record_id: 'raw-record-1',
      retailer_product_ref: 'retailer-1',
      price_type: 'promotion',
      price: '44.90',
      regular_price: '59.90',
      unit_price: '99.7778',
      currency: 'SEK',
      quantity: '450',
      quantity_unit: 'g',
      promotion_text: 'Veckokampanj',
      promotion_starts_on: '2026-05-18',
      promotion_ends_on: '2026-05-24',
      member_required: true,
      observed_at: new Date('2026-05-20T09:00:00.000Z'),
      valid_from: '2026-05-18T00:00:00.000Z',
      valid_until: '2026-05-24T23:59:59.000Z',
      confidence: '0.8800',
      provenance: '{"sourceType":"retailer_page","campaign":"weekly"}'
    },
    {
      id: 'observation-4',
      product_id: 'product-1',
      chain_id: 'chain-2',
      store_id: null,
      source_run_id: null,
      raw_record_id: null,
      retailer_product_ref: null,
      price_type: 'online',
      price: 49.9,
      regular_price: null,
      unit_price: 110.8889,
      currency: 'SEK',
      quantity: null,
      quantity_unit: null,
      promotion_text: null,
      promotion_starts_on: null,
      promotion_ends_on: null,
      member_required: false,
      observed_at: '2026-05-20T08:00:00.000Z',
      valid_from: null,
      valid_until: null,
      confidence: 0.91,
      provenance: { sourceType: 'retailer_api' }
    }
  ];
  latestPriceRows: unknown[] = [
    {
      product_id: 'product-1',
      chain_id: 'chain-1',
      store_id: null,
      price_type: 'online',
      observation_id: 'observation-1',
      price: '49.90',
      regular_price: null,
      unit_price: '110.8889',
      currency: 'SEK',
      observed_at: new Date('2026-05-20T08:00:00.000Z'),
      confidence: '0.9100',
      provenance: '{"sourceType":"retailer_api","sourceName":"Willys"}'
    },
    {
      product_id: 'product-1',
      chain_id: 'chain-1',
      store_id: 'store-1',
      price_type: 'promotion',
      observation_id: 'observation-2',
      price: 44.9,
      regular_price: '59.90',
      unit_price: 99.7778,
      currency: 'SEK',
      observed_at: '2026-05-20T09:00:00.000Z',
      confidence: 0.88,
      provenance: { sourceType: 'retailer_page', campaign: 'weekly' }
    }
  ];

  async query<T>(sql: string, params: unknown[] = []) {
    this.calls.push({ sql, params });
    if (sql.includes('update source_runs')) return this.sourceRunId === undefined ? ([] as T[]) : ([{ id: this.sourceRunId }] as T[]);
    if (sql.includes('insert into source_runs')) return this.sourceRunId === undefined ? ([] as T[]) : ([{ id: this.sourceRunId }] as T[]);
    if (sql.includes('from source_runs')) return this.sourceRunRows as T[];
    if (sql.includes('insert into raw_records')) return this.rawRecordId === undefined ? ([] as T[]) : ([{ id: this.rawRecordId }] as T[]);
    if (sql.includes('from raw_records')) return this.rawRecordRows as T[];
    if (sql.includes('insert into chains')) return this.chainId === undefined ? ([] as T[]) : ([{ id: this.chainId }] as T[]);
    if (sql.includes('insert into products')) return this.productId === undefined ? ([] as T[]) : ([{ id: this.productId }] as T[]);
    if (sql.includes('insert into observations')) return this.observationId === undefined ? ([] as T[]) : ([{ id: this.observationId }] as T[]);
    if (sql.includes('from latest_prices')) return this.latestPriceRows as T[];
    if (sql.includes('from observations')) return this.observationHistoryRows as T[];
    if (sql.includes('from stores')) return this.storeRows as T[];
    if (sql.includes('from products')) return this.productRows as T[];
    if (sql.includes('insert into aliases')) return this.aliasRows as T[];
    if (sql.includes('from aliases')) return this.aliasRows as T[];
    if (sql.includes('from subscription_entitlements')) return this.subscriptionEntitlementRows as T[];
    if (sql.includes('select store_id')) return [{ store_id: 'willys-odenplan' }] as T[];
    if (sql.includes('select weekly_budget')) return [{ weekly_budget: '800', monthly_budget: '3200' }] as T[];
    if (sql.includes('insert into weekly_baskets')) return this.basketId === undefined ? ([] as T[]) : ([{ id: this.basketId }] as T[]);
    if (sql.includes('from human_reviewers')) {
      return [{ id: 'moderator-1', role: 'moderator', active: true }] as T[];
    }
    if (sql.includes('from community_reporter_trust')) {
      return [
        {
          reporter_id: 'reporter-1',
          reports_last_24_hours: 7,
          pending_reports: 2,
          accepted_reports_last_30_days: 11,
          rejected_reports_last_30_days: 1,
          updated_at: '2026-05-19T20:00:00.000Z'
        }
      ] as T[];
    }
    if (sql.includes('from notification_tasks')) {
      return [
        {
          id: 'task-due',
          channel: 'email',
          type: 'human_review_sla_breach',
          title: 'Human review SLA breached',
          body: 'Review review-1 is overdue.',
          priority: 'high',
          send_at: '2026-05-19T11:55:00.000Z',
          recipient: 'ops@example.com',
          attempt_count: 1,
          max_attempts: 3,
          status: 'queued'
        }
      ] as T[];
    }
    if (sql.includes('from notification_suppressions')) {
      return [
        {
          id: 'suppress-global-bounce',
          recipient: 'bounced@example.com',
          channel: null,
          reason: 'bounce',
          active: true,
          updated_at: '2026-05-19T20:31:00.000Z'
        }
      ] as T[];
    }
    if (sql.includes('from alert_rules')) return this.alertRuleRows as T[];
    if (sql.includes('from pantry_items')) return this.pantryItemRows as T[];
    if (sql.includes('from receipt_uploads')) return this.receiptUploadRows as T[];
    if (sql.includes('from receipt_items')) return this.receiptItemRows as T[];
    if (sql.includes('from human_review_assignments')) {
      return [
        {
          id: 'assignment-review-match-1-moderator-1',
          review_id: 'review-match-1',
          subject_type: 'product_match',
          subject_id: 'match-1',
          priority: 'high',
          reason: 'Low-confidence produce match.',
          assignee_id: 'moderator-1',
          assigned_at: '2026-05-19T10:00:00.000Z',
          due_at: '2026-05-19T14:00:00.000Z',
          status: 'assigned'
        }
      ] as T[];
    }
    return [] as T[];
  }
}

describe('createPostgresRepository', () => {
  it('uses parameterized SQL for user preferences and favorite stores', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

    await repo.upsertUser({ id: 'user-1', email: 'shopper@example.com' });
    await repo.addFavoriteStore('user-1', 'willys-odenplan');
    assert.deepEqual(await repo.getFavoriteStoreIds('user-1'), ['willys-odenplan']);
    await repo.upsertBudget('user-1', { weeklyBudget: 800, monthlyBudget: 3200 });
    assert.deepEqual(await repo.getBudget('user-1'), { weeklyBudget: 800, monthlyBudget: 3200 });

    assert.equal(executor.calls.every((call) => call.sql.includes('$') || call.sql.startsWith('select')), true);
    assert.deepEqual(executor.calls[0].params, ['user-1', 'shopper@example.com']);
  });

  it('reuses the current weekly basket and inserts basket items with the returned id', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

    await repo.addBasketItem('user-1', { productId: 'coffee', quantity: 2 });

    const weeklyBasketCall = executor.calls.find((call) => call.sql.includes('insert into weekly_baskets'));
    assert.match(weeklyBasketCall?.sql ?? '', /on conflict \(user_id, week_start\) do update/);
    assert.match(weeklyBasketCall?.sql ?? '', /returning id/);

    const basketItemCall = executor.calls.find((call) => call.sql.includes('insert into basket_items'));
    assert.deepEqual(basketItemCall?.params, ['basket-1', 'coffee', 2]);
  });

  it('fails instead of writing basket items against a missing basket id', async () => {
    const executor = new RecordingQueryExecutor();
    executor.basketId = undefined;
    const repo = createPostgresRepository(executor);

    await assert.rejects(
      repo.addBasketItem('user-1', { productId: 'coffee', quantity: 2 }),
      /Weekly basket was not returned for user: user-1/
    );
    assert.equal(executor.calls.some((call) => call.sql.includes('insert into basket_items')), false);
  });

  it('persists and reads subscription entitlements with parameterized billing identifiers', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

    await repo.upsertSubscriptionEntitlement({
      userId: 'user-1',
      tier: 'premium',
      plan: 'premium_monthly',
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
      plan: 'premium_monthly',
      status: 'active',
      currentPeriodEndsAt: '2026-06-20T00:00:00.000Z',
      provider: 'stripe_compatible',
      providerCustomerId: 'cus_123',
      providerSubscriptionId: 'sub_123',
      updatedAt: '2026-05-20T00:00:00.000Z'
    });

    assert.match(executor.calls[0].sql, /insert into subscription_entitlements/);
    assert.match(executor.calls[0].sql, /on conflict \(user_id\) do update/);
    assert.deepEqual(executor.calls[0].params, [
      'user-1',
      'premium',
      'premium_monthly',
      'active',
      '2026-06-20T00:00:00.000Z',
      'stripe_compatible',
      'cus_123',
      'sub_123',
      '2026-05-20T00:00:00.000Z'
    ]);
    assert.deepEqual(executor.calls[1].params, ['user-1']);
  });

  it('persists and lists open human review assignments', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

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

    assert.deepEqual(await repo.listOpenHumanReviewAssignments(), [
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
      }
    ]);
    assert.deepEqual(executor.calls[0].params, [
      'assignment-review-match-1-moderator-1',
      'review-match-1',
      'product_match',
      'match-1',
      'high',
      'Low-confidence produce match.',
      'moderator-1',
      '2026-05-19T10:00:00.000Z',
      '2026-05-19T14:00:00.000Z',
      'assigned'
    ]);
  });

  it('persists and reads reviewer roles for permission checks', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

    await repo.upsertHumanReviewer({ id: 'moderator-1', role: 'moderator', active: true });

    assert.deepEqual(await repo.getHumanReviewer('moderator-1'), {
      id: 'moderator-1',
      role: 'moderator',
      active: true
    });
    assert.deepEqual(executor.calls[0].params, ['moderator-1', 'moderator', true]);
    assert.deepEqual(executor.calls[1].params, ['moderator-1']);
  });

  it('persists and reads community reporter trust state', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

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
    assert.deepEqual(executor.calls[0].params, [
      'reporter-1',
      7,
      2,
      11,
      1,
      '2026-05-19T20:00:00.000Z'
    ]);
    assert.deepEqual(executor.calls[1].params, ['reporter-1']);
  });

  it('persists and lists due notification worker tasks', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

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

    assert.deepEqual(await repo.listDueNotificationTasks('2026-05-19T12:00:00.000Z'), [
      {
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
      }
    ]);
    assert.deepEqual(executor.calls[0].params, [
      'task-due',
      'email',
      'human_review_sla_breach',
      'Human review SLA breached',
      'Review review-1 is overdue.',
      'high',
      '2026-05-19T11:55:00.000Z',
      'ops@example.com',
      1,
      3,
      'queued'
    ]);
    assert.deepEqual(executor.calls[1].params, ['2026-05-19T12:00:00.000Z']);
  });

  it('persists and lists active notification suppressions', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

    await repo.upsertNotificationSuppression({
      id: 'suppress-global-bounce',
      recipient: 'bounced@example.com',
      reason: 'bounce',
      active: true,
      updatedAt: '2026-05-19T20:31:00.000Z'
    });

    assert.deepEqual(await repo.listActiveNotificationSuppressions(), [
      {
        id: 'suppress-global-bounce',
        recipient: 'bounced@example.com',
        reason: 'bounce',
        active: true,
        updatedAt: '2026-05-19T20:31:00.000Z'
      }
    ]);
    assert.deepEqual(executor.calls[0].params, [
      'suppress-global-bounce',
      'bounced@example.com',
      null,
      'bounce',
      true,
      '2026-05-19T20:31:00.000Z'
    ]);
  });

  it('persists and lists active alert rules for account-scoped delivery', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

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
      },
      {
        id: 'alert-coffee-score',
        userId: 'user-1',
        productId: 'coffee',
        channel: 'email',
        alertType: 'deal_score',
        dealScoreThreshold: 80,
        active: true,
        createdAt: '2026-05-20T08:01:00.000Z',
        updatedAt: '2026-05-20T08:01:00.000Z'
      }
    ]);
    assert.deepEqual(executor.calls[0].params, [
      'alert-coffee-target',
      'user-1',
      'coffee',
      'willys-odenplan',
      'push',
      'target_price',
      49.9,
      null,
      true,
      '2026-05-20T08:00:00.000Z',
      '2026-05-20T08:00:00.000Z'
    ]);
    assert.deepEqual(executor.calls[1].params, ['user-1']);
  });

  it('persists and lists pantry inventory items', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

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

    assert.deepEqual(await repo.listPantryItems('user-1'), [
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
    assert.deepEqual(executor.calls[0].params, [
      'pantry-coffee',
      'user-1',
      'coffee',
      'Coffee',
      'pantry',
      1,
      'bag',
      1,
      3,
      '2026-07-01',
      '2026-05-20T08:00:00.000Z'
    ]);
    assert.deepEqual(executor.calls[1].params, ['user-1']);
  });

  it('persists and lists receipt uploads with parsed items', async () => {
    const executor = new RecordingQueryExecutor();
    const repo = createPostgresRepository(executor);

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
    assert.deepEqual(executor.calls[0].params, [
      'receipt-1',
      'user-1',
      'willys-odenplan',
      'scan://receipts/receipt-1.jpg',
      '2026-05-20T08:00:00.000Z',
      64.9,
      0.94,
      'parsed',
      '2026-05-20T08:01:00.000Z',
      '2026-05-20T08:02:00.000Z'
    ]);
    assert.deepEqual(executor.calls[1].params, ['receipt-1']);
    assert.deepEqual(executor.calls[2].params, [
      'receipt-item-1',
      'receipt-1',
      'BRYGGKAFFE 450G',
      'coffee',
      'Bryggkaffe 450 g',
      1,
      64.9,
      0.91
    ]);
    assert.deepEqual(executor.calls[3].params, ['user-1']);
    assert.deepEqual(executor.calls[4].params, [['receipt-1']]);
  });
});

describe('createPostgresCatalogReader', () => {
  it('reads products by slug with catalog metadata mapping', async () => {
    const executor = new RecordingQueryExecutor();
    const reader = createPostgresCatalogReader(executor);

    assert.deepEqual(await reader.getProductBySlug('bryggkaffe-450g'), {
      productId: 'product-1',
      slug: 'bryggkaffe-450g',
      canonicalName: 'Bryggkaffe mellanrost 450 g',
      brand: 'Rosteriet',
      privateLabelOwner: 'Willys',
      barcode: '0731000000000',
      categoryPath: ['Pantry', 'Coffee'],
      packageSize: 450,
      packageUnit: 'g',
      comparableUnit: 'kg',
      nutrition: { caffeineMg: 85 },
      imageUrl: 'https://example.invalid/coffee.png',
      createdAt: '2026-05-20T07:00:00.000Z',
      updatedAt: '2026-05-20T07:01:00.000Z'
    });

    assert.match(executor.calls[0]!.sql, /from products/);
    assert.match(executor.calls[0]!.sql, /where slug = \$1/);
    assert.deepEqual(executor.calls[0]!.params, ['bryggkaffe-450g']);
  });

  it('returns null when a product slug is unknown', async () => {
    const executor = new RecordingQueryExecutor();
    executor.productRows = [];
    const reader = createPostgresCatalogReader(executor);

    assert.equal(await reader.getProductBySlug('missing-product'), null);
  });

  it('lists products with bounded search and category filters', async () => {
    const executor = new RecordingQueryExecutor();
    const reader = createPostgresCatalogReader(executor);

    assert.deepEqual(await reader.listProducts({ search: 'kaffe', categoryPath: ['Pantry', 'Coffee'], limit: 25 }), [
      {
        productId: 'product-1',
        slug: 'bryggkaffe-450g',
        canonicalName: 'Bryggkaffe mellanrost 450 g',
        brand: 'Rosteriet',
        privateLabelOwner: 'Willys',
        barcode: '0731000000000',
        categoryPath: ['Pantry', 'Coffee'],
        packageSize: 450,
        packageUnit: 'g',
        comparableUnit: 'kg',
        nutrition: { caffeineMg: 85 },
        imageUrl: 'https://example.invalid/coffee.png',
        createdAt: '2026-05-20T07:00:00.000Z',
        updatedAt: '2026-05-20T07:01:00.000Z'
      }
    ]);

    assert.match(executor.calls[0]!.sql, /from products/);
    assert.match(executor.calls[0]!.sql, /cross join \(select nullif\(trim\(\$1::text\), ''\) as term\) as query/);
    assert.match(executor.calls[0]!.sql, /products\.barcode = query\.term/);
    assert.match(executor.calls[0]!.sql, /products\.canonical_name % query\.term/);
    assert.match(executor.calls[0]!.sql, /aliases\.normalized_alias % lower\(query\.term\)/);
    assert.match(executor.calls[0]!.sql, /category_path @> \$2::text\[\]/);
    assert.match(executor.calls[0]!.sql, /when products\.barcode = query\.term then 0/);
    assert.match(executor.calls[0]!.sql, /similarity\(products\.canonical_name, coalesce\(query\.term, ''\)\)/);
    assert.deepEqual(executor.calls[0]!.params, ['kaffe', ['Pantry', 'Coffee'], 25]);
  });

  it('clamps product list limits to a safe range', async () => {
    const executor = new RecordingQueryExecutor();
    const reader = createPostgresCatalogReader(executor);

    await reader.listProducts({ limit: 5000 });
    await reader.listProducts({ limit: 0 });

    assert.deepEqual(executor.calls[0]!.params, [null, null, 500]);
    assert.deepEqual(executor.calls[1]!.params, [null, null, 1]);
  });

  it('reads stores by slug with chain and coordinate metadata', async () => {
    const executor = new RecordingQueryExecutor();
    const reader = createPostgresCatalogReader(executor);

    assert.deepEqual(await reader.getStoreBySlug('willys-hemma-stockholm-torsplan'), {
      storeId: 'store-1',
      chainId: 'chain-1',
      chainSlug: 'willys',
      chainName: 'Willys',
      slug: 'willys-hemma-stockholm-torsplan',
      externalRef: 'seed:willys:torsplan',
      name: 'Willys Hemma Stockholm Torsplan',
      addressLine1: 'Norra Stationsgatan 90',
      postalCode: '113 64',
      city: 'Stockholm',
      region: 'Stockholm',
      countryCode: 'SE',
      longitude: 18.0346,
      latitude: 59.3495,
      storeType: 'supermarket',
      openingHours: { mon: '08:00-21:00' },
      onlineOrderUrl: 'https://example.invalid/willys/torsplan',
      createdAt: '2026-05-20T06:00:00.000Z',
      updatedAt: '2026-05-20T06:01:00.000Z'
    });

    assert.match(executor.calls[0]!.sql, /from stores/);
    assert.match(executor.calls[0]!.sql, /join chains on chains\.id = stores\.chain_id/);
    assert.match(executor.calls[0]!.sql, /where stores\.slug = \$1/);
    assert.match(executor.calls[0]!.sql, /ST_X\(stores\.position::geometry\)/);
    assert.deepEqual(executor.calls[0]!.params, ['willys-hemma-stockholm-torsplan']);
  });

  it('returns null when a store slug is unknown', async () => {
    const executor = new RecordingQueryExecutor();
    executor.storeRows = [];
    const reader = createPostgresCatalogReader(executor);

    assert.equal(await reader.getStoreBySlug('missing-store'), null);
  });

  it('lists stores with bounded search, chain, and city filters', async () => {
    const executor = new RecordingQueryExecutor();
    const reader = createPostgresCatalogReader(executor);

    assert.equal((await reader.listStores({ search: 'torsplan', chainSlug: 'willys', city: 'Stockholm', limit: 25 })).length, 1);

    assert.match(executor.calls[0]!.sql, /cross join \(select nullif\(trim\(\$1::text\), ''\) as query\) as search/);
    assert.match(executor.calls[0]!.sql, /stores\.name % search\.query/);
    assert.match(executor.calls[0]!.sql, /chains\.name % search\.query/);
    assert.match(executor.calls[0]!.sql, /chains\.slug = \$2/);
    assert.match(executor.calls[0]!.sql, /stores\.city = \$3/);
    assert.match(executor.calls[0]!.sql, /when lower\(stores\.name\) = lower\(search\.query\) then 0/);
    assert.match(executor.calls[0]!.sql, /similarity\(stores\.name, coalesce\(search\.query, ''\)\)/);
    assert.deepEqual(executor.calls[0]!.params, ['torsplan', 'willys', 'Stockholm', 25]);
  });

  it('clamps store list limits to a safe range', async () => {
    const executor = new RecordingQueryExecutor();
    const reader = createPostgresCatalogReader(executor);

    await reader.listStores({ limit: 5000 });
    await reader.listStores({ limit: 0 });

    assert.deepEqual(executor.calls[0]!.params, [null, null, null, 500]);
    assert.deepEqual(executor.calls[1]!.params, [null, null, null, 1]);
  });
});

describe('createPostgresProductAliasRepository', () => {
  it('upserts product aliases with parameterized SQL and maps the returned row', async () => {
    const executor = new RecordingQueryExecutor();
    const aliases = createPostgresProductAliasRepository(executor);

    assert.deepEqual(
      await aliases.upsertProductAlias({
        productId: 'product-1',
        alias: 'ZOEGA SKANEROST',
        normalizedAlias: 'zoega skanerost',
        sourceType: 'receipt',
        sourceRef: 'receipt-ocr',
        matchConfidence: 0.91,
        reviewedAt: '2026-05-20T07:30:00.000Z'
      }),
      {
        aliasId: 'alias-1',
        productId: 'product-1',
        alias: 'ZOEGA SKANEROST',
        normalizedAlias: 'zoega skanerost',
        sourceType: 'receipt',
        sourceRef: 'receipt-ocr',
        matchConfidence: 0.91,
        reviewedAt: '2026-05-20T07:30:00.000Z',
        createdAt: '2026-05-20T07:29:00.000Z'
      }
    );

    assert.match(executor.calls[0]!.sql, /insert into aliases/);
    assert.match(executor.calls[0]!.sql, /on conflict \(normalized_alias, source_type, source_ref\) do update/);
    assert.match(executor.calls[0]!.sql, /returning id/);
    assert.deepEqual(executor.calls[0]!.params, [
      'product-1',
      'ZOEGA SKANEROST',
      'zoega skanerost',
      'receipt',
      'receipt-ocr',
      0.91,
      '2026-05-20T07:30:00.000Z'
    ]);
  });

  it('fails closed when an alias upsert does not return a row', async () => {
    const executor = new RecordingQueryExecutor();
    executor.aliasRows = [];
    const aliases = createPostgresProductAliasRepository(executor);

    await assert.rejects(
      () =>
        aliases.upsertProductAlias({
          productId: 'product-1',
          alias: 'Unknown',
          normalizedAlias: 'unknown',
          sourceType: 'manual',
          matchConfidence: 0.5
        }),
      /Product alias upsert did not return a row/
    );
  });

  it('finds product aliases with bounded lookup filters', async () => {
    const executor = new RecordingQueryExecutor();
    const aliases = createPostgresProductAliasRepository(executor);

    assert.equal(
      (await aliases.findProductAliases({ normalizedAlias: 'zoega skanerost', productId: 'product-1', sourceType: 'receipt', limit: 10 }))
        .length,
      1
    );

    assert.match(executor.calls[0]!.sql, /from aliases/);
    assert.match(executor.calls[0]!.sql, /normalized_alias = \$1/);
    assert.match(executor.calls[0]!.sql, /product_id = \$2::uuid/);
    assert.match(executor.calls[0]!.sql, /source_type = \$3/);
    assert.match(executor.calls[0]!.sql, /order by match_confidence desc, reviewed_at desc nulls last, created_at desc, id/);
    assert.deepEqual(executor.calls[0]!.params, ['zoega skanerost', 'product-1', 'receipt', 10]);
  });

  it('clamps product alias lookup limits to a safe range', async () => {
    const executor = new RecordingQueryExecutor();
    const aliases = createPostgresProductAliasRepository(executor);

    await aliases.findProductAliases({ limit: 5000 });
    await aliases.findProductAliases({ limit: 0 });

    assert.deepEqual(executor.calls[0]!.params, [null, null, null, 100]);
    assert.deepEqual(executor.calls[1]!.params, [null, null, null, 1]);
  });
});

describe('createPostgresSourceRecordWriter', () => {
  it('creates source runs with provenance and optional timing metadata', async () => {
    const executor = new RecordingQueryExecutor();
    const writer = createPostgresSourceRecordWriter(executor);

    assert.deepEqual(
      await writer.createSourceRun({
        sourceType: 'retailer_api',
        sourceName: 'Willys',
        sourceUrl: 'https://example.invalid/willys/offers',
        startedAt: '2026-05-20T08:00:00.000Z',
        finishedAt: '2026-05-20T08:01:00.000Z',
        status: 'succeeded',
        provenance: { collectorVersion: '2026.05.20', schedule: 'daily' }
      }),
      { sourceRunId: 'source-run-1' }
    );

    assert.match(executor.calls[0]!.sql, /insert into source_runs/);
    assert.match(executor.calls[0]!.sql, /returning id/);
    assert.deepEqual(executor.calls[0]!.params, [
      'retailer_api',
      'Willys',
      'https://example.invalid/willys/offers',
      '2026-05-20T08:00:00.000Z',
      '2026-05-20T08:01:00.000Z',
      'succeeded',
      JSON.stringify({ collectorVersion: '2026.05.20', schedule: 'daily' }),
      null
    ]);
  });

  it('upserts raw records idempotently by source run and payload hash', async () => {
    const executor = new RecordingQueryExecutor();
    const writer = createPostgresSourceRecordWriter(executor);

    assert.deepEqual(
      await writer.upsertRawRecord({
        sourceRunId: 'source-run-1',
        recordType: 'price',
        externalRef: 'retailer-price-1',
        observedAt: '2026-05-20T08:00:00.000Z',
        payload: { product: 'coffee', price: 49.9 },
        payloadHash: 'sha256:payload-1',
        provenance: { fetchUrl: 'https://example.invalid/coffee', parserVersion: 'retailer-v1' }
      }),
      { rawRecordId: 'raw-record-1' }
    );

    assert.match(executor.calls[0]!.sql, /insert into raw_records/);
    assert.match(executor.calls[0]!.sql, /on conflict \(source_run_id, payload_hash\) do update/);
    assert.match(executor.calls[0]!.sql, /returning id/);
    assert.deepEqual(executor.calls[0]!.params, [
      'source-run-1',
      'price',
      'retailer-price-1',
      '2026-05-20T08:00:00.000Z',
      JSON.stringify({ product: 'coffee', price: 49.9 }),
      'sha256:payload-1',
      JSON.stringify({ fetchUrl: 'https://example.invalid/coffee', parserVersion: 'retailer-v1' })
    ]);
  });

  it('finishes source runs with terminal status and error metadata', async () => {
    const executor = new RecordingQueryExecutor();
    const writer = createPostgresSourceRecordWriter(executor);

    assert.deepEqual(
      await writer.finishSourceRun({
        sourceRunId: 'source-run-1',
        finishedAt: '2026-05-20T08:02:00.000Z',
        status: 'partial',
        errorMessage: '2 records skipped'
      }),
      { sourceRunId: 'source-run-1' }
    );

    assert.match(executor.calls[0]!.sql, /update source_runs/);
    assert.match(executor.calls[0]!.sql, /finished_at = coalesce\(\$2, now\(\)\)/);
    assert.match(executor.calls[0]!.sql, /returning id/);
    assert.deepEqual(executor.calls[0]!.params, ['source-run-1', '2026-05-20T08:02:00.000Z', 'partial', '2 records skipped']);
  });

  it('fails closed when source run or raw record writes do not return ids', async () => {
    const executor = new RecordingQueryExecutor();
    const writer = createPostgresSourceRecordWriter(executor);
    executor.sourceRunId = undefined;

    await assert.rejects(
      writer.createSourceRun({
        sourceType: 'retailer_page',
        sourceName: 'Retailer',
        status: 'failed',
        provenance: {},
        errorMessage: 'timeout'
      }),
      /Source run insert did not return an id/
    );

    executor.sourceRunId = undefined;
    await assert.rejects(
      writer.finishSourceRun({
        sourceRunId: 'source-run-missing',
        status: 'failed',
        errorMessage: 'missing run'
      }),
      /Source run update did not return an id: source-run-missing/
    );

    executor.sourceRunId = 'source-run-1';
    executor.rawRecordId = undefined;
    await assert.rejects(
      writer.upsertRawRecord({
        sourceRunId: 'source-run-1',
        recordType: 'product',
        payload: { sku: 'sku-1' },
        payloadHash: 'sha256:payload-2',
        provenance: {}
      }),
      /Raw record upsert did not return an id/
    );
  });
});

describe('createPostgresSourceRecordReader', () => {
  it('lists source runs with status and source-type filters', async () => {
    const executor = new RecordingQueryExecutor();
    const reader = createPostgresSourceRecordReader(executor);

    assert.deepEqual(await reader.listSourceRuns({ status: 'succeeded', sourceType: 'retailer_api', limit: 25 }), [
      {
        sourceRunId: 'source-run-1',
        sourceType: 'retailer_api',
        sourceName: 'Willys',
        sourceUrl: 'https://example.invalid/willys/offers',
        startedAt: '2026-05-20T08:00:00.000Z',
        finishedAt: '2026-05-20T08:01:00.000Z',
        status: 'succeeded',
        provenance: { collectorVersion: '2026.05.20' }
      },
      {
        sourceRunId: 'source-run-2',
        sourceType: 'retailer_page',
        sourceName: 'Retailer',
        startedAt: '2026-05-20T07:00:00.000Z',
        status: 'running',
        provenance: { schedule: 'hourly' },
        errorMessage: 'last fetch pending'
      }
    ]);

    assert.match(executor.calls[0]!.sql, /from source_runs/);
    assert.match(executor.calls[0]!.sql, /\$1::text is null or status = \$1/);
    assert.match(executor.calls[0]!.sql, /\$2::text is null or source_type = \$2/);
    assert.match(executor.calls[0]!.sql, /order by started_at desc, id/);
    assert.deepEqual(executor.calls[0]!.params, ['succeeded', 'retailer_api', 25]);
  });

  it('clamps source run list limits to a safe range', async () => {
    const executor = new RecordingQueryExecutor();
    const reader = createPostgresSourceRecordReader(executor);

    await reader.listSourceRuns({ limit: 5000 });
    await reader.listSourceRuns({ limit: 0 });

    assert.deepEqual(executor.calls[0]!.params, [null, null, 500]);
    assert.deepEqual(executor.calls[1]!.params, [null, null, 1]);
  });

  it('reads raw records by source run and payload hash with payload provenance mapping', async () => {
    const executor = new RecordingQueryExecutor();
    const reader = createPostgresSourceRecordReader(executor);

    assert.deepEqual(await reader.getRawRecordByHash('source-run-1', 'sha256:payload-1'), {
      rawRecordId: 'raw-record-1',
      sourceRunId: 'source-run-1',
      recordType: 'price',
      externalRef: 'retailer-price-1',
      observedAt: '2026-05-20T08:00:00.000Z',
      payload: { product: 'coffee', price: 49.9 },
      payloadHash: 'sha256:payload-1',
      provenance: { fetchUrl: 'https://example.invalid/coffee', parserVersion: 'retailer-v1' },
      createdAt: '2026-05-20T08:00:01.000Z'
    });

    assert.match(executor.calls[0]!.sql, /from raw_records/);
    assert.match(executor.calls[0]!.sql, /where source_run_id = \$1 and payload_hash = \$2/);
    assert.deepEqual(executor.calls[0]!.params, ['source-run-1', 'sha256:payload-1']);
  });

  it('returns null when no raw record matches the payload hash', async () => {
    const executor = new RecordingQueryExecutor();
    executor.rawRecordRows = [];
    const reader = createPostgresSourceRecordReader(executor);

    assert.equal(await reader.getRawRecordByHash('source-run-1', 'sha256:missing'), null);
  });
});

describe('persistOpenPricesArtifact', () => {
  it('persists normalized Open Prices artifacts into canonical products, raw records, observations, and latest prices', async () => {
    const executor = new RecordingQueryExecutor();
    const artifact: OpenPricesNormalizedArtifact = {
      status: 'passed',
      sourceUrl: 'https://prices.openfoodfacts.org/api/v1/prices?currency=SEK&size=10',
      retrievedAt: '2026-05-20T10:24:58.072Z',
      contentHash: 'sha256:open-prices-snapshot',
      rawSnapshotRef: 'raw://open-prices-smoke/source-run/sha256-open-prices-snapshot',
      acceptedObservations: [
        {
          product: {
            id: 'off-5202390016912',
            canonicalName: 'Just Like Mature Cheddar Slices',
            brand: 'Violife',
            categoryId: 'plant-based-cheese',
            packageSize: 200,
            packageUnit: 'g',
            comparableUnit: 'kg'
          },
          alias: {
            rawName: 'Just Like Mature Cheddar Slices',
            sourceType: 'official_api',
            matchedProductId: 'off-5202390016912',
            matchConfidence: 0.95,
            reviewedByHuman: false
          },
          priceObservation: {
            productId: 'off-5202390016912',
            retailerProductId: 'open-prices-price-123',
            chainId: 'ica-kvantum',
            observedAt: '2026-05-19T00:00:00.000Z',
            price: 32.13,
            unitPrice: 160.65,
            currency: 'SEK',
            priceType: 'online',
            sourceType: 'official_api',
            sourceUrl: 'https://prices.openfoodfacts.org/api/v1/prices?currency=SEK&size=10',
            parserVersion: 'open-prices-v1',
            rawSnapshotRef: 'raw://open-prices-smoke/source-run/sha256-open-prices-snapshot',
            sourceRunId: 'source-run-open-prices',
            provenance: {
              sourceType: 'official_api',
              sourceUrl: 'https://prices.openfoodfacts.org/api/v1/prices?currency=SEK&size=10',
              observedAt: '2026-05-19T00:00:00.000Z',
              parserVersion: 'open-prices-v1',
              rawSnapshotRef: 'raw://open-prices-smoke/source-run/sha256-open-prices-snapshot',
              sourceRunId: 'source-run-open-prices'
            },
            confidenceScore: 0.95,
            isOnlinePrice: true,
            isInstorePrice: false
          },
          promotionObservation: null
        }
      ]
    };

    assert.deepEqual(await persistOpenPricesArtifact(executor, artifact), {
      status: 'persisted',
      sourceRunId: 'source-run-1',
      acceptedCount: 1,
      rawRecordIds: ['raw-record-1'],
      observationIds: ['observation-1'],
      productIds: ['product-open-prices'],
      chainIds: ['chain-open-prices']
    });

    const sourceRunCall = executor.calls.find((call) => call.sql.includes('insert into source_runs'));
    assert.deepEqual(sourceRunCall?.params.slice(0, 6), [
      'official_api',
      'Open Food Facts Open Prices',
      artifact.sourceUrl,
      artifact.retrievedAt,
      null,
      'running'
    ]);
    assert.match(String(sourceRunCall?.params[6]), /"contentHash":"sha256:open-prices-snapshot"/);

    const chainCall = executor.calls.find((call) => call.sql.includes('insert into chains'));
    assert.match(chainCall?.sql ?? '', /on conflict \(slug\) do update/);
    assert.deepEqual(chainCall?.params, ['ica-kvantum', 'ica-kvantum', 'SE']);

    const productCall = executor.calls.find((call) => call.sql.includes('insert into products'));
    assert.match(productCall?.sql ?? '', /on conflict \(slug\) do update/);
    assert.deepEqual(productCall?.params.slice(0, 7), [
      'off-5202390016912',
      'Just Like Mature Cheddar Slices',
      'Violife',
      ['plant-based-cheese'],
      200,
      'g',
      'kg'
    ]);

    const aliasCall = executor.calls.find((call) => call.sql.includes('insert into aliases'));
    assert.deepEqual(aliasCall?.params.slice(0, 6), [
      'product-open-prices',
      'Just Like Mature Cheddar Slices',
      'just like mature cheddar slices',
      'import',
      'sha256:open-prices-snapshot',
      0.95
    ]);

    const rawRecordCall = executor.calls.find((call) => call.sql.includes('insert into raw_records'));
    assert.deepEqual(rawRecordCall?.params.slice(0, 4), [
      'source-run-1',
      'price',
      'open-prices-price-123',
      '2026-05-19T00:00:00.000Z'
    ]);
    const payload = JSON.parse(String(rawRecordCall?.params[4])) as Record<string, unknown>;
    assert.equal('body' in payload, false);
    assert.match(String(rawRecordCall?.params[5]), /^sha256:/);
    assert.match(String(rawRecordCall?.params[6]), /"rawSnapshotRef":"raw:\/\/open-prices-smoke\/source-run\/sha256-open-prices-snapshot"/);

    const observationCall = executor.calls.find((call) => call.sql.includes('insert into observations'));
    assert.deepEqual(observationCall?.params.slice(0, 11), [
      'product-open-prices',
      'chain-open-prices',
      null,
      'source-run-1',
      'raw-record-1',
      'open-prices-price-123',
      'online',
      32.13,
      null,
      160.65,
      'SEK'
    ]);
    assert.equal(observationCall?.params[20], 0.95);
    assert.match(String(observationCall?.params[21]), /"contentHash":"sha256:open-prices-snapshot"/);

    const finishCall = executor.calls.find((call) => call.sql.includes('update source_runs'));
    assert.deepEqual(finishCall?.params, ['source-run-1', null, 'succeeded', null]);
  });

  it('fails closed before database writes when an artifact has no passed accepted observations', async () => {
    const executor = new RecordingQueryExecutor();

    await assert.rejects(
      persistOpenPricesArtifact(executor, {
        status: 'failed',
        sourceUrl: 'https://prices.openfoodfacts.org/api/v1/prices',
        retrievedAt: '2026-05-20T10:24:58.072Z',
        contentHash: 'sha256:open-prices-snapshot',
        rawSnapshotRef: 'raw://open-prices-smoke/source-run/sha256-open-prices-snapshot',
        acceptedObservations: []
      }),
      /passed Open Prices artifact with at least one accepted observation/
    );
    assert.equal(executor.calls.length, 0);
  });
});

describe('createPostgresPriceObservationWriter', () => {
  it('persists immutable observations before rolling up latest prices', async () => {
    const executor = new RecordingQueryExecutor();
    const writer = createPostgresPriceObservationWriter(executor);

    assert.deepEqual(
      await writer.recordPriceObservation({
        productId: 'product-1',
        chainId: 'chain-1',
        storeId: 'store-1',
        sourceRunId: 'run-1',
        rawRecordId: 'raw-1',
        retailerProductRef: 'retailer-1',
        priceType: 'promotion',
        price: 49.9,
        regularPrice: 69.9,
        unitPrice: 110.8889,
        currency: 'SEK',
        quantity: 450,
        quantityUnit: 'g',
        promotionText: 'Veckokampanj',
        promotionStartsOn: '2026-05-18',
        promotionEndsOn: '2026-05-24',
        memberRequired: true,
        observedAt: '2026-05-20T08:00:00.000Z',
        validFrom: '2026-05-18T00:00:00.000Z',
        validUntil: '2026-05-24T23:59:59.000Z',
        confidence: 0.91,
        provenance: { sourceType: 'retailer_api', sourceName: 'Willys', extractionRule: 'weekly-offers-v1' }
      }),
      { observationId: 'observation-1' }
    );

    assert.match(executor.calls[0]!.sql, /insert into observations/);
    assert.match(executor.calls[0]!.sql, /returning id/);
    assert.deepEqual(executor.calls[0]!.params.slice(0, 11), [
      'product-1',
      'chain-1',
      'store-1',
      'run-1',
      'raw-1',
      'retailer-1',
      'promotion',
      49.9,
      69.9,
      110.8889,
      'SEK'
    ]);
    assert.equal(executor.calls[0]!.params[21], JSON.stringify({ sourceType: 'retailer_api', sourceName: 'Willys', extractionRule: 'weekly-offers-v1' }));

    assert.match(executor.calls[1]!.sql, /insert into latest_prices/);
    assert.match(executor.calls[1]!.sql, /on conflict \(product_id, chain_id, store_id, price_type\) do update/);
    assert.match(executor.calls[1]!.sql, /where latest_prices\.observed_at <= excluded\.observed_at/);
    assert.deepEqual(executor.calls[1]!.params, [
      'product-1',
      'chain-1',
      'store-1',
      'promotion',
      'observation-1',
      49.9,
      69.9,
      110.8889,
      'SEK',
      '2026-05-20T08:00:00.000Z',
      0.91,
      JSON.stringify({ sourceType: 'retailer_api', sourceName: 'Willys', extractionRule: 'weekly-offers-v1' })
    ]);
  });

  it('fails closed when the observation insert does not return an id', async () => {
    const executor = new RecordingQueryExecutor();
    executor.observationId = undefined;
    const writer = createPostgresPriceObservationWriter(executor);

    await assert.rejects(
      writer.recordPriceObservation({
        productId: 'product-1',
        chainId: 'chain-1',
        priceType: 'online',
        price: 14.9,
        unitPrice: 14.9,
        observedAt: '2026-05-20T08:00:00.000Z',
        confidence: 0.82,
        provenance: { sourceType: 'retailer_page' }
      }),
      /Price observation insert did not return an id/
    );
    assert.equal(executor.calls.some((call) => call.sql.includes('insert into latest_prices')), false);
  });
});

describe('createPostgresPriceReader', () => {
  it('lists latest prices for a product with numeric, date, and provenance mapping', async () => {
    const executor = new RecordingQueryExecutor();
    const reader = createPostgresPriceReader(executor);

    assert.deepEqual(await reader.listLatestPricesForProduct('product-1'), [
      {
        productId: 'product-1',
        chainId: 'chain-1',
        priceType: 'online',
        observationId: 'observation-1',
        price: 49.9,
        unitPrice: 110.8889,
        currency: 'SEK',
        observedAt: '2026-05-20T08:00:00.000Z',
        confidence: 0.91,
        provenance: { sourceType: 'retailer_api', sourceName: 'Willys' }
      },
      {
        productId: 'product-1',
        chainId: 'chain-1',
        storeId: 'store-1',
        priceType: 'promotion',
        observationId: 'observation-2',
        price: 44.9,
        regularPrice: 59.9,
        unitPrice: 99.7778,
        currency: 'SEK',
        observedAt: '2026-05-20T09:00:00.000Z',
        confidence: 0.88,
        provenance: { sourceType: 'retailer_page', campaign: 'weekly' }
      }
    ]);

    assert.match(executor.calls[0]!.sql, /from latest_prices/);
    assert.match(executor.calls[0]!.sql, /where product_id = \$1/);
    assert.match(executor.calls[0]!.sql, /order by observed_at desc, chain_id, store_id, price_type/);
    assert.deepEqual(executor.calls[0]!.params, ['product-1']);
  });

  it('lists price observation history with bounded filters and full provenance mapping', async () => {
    const executor = new RecordingQueryExecutor();
    const reader = createPostgresPriceReader(executor);

    assert.deepEqual(
      await reader.listPriceObservationHistory({
        productId: 'product-1',
        chainId: 'chain-1',
        storeId: 'store-1',
        priceType: 'promotion',
        observedFrom: '2026-05-01T00:00:00.000Z',
        observedTo: '2026-05-31T23:59:59.000Z',
        limit: 20
      }),
      [
        {
          observationId: 'observation-3',
          productId: 'product-1',
          chainId: 'chain-1',
          storeId: 'store-1',
          sourceRunId: 'source-run-1',
          rawRecordId: 'raw-record-1',
          retailerProductRef: 'retailer-1',
          priceType: 'promotion',
          price: 44.9,
          regularPrice: 59.9,
          unitPrice: 99.7778,
          currency: 'SEK',
          quantity: 450,
          quantityUnit: 'g',
          promotionText: 'Veckokampanj',
          promotionStartsOn: '2026-05-18',
          promotionEndsOn: '2026-05-24',
          memberRequired: true,
          observedAt: '2026-05-20T09:00:00.000Z',
          validFrom: '2026-05-18T00:00:00.000Z',
          validUntil: '2026-05-24T23:59:59.000Z',
          confidence: 0.88,
          provenance: { sourceType: 'retailer_page', campaign: 'weekly' }
        },
        {
          observationId: 'observation-4',
          productId: 'product-1',
          chainId: 'chain-2',
          priceType: 'online',
          price: 49.9,
          unitPrice: 110.8889,
          currency: 'SEK',
          memberRequired: false,
          observedAt: '2026-05-20T08:00:00.000Z',
          confidence: 0.91,
          provenance: { sourceType: 'retailer_api' }
        }
      ]
    );

    assert.match(executor.calls[0]!.sql, /from observations/);
    assert.match(executor.calls[0]!.sql, /where product_id = \$1/);
    assert.match(executor.calls[0]!.sql, /\$2::uuid is null or chain_id = \$2::uuid/);
    assert.match(executor.calls[0]!.sql, /\$3::uuid is null or store_id = \$3::uuid/);
    assert.match(executor.calls[0]!.sql, /\$4::text is null or price_type = \$4/);
    assert.match(executor.calls[0]!.sql, /order by observed_at desc, chain_id, store_id, price_type, id/);
    assert.deepEqual(executor.calls[0]!.params, [
      'product-1',
      'chain-1',
      'store-1',
      'promotion',
      '2026-05-01T00:00:00.000Z',
      '2026-05-31T23:59:59.000Z',
      20
    ]);
  });

  it('clamps price observation history limits to a safe range', async () => {
    const executor = new RecordingQueryExecutor();
    const reader = createPostgresPriceReader(executor);

    await reader.listPriceObservationHistory({ productId: 'product-1', limit: 5000 });
    await reader.listPriceObservationHistory({ productId: 'product-1', limit: 0 });

    assert.deepEqual(executor.calls[0]!.params, ['product-1', null, null, null, null, null, 1000]);
    assert.deepEqual(executor.calls[1]!.params, ['product-1', null, null, null, null, null, 1]);
  });
});
