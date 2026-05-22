import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { PostgresQueryExecutorService } from '../src/database/postgres-query-executor.service.js';

type QueryCall = {
  sql: string;
  params: unknown[];
};

const priceRows = [
  {
    product_id: 'product-milk',
    slug: 'standardmjolk-1l',
    canonical_name: 'Standardmjolk 3% 1 l',
    brand: 'Arla',
    category_path: ['Dairy', 'Milk'],
    package_size: '1',
    package_unit: 'l',
    comparable_unit: 'l',
    image_url: null,
    observation_id: 'obs-milk-willys',
    price: '14.90',
    unit_price: '14.9000',
    currency: 'SEK',
    price_type: 'shelf',
    confidence: '0.9400',
    observed_at: '2026-05-21T09:00:00.000Z',
    chain_id: 'chain-willys',
    chain_slug: 'willys',
    chain_name: 'Willys',
    store_id: 'store-willys',
    store_slug: 'willys-hemma-stockholm-torsplan',
    store_name: 'Willys Hemma Stockholm Torsplan'
  },
  {
    product_id: 'product-milk',
    slug: 'standardmjolk-1l',
    canonical_name: 'Standardmjolk 3% 1 l',
    brand: 'Arla',
    category_path: ['Dairy', 'Milk'],
    package_size: '1',
    package_unit: 'l',
    comparable_unit: 'l',
    image_url: null,
    observation_id: 'obs-milk-coop',
    price: '15.50',
    unit_price: '15.5000',
    currency: 'SEK',
    price_type: 'shelf',
    confidence: '0.9100',
    observed_at: '2026-05-21T08:00:00.000Z',
    chain_id: 'chain-coop',
    chain_slug: 'coop',
    chain_name: 'Coop',
    store_id: 'store-coop',
    store_slug: 'coop-odenplan',
    store_name: 'Coop Odenplan'
  },
  {
    product_id: 'product-butter',
    slug: 'smor-500g',
    canonical_name: 'Smor 500 g',
    brand: null,
    category_path: ['Dairy', 'Butter'],
    package_size: '500',
    package_unit: 'g',
    comparable_unit: 'kg',
    image_url: null,
    observation_id: 'obs-butter-willys',
    price: '54.90',
    unit_price: '109.8000',
    currency: 'SEK',
    price_type: 'shelf',
    confidence: '0.9000',
    observed_at: '2026-05-21T09:10:00.000Z',
    chain_id: 'chain-willys',
    chain_slug: 'willys',
    chain_name: 'Willys',
    store_id: 'store-willys',
    store_slug: 'willys-hemma-stockholm-torsplan',
    store_name: 'Willys Hemma Stockholm Torsplan'
  }
];

const productRows = [
  {
    id: 'product-milk',
    slug: 'standardmjolk-1l',
    canonical_name: 'Standardmjolk 3% 1 l'
  }
];

const priceHistoryRows = [
  {
    id: 'obs-milk-promo',
    chain_id: 'chain-willys',
    store_id: 'store-willys',
    source_run_id: 'run-willys-2026-05-21',
    raw_record_id: 'raw-milk-promo',
    retailer_product_ref: 'willys-milk-1l',
    price_type: 'promotion',
    price: '13.90',
    regular_price: '14.90',
    unit_price: '13.9000',
    currency: 'SEK',
    quantity: '1',
    quantity_unit: 'l',
    promotion_text: 'Veckans pris',
    promotion_starts_on: '2026-05-20T00:00:00.000Z',
    promotion_ends_on: '2026-05-26T23:59:59.000Z',
    member_required: false,
    observed_at: '2026-05-21T09:00:00.000Z',
    valid_from: '2026-05-20T00:00:00.000Z',
    valid_until: '2026-05-26T23:59:59.000Z',
    confidence: '0.9400',
    provenance: { source: 'willys_feed', rawSnapshotRef: 's3://raw/willys/milk-promo.json' }
  },
  {
    id: 'obs-milk-shelf',
    chain_id: 'chain-coop',
    store_id: 'store-coop',
    source_run_id: 'run-coop-2026-05-10',
    raw_record_id: 'raw-milk-shelf',
    retailer_product_ref: 'coop-milk-1l',
    price_type: 'shelf',
    price: '15.50',
    regular_price: null,
    unit_price: '15.5000',
    currency: 'SEK',
    quantity: '1',
    quantity_unit: 'l',
    promotion_text: null,
    promotion_starts_on: null,
    promotion_ends_on: null,
    member_required: false,
    observed_at: '2026-05-10T08:00:00.000Z',
    valid_from: null,
    valid_until: null,
    confidence: '0.9100',
    provenance: { source: 'coop_feed', rawSnapshotRef: 's3://raw/coop/milk-shelf.json' }
  }
];

class FakePostgresQueryExecutorService {
  calls: QueryCall[] = [];

  isConfigured(): boolean {
    return true;
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    this.calls.push({ sql, params });
    if (sql.includes('from weekly_baskets')) return [{ product_id: 'product-milk', quantity: '2' }] as T[];
    if (sql.includes('from observations')) return priceHistoryRows as T[];
    if (sql.includes('where slug = $1 or id::text = $1')) return productRows as T[];
    return priceRows as T[];
  }
}

describe('real catalog API endpoints', () => {
  let app: INestApplication;
  let database: FakePostgresQueryExecutorService;

  beforeEach(async () => {
    database = new FakePostgresQueryExecutorService();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PostgresQueryExecutorService)
      .useValue(database)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('exposes real faceted search and basket compare routes in OpenAPI', async () => {
    const docs = await request(app.getHttpServer()).get('/api-json').expect(200);

    assert.ok(docs.body.paths['/products/search/faceted']);
    assert.ok(docs.body.paths['/products/{productId}/price-history']);
    assert.ok(docs.body.paths['/baskets/compare']);
    assert.ok(docs.body.paths['/users/{userId}/basket/compare']);
  });

  it('serves faceted product search from database rows', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/search/faceted?q=mjolk&category=Dairy&chain=willys&limit=10')
      .expect(200);

    assert.equal(response.body.products[0].productId, 'product-milk');
    assert.equal(response.body.products[0].cheapestPrice, 14.9);
    assert.equal(response.body.products[0].currentPrices[0].observationId, 'obs-milk-willys');
    assert.deepEqual(response.body.evidence.sourceTables, ['products', 'latest_prices', 'chains', 'stores']);
    assert.equal('demo' in response.body, false);
    assert.match(database.calls[0]?.sql ?? '', /from products/i);
    assert.match(database.calls[0]?.sql ?? '', /latest_prices/i);
  });

  it('compares posted and saved baskets from persisted latest prices', async () => {
    const posted = await request(app.getHttpServer())
      .post('/baskets/compare')
      .send({
        storeSlugs: ['willys-hemma-stockholm-torsplan', 'coop-odenplan'],
        items: [
          { productId: 'product-milk', quantity: 2 },
          { productId: 'product-butter', quantity: 1 }
        ]
      })
      .expect(200);

    assert.equal(posted.body.strategies[0].total, 84.7);
    assert.equal(posted.body.strategies[0].assignments[0].priceLabel, 'verified_latest_price');
    assert.deepEqual(posted.body.evidence.sourceTables, ['basket_items', 'weekly_baskets', 'products', 'latest_prices', 'stores']);

    const saved = await request(app.getHttpServer())
      .get('/users/user-1/basket/compare?stores=willys-hemma-stockholm-torsplan')
      .expect(200);

    assert.equal(saved.body.userId, 'user-1');
    assert.equal(saved.body.itemCount, 1);
    assert.match(database.calls.find((call) => call.sql.includes('from weekly_baskets'))?.sql ?? '', /join basket_items/i);
  });

  it('serves product price history from persisted observation rows', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/standardmjolk-1l/price-history?priceType=promotion&from=2026-05-01T00:00:00.000Z&to=2026-05-31T23:59:59.000Z&limit=25')
      .expect(200);

    assert.equal(response.body.productId, 'product-milk');
    assert.equal(response.body.productSlug, 'standardmjolk-1l');
    assert.equal(response.body.pointCount, 2);
    assert.deepEqual(response.body.points.map((point: { observationId: string }) => point.observationId), ['obs-milk-shelf', 'obs-milk-promo']);
    assert.equal(response.body.points[1].priceType, 'promotion');
    assert.equal(response.body.points[1].price, 13.9);
    assert.equal(response.body.points[1].regularPrice, 14.9);
    assert.equal(response.body.points[1].provenance.rawSnapshotRef, 's3://raw/willys/milk-promo.json');
    assert.equal(response.body.summary.latestPrice, 13.9);
    assert.equal('demo' in response.body, false);

    const productLookup = database.calls.find((call) => call.sql.includes('where slug = $1 or id::text = $1'));
    const observationsQuery = database.calls.find((call) => call.sql.includes('from observations'));
    assert.deepEqual(productLookup?.params, ['standardmjolk-1l']);
    assert.deepEqual(observationsQuery?.params, [
      'product-milk',
      'promotion',
      '2026-05-01T00:00:00.000Z',
      '2026-05-31T23:59:59.000Z',
      25
    ]);
    assert.match(observationsQuery?.sql ?? '', /from observations/i);
    assert.match(observationsQuery?.sql ?? '', /observed_at >=/i);
  });
});
