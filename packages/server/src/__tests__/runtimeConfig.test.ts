import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createSessionToken } from '@groceryview/auth';
import type { PersistedNotificationTask } from '@groceryview/notifications';
import {
  buildHealthReport,
  buildRuntimeAuthOptions,
  createRuntimeHttpService,
  createRuntimeHttpHandler,
  isDirectServerEntrypoint,
  loadRuntimeConfig,
  type RuntimePersistenceRepository,
  type SubscriptionEntitlementLookupRecord
} from '../index.js';

function signBillingWebhookBody(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

class RecordingPgPool {
  calls: Array<{ text: string; values: unknown[] }> = [];
  closed = false;
  private entitlementRow: unknown | null = null;
  private watchlistRows: Array<{
    product_id: string;
    target_price: number | null;
    alert_deal_score_at: number | null;
    favorite_stores_only: boolean;
    allowed_price_types: string[];
  }> = [
    {
      product_id: 'product-coffee',
      target_price: 50,
      alert_deal_score_at: null,
      favorite_stores_only: true,
      allowed_price_types: ['promotion']
    },
    {
      product_id: 'product-milk',
      target_price: null,
      alert_deal_score_at: 80,
      favorite_stores_only: true,
      allowed_price_types: ['promotion']
    }
  ];

  async query(text: string, values: unknown[] = []) {
    this.calls.push({ text, values });
    if (text.includes('information_schema.tables')) {
      return {
        rows: [
          'chains',
          'products',
          'source_runs',
          'raw_records',
          'retailer_source_policies',
          'observations',
          'observations_v2',
          'latest_prices',
          'price_daily',
          'price_weekly',
          'app_users',
          'favorite_stores',
          'user_preferences',
          'watchlist_items',
          'weekly_baskets',
          'basket_items',
          'basket_import_review_items',
          'human_review_assignments',
          'human_reviewers',
          'community_reporter_trust',
          'subscription_entitlements',
          'notification_tasks',
          'notification_suppressions',
          'alert_rules',
          'pantry_items',
          'receipt_uploads',
          'receipt_items',
          'household_plans',
          'household_members',
          'household_basket_items',
          'household_watchlist_items',
          'household_favorite_stores'
        ].map((table_name) => ({ table_name }))
      };
    }
    if (text.includes('select version from schema_migrations')) {
      return {
        rows: [
          '001_groceryview_schema',
          '002_repository_support_schema',
          '003_subscription_entitlements',
          '004_alert_rules',
          '005_pantry_inventory',
          '006_source_runs_official_api',
          '007_receipt_uploads',
          '008_household_plans',
          '009_retailer_source_policies',
          '010_basket_import_reviews',
          '010_commodity_taxonomy',
          '011_multi_vertical_domains',
          '012_price_rollups',
          '013_observations_partitioning'
        ].map((version) => ({ version }))
      };
    }
    if (text.includes('insert into subscription_entitlements')) {
      this.entitlementRow = {
        user_id: values[0],
        tier: values[1],
        plan: values[2],
        status: values[3],
        current_period_ends_at: values[4],
        provider: values[5],
        provider_customer_id: values[6],
        provider_subscription_id: values[7],
        updated_at: values[8]
      };
      return { rows: [] };
    }
    if (text.includes('from subscription_entitlements')) {
      const row = this.entitlementRow as { user_id?: string } | null;
      return { rows: row?.user_id === values[0] ? [row] : [] };
    }
    if (text.includes("observations.price_type in ('promotion', 'member')")) {
      return {
        rows: [{
          observation_id: 'obs-runtime-flyer-coffee',
          source_run_id: 'run-runtime-flyer',
          raw_record_id: 'raw-runtime-flyer',
          price_type: 'promotion',
          price: '49.90',
          regular_price: '64.90',
          currency: 'SEK',
          promotion_text: 'Runtime weekly flyer',
          promotion_starts_on: '2026-05-19',
          promotion_ends_on: '2026-05-25',
          member_required: false,
          observed_at: '2026-05-19T06:30:00.000Z',
          valid_from: '2026-05-19T00:00:00.000Z',
          valid_until: '2026-05-25T21:59:59.000Z',
          confidence: '0.9200',
          provenance: { sourceUrl: 'https://example.test/runtime-flyer' },
          product_id: 'product-coffee',
          product_slug: 'coffee',
          product_name: 'Zoégas Coffee 450g',
          category_path: ['coffee'],
          chain_id: 'chain-willys',
          chain_slug: 'willys',
          chain_name: 'Willys',
          store_id: 'store-willys',
          store_slug: 'willys-odenplan',
          store_name: 'Willys Odenplan',
          store_city: 'Stockholm'
        }]
      };
    }
    if (text.includes('from stores') && text.includes('join chains') && text.includes('where stores.slug = $1')) {
      return {
        rows: values[0] === 'willys-odenplan'
          ? [{ store_slug: 'willys-odenplan', store_name: 'Willys Odenplan', chain_slug: 'willys' }]
          : []
      };
    }
    if (text.includes('select store_id from favorite_stores')) {
      return { rows: [{ store_id: 'store-willys' }] };
    }
    if (text.includes('select slug as store_slug from stores')) {
      return { rows: [{ store_slug: 'willys-odenplan' }] };
    }
    if (text.includes('select product_id, target_price, alert_deal_score_at, favorite_stores_only, allowed_price_types from watchlist_items')) {
      return { rows: this.watchlistRows };
    }
    if (text.includes('select id::text from watchlist_items')) {
      return { rows: [] };
    }
    if (text.includes('select id::text as product_id') && text.includes('slug as product_slug')) {
      return { rows: [{ product_id: 'product-coffee', product_slug: 'coffee' }] };
    }
    if (text.includes('insert into watchlist_items')) {
      this.watchlistRows = [{
        product_id: values[1] as string,
        target_price: values[2] as number,
        alert_deal_score_at: null,
        favorite_stores_only: values[4] as boolean,
        allowed_price_types: values[5] as string[]
      }];
      return { rows: [] };
    }
    if (text.includes('from latest_prices')) {
      return {
        rows: [{
          product_id: 'product-coffee',
          product_slug: 'coffee',
          product_name: 'Zoégas Coffee 450g',
          store_slug: 'willys-odenplan',
          store_name: 'Willys Odenplan',
          price: '49.90',
          price_type: 'promotion',
          confidence: '0.9200',
          observed_at: '2026-05-19T06:30:00.000Z'
        }]
      };
    }
    if (text.includes('left join latest_prices')) {
      return {
        rows: [
          {
            product_id: 'coffee',
            category_id: 'coffee',
            observed_chain_ids: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
            observed_store_ids: ['willys-odenplan', 'coop-odenplan'],
            observed_price_types: ['promotion', 'online'],
            observed_store_price_types: ['willys-odenplan:online', 'coop-odenplan:promotion']
          },
          {
            product_id: 'milk',
            category_id: 'dairy',
            observed_chain_ids: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
            observed_store_ids: ['willys-odenplan'],
            observed_price_types: ['online'],
            observed_store_price_types: ['willys-odenplan:online']
          }
        ]
      };
    }
    return { rows: [] };
  }

  async end() {
    this.closed = true;
  }
}

describe('runtime config', () => {
  it('loads production runtime config with required secrets and urls', () => {
    const config = loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      SENDGRID_API_KEY: 'sg-runtime-key',
      SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
      EXPO_PUSH_ACCESS_TOKEN: 'expo-runtime-token',
      BILLING_WEBHOOK_SECRET: 'billing-webhook-secret',
      STRIPE_SECRET_KEY: 'sk_test_runtime',
      STRIPE_PRICE_PREMIUM_MONTHLY: 'price_monthly_runtime',
      STRIPE_PRICE_PREMIUM_YEARLY: 'price_yearly_runtime',
      METRICS_TOKEN: 'metrics-token',
      OCR_SPACE_API_KEY: 'ocr-runtime-key',
      OCR_SPACE_HEALTHCHECK_IMAGE_URL: 'https://groceryview.example/fixtures/receipt-healthcheck.jpg',
      OPENFOODFACTS_USER_AGENT: 'GroceryView/1.0 contact@groceryview.se',
      OPENFOODFACTS_HEALTHCHECK_BARCODE: '0735000123456',
      S3_ENDPOINT: 'https://storage.example',
      S3_REGION: 'eu-north-1',
      S3_BUCKET: 'groceryview-receipts',
      S3_ACCESS_KEY_ID: 'runtime-access-key',
      S3_SECRET_ACCESS_KEY: 'runtime-secret-key',
      SCAN_UPLOAD_MAX_BYTES: '7654321',
      CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
        targetProducts: ['coffee'],
        targetCategories: ['coffee'],
        targetChains: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
        targetStores: ['willys-odenplan'],
        targetPriceTypes: ['online'],
        requireEveryStorePriceType: true
      })
    });

    assert.deepEqual(config, {
      nodeEnv: 'production',
      port: 8080,
      authSecret: 'super-secret',
      databaseUrl: 'postgres://example',
      publicWebUrl: 'https://groceryview.example',
      notificationWebhookSecret: 'webhook-secret',
      sendgridApiKey: 'sg-runtime-key',
      sendgridFromEmail: 'alerts@groceryview.se',
      expoPushAccessToken: 'expo-runtime-token',
      billingWebhookSecret: 'billing-webhook-secret',
      stripeSecretKey: 'sk_test_runtime',
      stripePriceIds: {
        premium_monthly: 'price_monthly_runtime',
        premium_yearly: 'price_yearly_runtime'
      },
      metricsToken: 'metrics-token',
      ocrSpaceApiKey: 'ocr-runtime-key',
      ocrSpaceHealthcheckImageUrl: 'https://groceryview.example/fixtures/receipt-healthcheck.jpg',
      openFoodFactsUserAgent: 'GroceryView/1.0 contact@groceryview.se',
      openFoodFactsHealthcheckBarcode: '0735000123456',
      s3Endpoint: 'https://storage.example',
      s3Region: 'eu-north-1',
      s3Bucket: 'groceryview-receipts',
      s3AccessKeyId: 'runtime-access-key',
      s3SecretAccessKey: 'runtime-secret-key',
      scanUploadMaxBytes: 7654321,
      catalogCoverageTargets: {
        targetProducts: ['coffee'],
        targetCategories: ['coffee'],
        targetChains: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
        targetStores: ['willys-odenplan'],
        targetPriceTypes: ['online'],
        requireEveryProductInEveryStore: true,
        requireEveryStorePriceType: true
      }
    });
  });



  it('wires OpenFoodFacts barcode lookup into runtime scan providers', async () => {
    const config = loadRuntimeConfig({ NODE_ENV: 'development', OPENFOODFACTS_USER_AGENT: 'GroceryView/1.0 contact@groceryview.se' });
    const authOptions = buildRuntimeAuthOptions(config, {
      scanProviderFetch: async () => new Response(JSON.stringify({
        status: 1,
        code: '0735000123456',
        product: { product_name: 'Zoegas Skånerost 450g' }
      }), { status: 200 })
    });

    const result = await authOptions.scanProviders?.barcode?.lookup('0735000123456');

    assert.deepEqual(result, {
      productId: 'openfoodfacts:0735000123456',
      barcode: '0735000123456',
      confidence: 0.86,
      needsHumanReview: false
    });
  });

  it('wires OCR.space receipt scanning into runtime scan providers', async () => {
    const config = loadRuntimeConfig({ NODE_ENV: 'development', OCR_SPACE_API_KEY: 'ocr-runtime-key' });
    const authOptions = buildRuntimeAuthOptions(config, {
      scanProviderFetch: async () => new Response(JSON.stringify({
        IsErroredOnProcessing: false,
        ParsedResults: [{ ParsedText: 'KAFFE 49.90\nTOTAL 49.90' }]
      }), { status: 200 })
    });

    const result = await authOptions.scanProviders?.receiptOcr?.parse('private-upload://receipt-runtime');

    assert.deepEqual(result, {
      rows: [{ rawName: 'KAFFE', itemTotal: 49.9, confidence: 0.5 }],
      totalAmount: 49.9,
      confidence: 0.5
    });
  });


  it('runs runtime scan provider health checks before marking scanning readiness ready', async () => {
    const service = createRuntimeHttpService({
      NODE_ENV: 'development',
      METRICS_TOKEN: 'metrics-secret',
      OCR_SPACE_API_KEY: 'ocr-runtime-key',
      OCR_SPACE_HEALTHCHECK_IMAGE_URL: 'https://groceryview.example/fixtures/receipt-healthcheck.jpg',
      OPENFOODFACTS_USER_AGENT: 'GroceryView/1.0 contact@groceryview.se',
      OPENFOODFACTS_HEALTHCHECK_BARCODE: '0735000123456'
    }, {
      scanProviderFetch: async (url) => {
        const urlText = String(url);
        if (urlText.includes('openfoodfacts')) {
          return new Response(JSON.stringify({
            status: 1,
            code: '0735000123456',
            product: { product_name: 'Zoegas Skånerost 450g' }
          }), { status: 200 });
        }
        return new Response(JSON.stringify({
          IsErroredOnProcessing: false,
          ParsedResults: [{ ParsedText: 'KAFFE 49.90\nTOTAL 49.90' }]
        }), { status: 200 });
      }
    });

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/scanning', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));

      assert.equal(response.status, 200);
      const body = await response.json() as { status: string; blockers: string[]; evidence: string[] };
      assert.equal(body.status, 'ready');
      assert.deepEqual(body.blockers, []);
      assert.equal(body.evidence.includes('scan_provider_health_pass:barcode'), true);
      assert.equal(body.evidence.includes('scan_provider_health_pass:receiptOcr'), true);
      assert.equal(JSON.stringify(body).includes('ocr-runtime-key'), false);
    } finally {
      await service.close();
    }
  });

  it('keeps runtime scanning readiness blocked until scan provider healthcheck payloads are configured', async () => {
    const service = createRuntimeHttpService({
      NODE_ENV: 'development',
      METRICS_TOKEN: 'metrics-secret',
      OCR_SPACE_API_KEY: 'ocr-runtime-key',
      OPENFOODFACTS_USER_AGENT: 'GroceryView/1.0 contact@groceryview.se'
    });

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/scanning', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));

      assert.equal(response.status, 503);
      const body = await response.json() as { status: string; blockers: string[] };
      assert.equal(body.status, 'blocked');
      assert.equal(body.blockers.includes('scan_provider_health_not_run:barcode'), true);
      assert.equal(body.blockers.includes('scan_provider_health_not_run:receiptOcr'), true);
    } finally {
      await service.close();
    }
  });

  it('creates a runtime S3-compatible scan upload ticket before marking storage readiness ready', async () => {
    const service = createRuntimeHttpService({
      NODE_ENV: 'development',
      METRICS_TOKEN: 'metrics-secret',
      S3_ENDPOINT: 'https://storage.example',
      S3_REGION: 'eu-north-1',
      S3_BUCKET: 'groceryview-receipts',
      S3_ACCESS_KEY_ID: 'runtime-access-key',
      S3_SECRET_ACCESS_KEY: 'runtime-secret-key',
      SCAN_UPLOAD_MAX_BYTES: '7654321'
    }, { now: new Date('2026-05-23T12:00:00.000Z') });

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/scan-upload-storage', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));

      assert.equal(response.status, 200);
      const body = await response.json() as { status: string; blockers: string[]; evidence: string[] };
      assert.equal(body.status, 'ready');
      assert.deepEqual(body.blockers, []);
      assert.equal(body.evidence.includes('scan_upload_storage_ticket_created'), true);
      assert.equal(body.evidence.includes('scan_upload_storage_private_payload_uri'), true);
      assert.equal(JSON.stringify(body).includes('runtime-secret-key'), false);
    } finally {
      await service.close();
    }
  });

  it('keeps runtime scan upload storage readiness blocked until S3 credentials are configured', async () => {
    const service = createRuntimeHttpService({
      NODE_ENV: 'development',
      METRICS_TOKEN: 'metrics-secret'
    });

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/scan-upload-storage', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));

      assert.equal(response.status, 503);
      const body = await response.json() as { status: string; blockers: string[] };
      assert.equal(body.status, 'blocked');
      assert.equal(body.blockers.includes('scan_upload_storage_not_configured'), true);
    } finally {
      await service.close();
    }
  });

  it('runs a runtime scan upload CORS preflight before marking upload CORS ready', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const service = createRuntimeHttpService({
      NODE_ENV: 'development',
      METRICS_TOKEN: 'metrics-secret',
      PUBLIC_WEB_URL: 'https://app.groceryview.example',
      S3_ENDPOINT: 'https://storage.example',
      S3_REGION: 'eu-north-1',
      S3_BUCKET: 'groceryview-receipts',
      S3_ACCESS_KEY_ID: 'runtime-access-key',
      S3_SECRET_ACCESS_KEY: 'runtime-secret-key'
    }, {
      now: new Date('2026-05-23T12:00:00.000Z'),
      scanUploadCorsFetch: async (url, init) => {
        calls.push({ url: String(url), init });
        return new Response(null, {
          status: 204,
          headers: {
            'access-control-allow-origin': 'https://app.groceryview.example',
            'access-control-allow-methods': 'GET, PUT, OPTIONS',
            'access-control-allow-headers': 'content-type, x-amz-meta-scan-id'
          }
        });
      }
    });

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/scan-upload-cors', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));

      assert.equal(response.status, 200);
      const body = await response.json() as { status: string; blockers: string[]; evidence: string[] };
      assert.equal(body.status, 'ready');
      assert.deepEqual(body.blockers, []);
      assert.equal(body.evidence.includes('scan_upload_cors_preflight_passed'), true);
      assert.equal(body.evidence.includes('scan_upload_cors_allows_put'), true);
      assert.equal(JSON.stringify(body).includes('runtime-secret-key'), false);
      assert.equal(calls.length, 1);
      assert.equal(calls[0]?.init?.method, 'OPTIONS');
      assert.equal((calls[0]?.init?.headers as Headers).get('origin'), 'https://app.groceryview.example');
      assert.equal((calls[0]?.init?.headers as Headers).get('access-control-request-method'), 'PUT');
    } finally {
      await service.close();
    }
  });

  it('keeps runtime scan upload CORS readiness blocked until origin and storage are configured', async () => {
    const service = createRuntimeHttpService({
      NODE_ENV: 'development',
      METRICS_TOKEN: 'metrics-secret',
      S3_ENDPOINT: 'https://storage.example',
      S3_REGION: 'eu-north-1',
      S3_BUCKET: 'groceryview-receipts',
      S3_ACCESS_KEY_ID: 'runtime-access-key',
      S3_SECRET_ACCESS_KEY: 'runtime-secret-key'
    });

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/scan-upload-cors', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));

      assert.equal(response.status, 503);
      const body = await response.json() as { status: string; blockers: string[] };
      assert.equal(body.status, 'blocked');
      assert.equal(body.blockers.includes('scan_upload_cors_origin_not_configured'), true);
    } finally {
      await service.close();
    }
  });

  it('performs a runtime scan upload write before marking upload write ready', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const service = createRuntimeHttpService({
      NODE_ENV: 'development',
      METRICS_TOKEN: 'metrics-secret',
      S3_ENDPOINT: 'https://storage.example',
      S3_REGION: 'eu-north-1',
      S3_BUCKET: 'groceryview-receipts',
      S3_ACCESS_KEY_ID: 'runtime-access-key',
      S3_SECRET_ACCESS_KEY: 'runtime-secret-key'
    }, {
      now: new Date('2026-05-23T12:00:00.000Z'),
      scanUploadWriteFetch: async (url, init) => {
        calls.push({ url: String(url), init });
        return new Response(null, { status: 200 });
      }
    });

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/scan-upload-write', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));

      assert.equal(response.status, 200);
      const body = await response.json() as { status: string; blockers: string[]; evidence: string[] };
      assert.equal(body.status, 'ready');
      assert.deepEqual(body.blockers, []);
      assert.equal(body.evidence.includes('scan_upload_write_ticket_created'), true);
      assert.equal(body.evidence.includes('scan_upload_write_put_succeeded'), true);
      assert.equal(JSON.stringify(body).includes('runtime-secret-key'), false);
      assert.equal(calls.length, 1);
      assert.equal(calls[0]?.init?.method, 'PUT');
      assert.equal((calls[0]?.init?.headers as Headers).get('content-type'), 'image/jpeg');
      assert.equal(calls[0]?.init?.body, 'x');
    } finally {
      await service.close();
    }
  });

  it('keeps runtime scan upload write readiness blocked until storage is configured', async () => {
    const service = createRuntimeHttpService({
      NODE_ENV: 'development',
      METRICS_TOKEN: 'metrics-secret'
    });

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/scan-upload-write', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));

      assert.equal(response.status, 503);
      const body = await response.json() as { status: string; blockers: string[] };
      assert.equal(body.status, 'blocked');
      assert.equal(body.blockers.includes('scan_upload_storage_not_configured'), true);
    } finally {
      await service.close();
    }
  });

  it('loads catalog coverage targets from runtime environment JSON', () => {
    const config = loadRuntimeConfig({
      NODE_ENV: 'development',
      CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
        targetProducts: ['coffee', 'milk'],
        targetCategories: ['coffee', 'dairy'],
        targetChains: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
        targetStores: ['willys-odenplan', 'coop-odenplan'],
        targetPriceTypes: ['online'],
        requireEveryProductInEveryStore: true,
        requireEveryStorePriceType: true
      })
    });

    assert.deepEqual(config.catalogCoverageTargets, {
      targetProducts: ['coffee', 'milk'],
      targetCategories: ['coffee', 'dairy'],
      targetChains: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
      targetStores: ['willys-odenplan', 'coop-odenplan'],
      targetPriceTypes: ['online'],
      requireEveryProductInEveryStore: true,
      requireEveryStorePriceType: true
    });
  });

  it('fails closed when catalog coverage targets omit required daily chains', () => {
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'development',
      CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
        targetProducts: ['coffee'],
        targetCategories: ['coffee'],
        targetChains: ['willys', 'coop'],
        targetStores: ['willys-odenplan'],
        targetPriceTypes: ['online'],
        requireEveryStorePriceType: true
      })
    }), /targetChains is missing required chains: ica, hemkop, lidl, city_gross/);
  });

  it('fails closed when production secrets are missing', () => {
    assert.throws(() => loadRuntimeConfig({ NODE_ENV: 'production', PORT: '8080' }), /AUTH_SECRET is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example'
    }), /NOTIFICATION_WEBHOOK_SECRET is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret'
    }), /SENDGRID_API_KEY is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      SENDGRID_API_KEY: 'sg-runtime-key'
    }), /SENDGRID_FROM_EMAIL is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      SENDGRID_API_KEY: 'sg-runtime-key',
      SENDGRID_FROM_EMAIL: 'alerts@groceryview.se'
    }), /EXPO_PUSH_ACCESS_TOKEN is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      SENDGRID_API_KEY: 'sg-runtime-key',
      SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
      EXPO_PUSH_ACCESS_TOKEN: 'expo-runtime-token'
    }), /BILLING_WEBHOOK_SECRET is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      SENDGRID_API_KEY: 'sg-runtime-key',
      SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
      EXPO_PUSH_ACCESS_TOKEN: 'expo-runtime-token',
      BILLING_WEBHOOK_SECRET: 'billing-webhook-secret'
    }), /METRICS_TOKEN is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      SENDGRID_API_KEY: 'sg-runtime-key',
      SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
      EXPO_PUSH_ACCESS_TOKEN: 'expo-runtime-token',
      BILLING_WEBHOOK_SECRET: 'billing-webhook-secret',
      METRICS_TOKEN: 'metrics-token'
    }), /OCR_SPACE_API_KEY is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      SENDGRID_API_KEY: 'sg-runtime-key',
      SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
      EXPO_PUSH_ACCESS_TOKEN: 'expo-runtime-token',
      BILLING_WEBHOOK_SECRET: 'billing-webhook-secret',
      METRICS_TOKEN: 'metrics-token',
      OCR_SPACE_API_KEY: 'ocr-runtime-key'
    }), /OCR_SPACE_HEALTHCHECK_IMAGE_URL is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      SENDGRID_API_KEY: 'sg-runtime-key',
      SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
      EXPO_PUSH_ACCESS_TOKEN: 'expo-runtime-token',
      BILLING_WEBHOOK_SECRET: 'billing-webhook-secret',
      METRICS_TOKEN: 'metrics-token',
      OCR_SPACE_API_KEY: 'ocr-runtime-key',
      OCR_SPACE_HEALTHCHECK_IMAGE_URL: 'https://groceryview.example/fixtures/receipt-healthcheck.jpg'
    }), /OPENFOODFACTS_USER_AGENT is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      SENDGRID_API_KEY: 'sg-runtime-key',
      SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
      EXPO_PUSH_ACCESS_TOKEN: 'expo-runtime-token',
      BILLING_WEBHOOK_SECRET: 'billing-webhook-secret',
      METRICS_TOKEN: 'metrics-token',
      OCR_SPACE_API_KEY: 'ocr-runtime-key',
      OCR_SPACE_HEALTHCHECK_IMAGE_URL: 'https://groceryview.example/fixtures/receipt-healthcheck.jpg',
      OPENFOODFACTS_USER_AGENT: 'GroceryView/1.0 contact@groceryview.se'
    }), /OPENFOODFACTS_HEALTHCHECK_BARCODE is required/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      SENDGRID_API_KEY: 'sg-runtime-key',
      SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
      EXPO_PUSH_ACCESS_TOKEN: 'expo-runtime-token',
      BILLING_WEBHOOK_SECRET: 'billing-webhook-secret',
      METRICS_TOKEN: 'metrics-token',
      OCR_SPACE_API_KEY: 'ocr-runtime-key',
      OCR_SPACE_HEALTHCHECK_IMAGE_URL: 'https://groceryview.example/fixtures/receipt-healthcheck.jpg',
      OPENFOODFACTS_USER_AGENT: 'GroceryView/1.0 contact@groceryview.se',
      OPENFOODFACTS_HEALTHCHECK_BARCODE: '0735000123456',
      S3_ENDPOINT: 'https://storage.example',
      S3_REGION: 'eu-north-1',
      S3_BUCKET: 'groceryview-receipts',
      S3_ACCESS_KEY_ID: 'runtime-access-key',
      S3_SECRET_ACCESS_KEY: 'runtime-secret-key'
    }), /CATALOG_COVERAGE_TARGETS_JSON is required/);
  });

  it('rejects invalid public web urls', () => {
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'development',
      PORT: '3000',
      PUBLIC_WEB_URL: 'groceryview.example'
    }), /PUBLIC_WEB_URL must be a valid absolute URL/);
    assert.throws(() => loadRuntimeConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      AUTH_SECRET: 'super-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'mailto:support@groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'webhook-secret',
      SENDGRID_API_KEY: 'sg-runtime-key',
      SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
      EXPO_PUSH_ACCESS_TOKEN: 'expo-runtime-token',
      BILLING_WEBHOOK_SECRET: 'billing-webhook-secret',
      METRICS_TOKEN: 'metrics-token',
      OCR_SPACE_API_KEY: 'ocr-runtime-key',
      OCR_SPACE_HEALTHCHECK_IMAGE_URL: 'https://groceryview.example/fixtures/receipt-healthcheck.jpg',
      OPENFOODFACTS_USER_AGENT: 'GroceryView/1.0 contact@groceryview.se',
      OPENFOODFACTS_HEALTHCHECK_BARCODE: '0735000123456',
      S3_ENDPOINT: 'https://storage.example',
      S3_REGION: 'eu-north-1',
      S3_BUCKET: 'groceryview-receipts',
      S3_ACCESS_KEY_ID: 'runtime-access-key',
      S3_SECRET_ACCESS_KEY: 'runtime-secret-key',
      CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
        targetProducts: ['coffee'],
        targetCategories: ['coffee'],
        targetChains: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
        targetStores: ['willys-odenplan']
      })
    }), /PUBLIC_WEB_URL must use http or https/);
  });

  it('builds a health report without exposing secrets', () => {
    const report = buildHealthReport(loadRuntimeConfig({ NODE_ENV: 'development', PORT: '3000' }));

    assert.deepEqual(report, {
      status: 'ok',
      service: 'groceryview-server',
      environment: 'development',
      hasDatabase: false,
      hasPublicWebUrl: false,
      hasAuthSecret: false,
      hasNotificationWebhookSecret: false,
      hasBillingWebhookSecret: false,
      hasMetricsToken: false,
      hasScanUploadStorage: false
    });
  });

  it('creates a runtime HTTP handler from deployment environment secrets', async () => {
    const handle = createRuntimeHttpHandler({
      NODE_ENV: 'development',
      PORT: '3000',
      AUTH_SECRET: 'auth-secret',
      DATABASE_URL: 'postgres://example',
      PUBLIC_WEB_URL: 'https://groceryview.example',
      NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
      BILLING_WEBHOOK_SECRET: 'billing-secret',
      METRICS_TOKEN: 'metrics-secret'
    });

    const health = await handle(new Request('http://localhost/api/health'));
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), {
      status: 'ok',
      service: 'groceryview-server',
      environment: 'development',
      hasDatabase: true,
      hasPublicWebUrl: true,
      hasAuthSecret: true,
      hasNotificationWebhookSecret: true,
      hasBillingWebhookSecret: true,
      hasMetricsToken: true,
      hasScanUploadStorage: false
    });

    const protectedAccountRoute = await handle(new Request('http://localhost/api/account/subscription-access?userId=user-1'));
    assert.equal(protectedAccountRoute.status, 401);

    const metricsRoute = await handle(new Request('http://localhost/api/metrics/notifications', {
      headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
    }));
    assert.equal(metricsRoute.status, 503);
  });

  it('creates runtime billing checkout sessions through the Stripe-compatible API without leaking secrets', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({
        id: 'cs_live_runtime_bridge',
        url: 'https://checkout.stripe.com/c/pay/cs_live_runtime_bridge'
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }) as typeof fetch;

    try {
      const handle = createRuntimeHttpHandler({
        NODE_ENV: 'development',
        AUTH_SECRET: 'runtime-auth-secret',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        STRIPE_SECRET_KEY: 'sk_test_runtime_secret',
        STRIPE_PRICE_PREMIUM_MONTHLY: 'price_monthly_runtime'
      });
      const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, 'runtime-auth-secret');

      const response = await handle(new Request('http://localhost/api/billing/checkout-sessions?userId=user-1', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: 'premium_monthly' })
      }));
      const responseBody = await response.json();

      assert.equal(response.status, 201);
      assert.deepEqual(responseBody, {
        provider: 'stripe_compatible',
        sessionId: 'cs_live_runtime_bridge',
        checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_live_runtime_bridge',
        plan: 'premium_monthly'
      });
      assert.equal(calls.length, 1);
      assert.equal(calls[0]?.url, 'https://api.stripe.com/v1/checkout/sessions');
      assert.match(calls[0]?.init?.headers instanceof Headers ? calls[0].init.headers.get('authorization') ?? '' : '', /^Basic /);
      const encodedBody = calls[0]?.init?.body as URLSearchParams;
      assert.equal(encodedBody.get('mode'), 'subscription');
      assert.equal(encodedBody.get('line_items[0][price]'), 'price_monthly_runtime');
      assert.equal(encodedBody.get('client_reference_id'), 'user-1');
      assert.equal(encodedBody.get('success_url'), 'https://groceryview.example/account?checkout=success&plan=premium_monthly');
      assert.equal(JSON.stringify(responseBody).includes('sk_test_runtime_secret'), false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('creates runtime billing portal sessions through the Stripe-compatible API without leaking secrets', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({
        id: 'bps_live_runtime_bridge',
        url: 'https://billing.stripe.com/p/session/bps_live_runtime_bridge'
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }) as typeof fetch;

    const repository: RuntimePersistenceRepository = {
      async getSubscriptionEntitlement(userId) {
        if (userId !== 'user-1') return null;
        return {
          userId,
          tier: 'premium',
          plan: 'premium_monthly',
          status: 'active',
          currentPeriodEndsAt: '2026-06-22T00:00:00.000Z',
          provider: 'stripe_compatible',
          providerCustomerId: 'cus_runtime_portal',
          providerSubscriptionId: 'sub_runtime_portal',
          updatedAt: '2026-05-22T00:00:00.000Z'
        };
      },
      async upsertSubscriptionEntitlement(entitlement) {
        void entitlement;
      },
      async upsertBudget(userId, budget) {
        void userId; void budget;
      },
      async getBudget(userId) {
        void userId;
        return null;
      },
      async getHumanReviewer() {
        return null;
      },
      async listOpenHumanReviewAssignments() {
        return [];
      },
      async saveHumanReviewAssignment(assignment) {
        void assignment;
      },
      async upsertNotificationSuppression(suppression) {
        void suppression;
      }
    };

    try {
      const handle = createRuntimeHttpHandler({
        NODE_ENV: 'development',
        AUTH_SECRET: 'runtime-auth-secret',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        STRIPE_SECRET_KEY: 'sk_test_runtime_secret'
      }, { repository });
      const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, 'runtime-auth-secret');

      const response = await handle(new Request('http://localhost/api/billing/portal-sessions?userId=user-1', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` }
      }));
      const responseBody = await response.json();

      assert.equal(response.status, 201);
      assert.deepEqual(responseBody, {
        provider: 'stripe_compatible',
        sessionId: 'bps_live_runtime_bridge',
        portalUrl: 'https://billing.stripe.com/p/session/bps_live_runtime_bridge'
      });
      assert.equal(calls.length, 1);
      assert.equal(calls[0]?.url, 'https://api.stripe.com/v1/billing_portal/sessions');
      assert.match(calls[0]?.init?.headers instanceof Headers ? calls[0].init.headers.get('authorization') ?? '' : '', /^Basic /);
      const encodedBody = calls[0]?.init?.body as URLSearchParams;
      assert.equal(encodedBody.get('customer'), 'cus_runtime_portal');
      assert.equal(encodedBody.get('return_url'), 'https://groceryview.example/account?billing=return');
      assert.equal(JSON.stringify(responseBody).includes('sk_test_runtime_secret'), false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('wires repository-backed runtime sinks into account access and billing webhooks', async () => {
    let entitlement: SubscriptionEntitlementLookupRecord | null = null;
    let persistedBudget: { weeklyBudget: number; monthlyBudget: number } | null = null;
    const repository: RuntimePersistenceRepository = {
      async getSubscriptionEntitlement(userId: string) {
        return userId === 'user-1' ? entitlement : null;
      },
      async upsertSubscriptionEntitlement(nextEntitlement) {
        entitlement = nextEntitlement;
      },
      async upsertBudget(userId, budget) {
        if (userId === 'user-1') persistedBudget = { ...budget };
      },
      async getBudget(userId) {
        return userId === 'user-1' ? persistedBudget : null;
      },
      async getHumanReviewer() {
        return null;
      },
      async listOpenHumanReviewAssignments() {
        return [];
      },
      async saveHumanReviewAssignment(assignment) {
        void assignment;
      },
      async upsertNotificationSuppression(suppression) {
        void suppression;
      }
    };
    const secret = 'billing-secret';
    const authSecret = 'auth-secret';
    const handle = createRuntimeHttpHandler(
      {
        NODE_ENV: 'development',
        PORT: '3000',
        AUTH_SECRET: authSecret,
        DATABASE_URL: 'postgres://example',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
        BILLING_WEBHOOK_SECRET: secret,
        METRICS_TOKEN: 'metrics-secret'
      },
      { repository }
    );
    const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, authSecret);

    const budgetPatch = await handle(new Request('http://localhost/api/budget?userId=user-1', {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({ weeklyBudget: 900, monthlyBudget: 3600 })
    }));
    assert.equal(budgetPatch.status, 200);
    assert.equal((await budgetPatch.json() as { weeklyBudget: number }).weeklyBudget, 900);
    assert.deepEqual(persistedBudget, { weeklyBudget: 900, monthlyBudget: 3600 });

    persistedBudget = { weeklyBudget: 650, monthlyBudget: 2600 };
    const budgetSummary = await handle(new Request('http://localhost/api/budget/summary?userId=user-1', {
      headers: { authorization: `Bearer ${token}` }
    }));
    assert.equal(budgetSummary.status, 200);
    assert.equal((await budgetSummary.json() as { weeklyBudget: number }).weeklyBudget, 650);

    const before = await handle(new Request('http://localhost/api/account/subscription-access?userId=user-1', {
      headers: { authorization: `Bearer ${token}` }
    }));
    assert.equal(before.status, 200);
    assert.deepEqual((await before.json() as { enforcementReasons: string[] }).enforcementReasons, ['missing_subscription_entitlement']);

    const body = JSON.stringify({
      provider: 'stripe_compatible',
      providerEventId: 'evt_subscription_active_runtime',
      type: 'subscription.active',
      userId: 'user-1',
      plan: 'premium_yearly',
      currentPeriodEndsAt: '2099-01-01T00:00:00.000Z',
      providerCustomerId: 'cus_internal_only',
      providerSubscriptionId: 'sub_internal_only',
      occurredAt: '2026-05-20T00:00:00.000Z'
    });
    const accepted = await handle(new Request('http://localhost/api/billing/subscription-events', {
      method: 'POST',
      headers: { 'x-groceryview-billing-signature': signBillingWebhookBody(body, secret) },
      body
    }));
    assert.equal(accepted.status, 202);

    const after = await handle(new Request('http://localhost/api/account/subscription-access?userId=user-1', {
      headers: { authorization: `Bearer ${token}` }
    }));
    assert.equal(after.status, 200);
    const policy = await after.json() as {
      enforcementReasons: string[];
      accountActions: string[];
      checkoutRequired: boolean;
    };
    assert.deepEqual(policy.enforcementReasons, ['active_subscription_entitlement:premium_yearly']);
    assert.deepEqual(policy.accountActions, ['show_manage_subscription']);
    assert.equal(policy.checkoutRequired, false);
    assert.equal(JSON.stringify(policy).includes('cus_internal_only'), false);
    assert.equal(JSON.stringify(policy).includes('sub_internal_only'), false);
  });

  it('bootstraps a PostgreSQL-backed runtime repository from DATABASE_URL', async () => {
    const pool = new RecordingPgPool();
    const authSecret = 'auth-secret';
    const billingSecret = 'billing-secret';
    let connectionString: string | undefined;
    const service = createRuntimeHttpService(
      {
        NODE_ENV: 'development',
        PORT: '3000',
        AUTH_SECRET: authSecret,
        DATABASE_URL: 'postgres://runtime-db.example/groceryview',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
        BILLING_WEBHOOK_SECRET: billingSecret,
        METRICS_TOKEN: 'metrics-secret'
      },
      {
        pgPoolFactory: (databaseUrl) => {
          connectionString = databaseUrl;
          return pool;
        }
      }
    );
    const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, authSecret);

    try {
      const body = JSON.stringify({
        provider: 'stripe_compatible',
        providerEventId: 'evt_subscription_active_pg_runtime',
        type: 'subscription.active',
        userId: 'user-1',
        plan: 'premium_monthly',
        currentPeriodEndsAt: '2099-01-01T00:00:00.000Z',
        providerCustomerId: 'cus_internal_only',
        providerSubscriptionId: 'sub_internal_only',
        occurredAt: '2026-05-20T00:00:00.000Z'
      });

      const accepted = await service.handler(new Request('http://localhost/api/billing/subscription-events', {
        method: 'POST',
        headers: { 'x-groceryview-billing-signature': signBillingWebhookBody(body, billingSecret) },
        body
      }));
      assert.equal(accepted.status, 202);

      const account = await service.handler(new Request('http://localhost/api/account/subscription-access?userId=user-1', {
        headers: { authorization: `Bearer ${token}` }
      }));
      assert.equal(account.status, 200);
      assert.deepEqual((await account.json() as { enforcementReasons: string[] }).enforcementReasons, [
        'active_subscription_entitlement:premium_monthly'
      ]);
    } finally {
      await service.close();
    }

    assert.equal(connectionString, 'postgres://runtime-db.example/groceryview');
    assert.equal(pool.closed, true);
    const writeCall = pool.calls.find((call) => call.text.includes('insert into subscription_entitlements'));
    assert.deepEqual(writeCall?.values.slice(0, 4), ['user-1', 'premium', 'premium_monthly', 'active']);
    assert.equal(writeCall?.text.includes('$1'), true);
  });

  it('serves runtime flyer offers and watchlist price alerts from persisted PostgreSQL rows', async () => {
    const pool = new RecordingPgPool();
    const authSecret = 'auth-secret';
    const service = createRuntimeHttpService(
      {
        NODE_ENV: 'development',
        PORT: '3000',
        AUTH_SECRET: authSecret,
        DATABASE_URL: 'postgres://runtime-db.example/groceryview',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
        BILLING_WEBHOOK_SECRET: 'billing-secret',
        METRICS_TOKEN: 'metrics-secret'
      },
      { pgPoolFactory: () => pool }
    );
    const token = await createSessionToken({ userId: 'user-1', expiresAt: '2099-01-01T00:00:00.000Z' }, authSecret);

    try {
      const flyerOffers = await service.handler(new Request('http://localhost/api/deals/flyer-offers?chain=willys&asOf=2026-05-20T12:00:00.000Z'));
      assert.equal(flyerOffers.status, 200);
      const flyerBody = await flyerOffers.json() as {
        offerCount: number;
        offers: Array<{ offerId: string; sourceRunId: string; sourceUrl: string; savings: number }>;
      };
      assert.equal(flyerBody.offerCount, 1);
      assert.deepEqual(flyerBody.offers.map((offer) => [offer.offerId, offer.sourceRunId, offer.sourceUrl, offer.savings]), [
        ['obs-runtime-flyer-coffee', 'run-runtime-flyer', 'https://example.test/runtime-flyer', 15]
      ]);

      const discounts = await service.handler(new Request('http://localhost/api/deals/discounts?chain=willys&asOf=2026-05-20T12:00:00.000Z'));
      assert.equal(discounts.status, 200);
      assert.deepEqual((await discounts.json() as { offers: Array<{ offerId: string; sourceType: string }> }).offers.map((offer) => [offer.offerId, offer.sourceType]), [
        ['obs-runtime-flyer-coffee', 'weekly_flyer']
      ]);

      const storeFlyerOffers = await service.handler(new Request('http://localhost/api/stores/willys-odenplan/flyer-offers?asOf=2026-05-20T12:00:00.000Z'));
      assert.equal(storeFlyerOffers.status, 200);
      assert.equal((await storeFlyerOffers.json() as { storeId: string; bestOffer: { offerId: string } }).bestOffer.offerId, 'obs-runtime-flyer-coffee');

      const storeDiscounts = await service.handler(new Request('http://localhost/api/stores/willys-odenplan/discounts?asOf=2026-05-20T12:00:00.000Z'));
      assert.equal(storeDiscounts.status, 200);
      assert.equal((await storeDiscounts.json() as { storeId: string; bestOffer: { offerId: string } }).bestOffer.offerId, 'obs-runtime-flyer-coffee');

      const alerts = await service.handler(new Request('http://localhost/api/watchlist/price-alerts?userId=user-1', {
        headers: { authorization: `Bearer ${token}` }
      }));
      assert.equal(alerts.status, 200);
      const alertBody = await alerts.json() as {
        userId: string;
        trackedItemCount: number;
        alertCount: number;
        alerts: Array<{ productId: string; type: string; trigger: { storeId: string; value: number } }>;
      };
      assert.equal(alertBody.userId, 'user-1');
      assert.equal(alertBody.trackedItemCount, 1);
      assert.equal(alertBody.alertCount, 1);
      assert.deepEqual(alertBody.alerts.map((alert) => [alert.productId, alert.type, alert.trigger.storeId, alert.trigger.value]), [
        ['coffee', 'target_price', 'willys-odenplan', 49.9]
      ]);

      const created = await service.handler(new Request('http://localhost/api/watchlist/price-alerts?userId=user-1', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ productId: 'coffee', targetPrice: 45, favoriteStoresOnly: true, allowedPriceTypes: ['promotion'] })
      }));
      assert.equal(created.status, 201);
      assert.equal((await created.json() as { alertCount: number }).alertCount, 0);
    } finally {
      await service.close();
    }

    assert.equal(pool.closed, true);
    assert.equal(pool.calls.some((call) => call.text.includes('from observations')), true);
    assert.equal(pool.calls.some((call) => call.text.includes('from latest_prices')), true);
    assert.equal(pool.calls.some((call) => call.text.includes('insert into watchlist_items')), true);
    assert.equal(pool.calls.find((call) => call.text.includes('insert into watchlist_items'))?.values[1], 'coffee');
  });


  it('runs the runtime notification worker with SendGrid and Expo providers from env', async () => {
    const providerCalls: Array<{ url: string; body: unknown; authorization?: string }> = [];
    const deliveredTaskIds: string[] = [];
    const repository: RuntimePersistenceRepository = {
      async getSubscriptionEntitlement() { return null; },
      async upsertSubscriptionEntitlement() {},
      async upsertBudget() {},
      async getBudget() { return null; },
      async getHumanReviewer() { return null; },
      async listOpenHumanReviewAssignments() { return []; },
      async saveHumanReviewAssignment() {},
      async upsertNotificationSuppression() {},
      async listDueNotificationTasks() {
        return [
          {
            id: 'email-task',
            channel: 'email',
            type: 'weekly_report',
            title: 'Weekly report',
            body: 'You saved 58 SEK',
            priority: 'normal',
            sendAt: '2026-05-23T00:00:00.000Z',
            recipient: 'shopper@example.com',
            attemptCount: 0,
            maxAttempts: 3,
            status: 'queued'
          },
          {
            id: 'push-task',
            channel: 'push',
            type: 'target_price',
            title: 'Coffee deal',
            body: 'Zoegas below 50 SEK',
            priority: 'high',
            sendAt: '2026-05-23T00:00:00.000Z',
            recipient: 'ExponentPushToken[device]',
            attemptCount: 0,
            maxAttempts: 3,
            status: 'queued'
          }
        ];
      },
      async listActiveNotificationSuppressions() { return []; },
      async upsertNotificationTask(task: PersistedNotificationTask) { if (task.status === 'delivered') deliveredTaskIds.push(task.id); }
    };

    const service = createRuntimeHttpService(
      {
        NODE_ENV: 'development',
        PORT: '3000',
        AUTH_SECRET: 'auth-secret',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
        SENDGRID_API_KEY: 'sendgrid-runtime-key',
        SENDGRID_FROM_EMAIL: 'alerts@groceryview.se',
        EXPO_PUSH_ACCESS_TOKEN: 'expo-runtime-token',
        BILLING_WEBHOOK_SECRET: 'billing-secret',
        METRICS_TOKEN: 'metrics-secret'
      },
      {
        repository,
        now: new Date('2026-05-23T00:01:00.000Z'),
        notificationProviderFetch: async (url: string, init: RequestInit) => {
          providerCalls.push({
            url: String(url),
            body: JSON.parse(String(init.body)),
            authorization: (init.headers as Record<string, string>).authorization
          });
          if (String(url).includes('sendgrid')) return new Response('', { status: 202, headers: { 'x-message-id': 'sg-runtime-1' } });
          return Response.json({ data: [{ status: 'ok', id: 'expo-runtime-1' }] });
        }
      }
    );

    const response = await service.handler(new Request('http://localhost/api/workers/notifications/run', {
      method: 'POST',
      headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
    }));

    assert.equal(response.status, 202);
    const body = await response.json() as { report: { status: string }; worker: { delivered: number } };
    assert.equal(body.report.status, 'healthy');
    assert.equal(body.worker.delivered, 2);
    assert.deepEqual(deliveredTaskIds.sort(), ['email-task', 'push-task']);
    assert.deepEqual(providerCalls.map((call) => [call.url, call.authorization]), [
      ['https://api.sendgrid.com/v3/mail/send', 'Bearer sendgrid-runtime-key'],
      ['https://exp.host/--/api/v2/push/send', 'Bearer expo-runtime-token']
    ]);
  });

  it('exposes PostgreSQL readiness from the runtime DATABASE_URL pool without leaking secrets', async () => {
    const pool = new RecordingPgPool();
    const service = createRuntimeHttpService(
      {
        NODE_ENV: 'development',
        PORT: '3000',
        AUTH_SECRET: 'auth-secret',
        DATABASE_URL: 'postgres://runtime-user:runtime-password@runtime-db.example/groceryview',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
        BILLING_WEBHOOK_SECRET: 'billing-secret',
        METRICS_TOKEN: 'metrics-secret'
      },
      { pgPoolFactory: () => pool }
    );

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/postgres', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));

      assert.equal(response.status, 200);
      const body = await response.json() as { status: string; evidence: string[]; blockers: string[]; summary: string };
      assert.equal(body.status, 'ready');
      assert.deepEqual(body.blockers, []);
      assert.equal(body.evidence.includes('table:app_users'), true);
      assert.equal(body.evidence.includes('table:alert_rules'), true);
      assert.equal(body.evidence.includes('table:pantry_items'), true);
      assert.equal(body.evidence.includes('table:price_daily'), true);
      assert.equal(body.evidence.includes('table:price_weekly'), true);
      assert.equal(body.evidence.includes('table:observations_v2'), true);
      assert.equal(body.evidence.includes('table:receipt_uploads'), true);
      assert.equal(body.evidence.includes('table:receipt_items'), true);
      assert.equal(body.evidence.includes('table:household_plans'), true);
      assert.equal(body.evidence.includes('table:household_members'), true);
      assert.equal(body.evidence.includes('migration:003_subscription_entitlements'), true);
      assert.equal(body.evidence.includes('migration:004_alert_rules'), true);
      assert.equal(body.evidence.includes('migration:005_pantry_inventory'), true);
      assert.equal(body.evidence.includes('migration:007_receipt_uploads'), true);
      assert.equal(body.evidence.includes('migration:008_household_plans'), true);
      assert.equal(body.evidence.includes('migration:012_price_rollups'), true);
      assert.equal(body.evidence.includes('migration:013_observations_partitioning'), true);
      assert.equal(JSON.stringify(body).includes('runtime-password'), false);
    } finally {
      await service.close();
    }

    assert.equal(pool.closed, true);
    assert.equal(pool.calls.some((call) => call.text.includes('information_schema.tables')), true);
    assert.equal(pool.calls.some((call) => call.text.includes('select version from schema_migrations')), true);
    assert.equal(pool.calls.some((call) => /\b(insert|update|delete)\b/i.test(call.text)), false);
  });

  it('exposes source-run freshness from the runtime DATABASE_URL pool and blocks missing daily chain ingestion', async () => {
    const pool = new RecordingPgPool();
    const service = createRuntimeHttpService(
      {
        NODE_ENV: 'development',
        PORT: '3000',
        AUTH_SECRET: 'auth-secret',
        DATABASE_URL: 'postgres://runtime-user:runtime-password@runtime-db.example/groceryview',
        PUBLIC_WEB_URL: 'https://groceryview.example',
        NOTIFICATION_WEBHOOK_SECRET: 'notification-secret',
        BILLING_WEBHOOK_SECRET: 'billing-secret',
        METRICS_TOKEN: 'metrics-secret'
      },
      { pgPoolFactory: () => pool }
    );

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/source-runs', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));

      assert.equal(response.status, 503);
      const body = await response.json() as { report: { blockers: string[] }; summary: { blockers: { noFreshRuns: number; missingFreshChains: number } } };
      assert.equal(body.report.blockers.includes('source_run_no_fresh_success'), true);
      assert.equal(body.report.blockers.includes('source_run_missing_fresh_chain:willys'), true);
      assert.equal(body.report.blockers.includes('source_run_missing_fresh_chain:ica'), true);
      assert.equal(body.summary.blockers.noFreshRuns, 1);
      assert.equal(body.summary.blockers.missingFreshChains, 6);
      assert.equal(JSON.stringify(body).includes('runtime-password'), false);
    } finally {
      await service.close();
    }

    assert.equal(pool.closed, true);
    assert.equal(pool.calls.some((call) => call.text.includes('from source_runs')), true);
  });

  it('exposes catalog coverage readiness from PostgreSQL coverage rows and configured targets', async () => {
    const pool = new RecordingPgPool();
    const service = createRuntimeHttpService(
      {
        NODE_ENV: 'development',
        DATABASE_URL: 'postgres://runtime-db.example/groceryview',
        METRICS_TOKEN: 'metrics-secret',
        CATALOG_COVERAGE_TARGETS_JSON: JSON.stringify({
          targetProducts: ['coffee', 'milk'],
          targetCategories: ['coffee', 'dairy'],
          targetChains: ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross'],
          targetStores: ['willys-odenplan', 'coop-odenplan'],
          targetPriceTypes: ['online'],
          requireEveryProductInEveryStore: true,
          requireEveryStorePriceType: true
        })
      },
      { pgPoolFactory: () => pool }
    );

    try {
      const response = await service.handler(new Request('http://localhost/api/readiness/catalog-coverage', {
        headers: { 'x-groceryview-metrics-token': 'metrics-secret' }
      }));
      assert.equal(response.status, 503);
      const body = await response.json() as {
        missingProductStorePairs: Array<{ productId: string; storeId: string }>;
        requiredActions: string[];
        missingStorePriceTypes: Array<{ storeId: string; priceType: string }>;
      };
      assert.deepEqual(body.missingProductStorePairs, [{ productId: 'milk', storeId: 'coop-odenplan' }]);
      assert.deepEqual(body.missingStorePriceTypes, [{ storeId: 'coop-odenplan', priceType: 'online' }]);
      assert.deepEqual(body.requiredActions, ['backfill_product_store_pairs:1', 'backfill_store_price_types:1']);
    } finally {
      await service.close();
    }

    assert.equal(pool.calls.some((call) => call.text.includes('left join latest_prices')), true);
    assert.equal(pool.closed, true);
  });

  it('detects when the server module is executed directly as the deployment entrypoint', () => {
    const moduleUrl = new URL('../index.js', import.meta.url).href;
    const modulePath = fileURLToPath(moduleUrl);

    assert.equal(isDirectServerEntrypoint(moduleUrl, modulePath), true);
    assert.equal(isDirectServerEntrypoint(moduleUrl, '/tmp/other-entrypoint.js'), false);
    assert.equal(isDirectServerEntrypoint(moduleUrl, undefined), false);
  });
});
