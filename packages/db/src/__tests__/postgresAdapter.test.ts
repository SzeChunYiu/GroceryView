import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPostgresPriceObservationWriter,
  createPostgresPriceReader,
  createPostgresRepository,
  createPostgresSourceRecordReader,
  createPostgresSourceRecordWriter,
  type QueryExecutor
} from '../index.js';

class RecordingQueryExecutor implements QueryExecutor {
  calls: Array<{ sql: string; params: unknown[] }> = [];
  basketId: string | number | undefined = 'basket-1';
  observationId: string | undefined = 'observation-1';
  sourceRunId: string | undefined = 'source-run-1';
  rawRecordId: string | undefined = 'raw-record-1';
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
    if (sql.includes('insert into raw_records')) return this.rawRecordId === undefined ? ([] as T[]) : ([{ id: this.rawRecordId }] as T[]);
    if (sql.includes('from raw_records')) return this.rawRecordRows as T[];
    if (sql.includes('insert into observations')) return this.observationId === undefined ? ([] as T[]) : ([{ id: this.observationId }] as T[]);
    if (sql.includes('from latest_prices')) return this.latestPriceRows as T[];
    if (sql.includes('from observations')) return this.observationHistoryRows as T[];
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
