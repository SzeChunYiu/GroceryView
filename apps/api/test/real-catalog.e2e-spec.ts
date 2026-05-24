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

function requestedLocale(params: unknown[]): 'sv' | 'en' | undefined {
  return params.find((param): param is 'sv' | 'en' => param === 'sv' || param === 'en');
}

function localizedCanonicalRow<T extends { canonical_name: string; name_sv?: string | null; name_en?: string | null }>(
  row: T,
  locale: 'sv' | 'en' | undefined
): T {
  if (locale === 'en' && row.name_en) return { ...row, canonical_name: row.name_en };
  if (locale === 'sv' && row.name_sv) return { ...row, canonical_name: row.name_sv };
  return row;
}

const priceRows = [
  {
    product_id: 'product-milk',
    slug: 'standardmjolk-1l',
    canonical_name: 'Standardmjolk 3% 1 l',
    name_sv: 'Standardmjölk 3% 1 l',
    name_en: 'Whole milk 3% 1 l',
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
    name_sv: 'Standardmjölk 3% 1 l',
    name_en: 'Whole milk 3% 1 l',
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
    name_sv: 'Smör 500 g',
    name_en: 'Butter 500 g',
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

const unpricedProductRows = [
  {
    product_id: 'product-oats',
    slug: 'havregryn-1kg',
    canonical_name: 'Havregryn 1 kg',
    name_sv: 'Havregryn 1 kg',
    name_en: 'Oats 1 kg',
    brand: 'Axa',
    category_path: ['Pantry', 'Breakfast'],
    package_size: '1',
    package_unit: 'kg',
    comparable_unit: 'kg',
    image_url: null,
    observation_id: null,
    price: null,
    unit_price: null,
    currency: null,
    price_type: null,
    confidence: null,
    observed_at: null,
    chain_id: null,
    chain_slug: null,
    chain_name: null,
    store_id: null,
    store_slug: null,
    store_name: null
  }
];

const productRows = [
  {
    id: 'product-milk',
    slug: 'standardmjolk-1l',
    canonical_name: 'Standardmjolk 3% 1 l',
    name_sv: 'Standardmjölk 3% 1 l',
    name_en: 'Whole milk 3% 1 l'
  }
];

const priceHistoryRows = [
  {
    id: 'obs-milk-promo',
    chain_id: 'chain-willys',
    chain_slug: 'willys',
    chain_name: 'Willys',
    store_id: 'store-willys',
    store_slug: 'willys-hemma-stockholm-torsplan',
    store_name: 'Willys Hemma Stockholm Torsplan',
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
    chain_slug: 'coop',
    chain_name: 'Coop',
    store_id: 'store-coop',
    store_slug: 'coop-odenplan',
    store_name: 'Coop Odenplan',
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

const cheapestNowRows = [
  {
    product_id: 'product-milk',
    product_slug: 'standardmjolk-1l',
    product_name: 'Standardmjolk 3% 1 l',
    category_path: ['Dairy', 'Milk'],
    comparable_unit: 'l',
    price: '14.90',
    unit_price: '14.9000',
    currency: 'SEK',
    observed_at: '2026-05-21T09:00:00.000Z',
    chain_slug: 'willys',
    chain_name: 'Willys',
    store_slug: 'willys-hemma-stockholm-torsplan',
    store_name: 'Willys Hemma Stockholm Torsplan'
  },
  {
    product_id: 'product-milk',
    product_slug: 'standardmjolk-1l',
    product_name: 'Standardmjolk 3% 1 l',
    category_path: ['Dairy', 'Milk'],
    comparable_unit: 'l',
    price: '15.50',
    unit_price: '15.5000',
    currency: 'SEK',
    observed_at: '2026-05-21T08:00:00.000Z',
    chain_slug: 'coop',
    chain_name: 'Coop',
    store_slug: 'coop-odenplan',
    store_name: 'Coop Odenplan'
  },
  {
    product_id: 'product-milk',
    product_slug: 'standardmjolk-1l',
    product_name: 'Standardmjolk 3% 1 l',
    category_path: ['Dairy', 'Milk'],
    comparable_unit: 'l',
    price: '13.90',
    unit_price: '13.9000',
    currency: 'SEK',
    observed_at: '2026-05-21T10:00:00.000Z',
    chain_slug: 'willys',
    chain_name: 'Willys',
    store_slug: 'willys-odenplan',
    store_name: 'Willys Odenplan'
  },
  {
    product_id: 'product-milk',
    product_slug: 'standardmjolk-1l',
    product_name: 'Standardmjolk 3% 1 l',
    category_path: ['Dairy', 'Milk'],
    comparable_unit: 'l',
    price: '0',
    unit_price: '0',
    currency: 'SEK',
    observed_at: '2026-05-21T11:00:00.000Z',
    chain_slug: 'lidl',
    chain_name: 'Lidl',
    store_slug: 'lidl-odenplan',
    store_name: 'Lidl Odenplan'
  }
];

const chainIndexRows = [
  {
    product_id: 'product-coffee',
    product_slug: 'bryggkaffe-450g',
    product_name: 'Bryggkaffe mellanrost 450 g',
    category_path: ['coffee'],
    chain_slug: 'willys',
    current_unit_price: '110.89',
    current_observed_at: '2026-05-21T09:00:00.000Z'
  },
  {
    product_id: 'product-coffee',
    product_slug: 'bryggkaffe-450g',
    product_name: 'Bryggkaffe mellanrost 450 g',
    category_path: ['coffee'],
    chain_slug: 'coop',
    current_unit_price: '133.11',
    current_observed_at: '2026-05-21T08:00:00.000Z'
  },
  {
    product_id: 'product-milk',
    product_slug: 'standardmjolk-1l',
    product_name: 'Standardmjolk 3% 1 l',
    category_path: ['dairy'],
    chain_slug: 'lidl',
    current_unit_price: '13.90',
    current_observed_at: '2026-05-21T09:00:00.000Z'
  },
  {
    product_id: 'product-private-label-milk',
    product_slug: 'garant-mjolk-1l',
    product_name: 'Garant Milk 1 l',
    category_path: ['dairy'],
    chain_slug: 'willys',
    current_unit_price: '12.90',
    current_observed_at: '2026-05-21T10:00:00.000Z'
  }
];

const basketIndexRows = [
  {
    ...chainIndexRows[0],
    brand: 'Zoegas',
    private_label_owner: null,
    base_unit_price: '133.11',
    base_observed_at: '2026-05-01T09:00:00.000Z'
  },
  {
    ...chainIndexRows[1],
    brand: 'Zoegas',
    private_label_owner: null,
    base_unit_price: null,
    base_observed_at: null
  },
  {
    ...chainIndexRows[2],
    brand: 'Arla',
    private_label_owner: null,
    base_unit_price: '16.90',
    base_observed_at: '2026-05-01T09:00:00.000Z'
  },
  {
    ...chainIndexRows[3],
    brand: 'Garant',
    private_label_owner: 'Axfood',
    base_unit_price: '19.90',
    base_observed_at: '2026-05-02T09:00:00.000Z'
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
    if (sql.includes('where (products.id::text = any($1::text[]) or products.slug = any($1::text[]))')) {
      const [productRefs, storeSlugs] = params as [string[], string[] | null];
      const rows = [
        ...priceRows.filter((row) => productRefs.includes(row.product_id) || productRefs.includes(row.slug)),
        ...unpricedProductRows.filter((row) => productRefs.includes(row.product_id) || productRefs.includes(row.slug))
      ];
      return rows
        .filter((row) => productRefs.includes(row.product_id) || productRefs.includes(row.slug))
        .filter((row) => row.store_slug === null || storeSlugs === null || storeSlugs.includes(row.store_slug))
        .map((row) => localizedCanonicalRow(row, requestedLocale(params))) as T[];
    }
    if (sql.includes('latest_prices.observation_id') && sql.includes(' as product_name')) {
      if (params[0] === 'missing-product') return [] as T[];
      return priceRows
        .filter((row) => row.product_id === 'product-milk')
        .map((row) => localizedCanonicalRow(row, requestedLocale(params)))
        .map((row) => ({
          ...row,
          product_slug: row.slug,
          product_name: row.canonical_name
        })) as T[];
    }
    if (
      sql.includes('products.comparable_unit') &&
      sql.includes('left join latest_prices') &&
      sql.includes('where products.slug = $1 or products.id::text = $1')
    ) {
      if (params[0] === 'missing-product') return [] as T[];
      return cheapestNowRows as T[];
    }
    if (sql.includes('from current_chain_prices')) return chainIndexRows as T[];
    if (sql.includes('base_prices') && sql.includes('private_label_owner')) return basketIndexRows as T[];
    if (sql.includes('from observations')) {
      const [productId, priceType, chain, store, sourceRun, observedFrom, observedTo, minConfidence, limit] = params;
      return priceHistoryRows
        .filter((row) => productId === 'product-milk')
        .filter((row) => priceType === null || row.price_type === priceType)
        .filter((row) => chain === null || row.chain_slug === chain || row.chain_id === chain)
        .filter((row) => store === null || row.store_slug === store || row.store_id === store)
        .filter((row) => sourceRun === null || row.source_run_id === sourceRun)
        .filter((row) => observedFrom === null || Date.parse(row.observed_at) >= Date.parse(String(observedFrom)))
        .filter((row) => observedTo === null || Date.parse(row.observed_at) <= Date.parse(String(observedTo)))
        .filter((row) => minConfidence === null || Number(row.confidence) >= Number(minConfidence))
        .slice(0, Number(limit)) as T[];
    }
    if (sql.includes('where slug = $1 or id::text = $1')) return productRows.map((row) => localizedCanonicalRow(row, requestedLocale(params))) as T[];
    return priceRows.map((row) => localizedCanonicalRow(row, requestedLocale(params))) as T[];
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
    assert.ok(docs.body.paths['/products/{productId}/cheapest-now']);
    assert.ok(docs.body.paths['/indices/chains']);
    assert.ok(docs.body.paths['/indices/categories']);
    assert.ok(docs.body.paths['/indices/brands']);
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
    assert.match(database.calls[0]?.sql ?? '', /from latest_prices filter_prices/i);
    assert.ok((database.calls[0]?.sql ?? '').indexOf('from latest_prices filter_prices') < (database.calls[0]?.sql ?? '').indexOf('limit $9'));
  });

  it('serves product names in the requested user language when product locale columns are present', async () => {
    const search = await request(app.getHttpServer())
      .get('/products/search/faceted?q=milk&limit=10')
      .set('x-groceryview-locale', 'en')
      .expect(200);

    assert.equal(search.body.products[0].canonicalName, 'Whole milk 3% 1 l');
    assert.match(database.calls.at(-1)?.sql ?? '', /products\.name_en/i);
    assert.match(database.calls.at(-1)?.sql ?? '', /products\.name_sv/i);
    assert.ok(database.calls.at(-1)?.params.includes('en'));

    const history = await request(app.getHttpServer())
      .get('/products/standardmjolk-1l/price-history?limit=1')
      .set('Accept-Language', 'sv-SE,sv;q=0.9,en;q=0.8')
      .expect(200);

    assert.equal(history.body.productName, 'Standardmjölk 3% 1 l');
    const productLookup = database.calls.find((call) => call.sql.includes('where slug = $1 or id::text = $1'));
    assert.match(productLookup?.sql ?? '', /products\.name_sv/i);
    assert.deepEqual(productLookup?.params, ['standardmjolk-1l', 'sv']);
  });

  it('rejects contradictory faceted price ranges before querying the catalog', async () => {
    await request(app.getHttpServer())
      .get('/products/search/faceted?minPrice=20&maxPrice=10')
      .expect(400);

    assert.equal(database.calls.length, 0);
  });

  it('compares posted and saved baskets from persisted latest prices', async () => {
    const posted = await request(app.getHttpServer())
      .post('/baskets/compare')
      .send({
        storeSlugs: [' willys-hemma-stockholm-torsplan ', '', 'coop-odenplan'],
        items: [
          { productId: ' product-milk ', quantity: 2 },
          { productId: 'product-butter', quantity: 1 }
        ]
      })
      .expect(200);

    assert.equal(posted.body.strategies[0].total, 84.7);
    assert.equal(posted.body.strategies[0].assignments[0].priceLabel, 'verified_latest_price');
    assert.deepEqual(posted.body.evidence, {
      basketSource: 'request_body',
      latestPriceCount: 3,
      sourceTables: ['products', 'latest_prices', 'stores']
    });
    assert.deepEqual(database.calls[0]?.params[0], ['product-milk', 'product-butter']);
    assert.deepEqual(database.calls[0]?.params[1], ['willys-hemma-stockholm-torsplan', 'coop-odenplan']);

    const saved = await request(app.getHttpServer())
      .get('/users/user-1/basket/compare?stores=willys-hemma-stockholm-torsplan')
      .expect(200);

    assert.equal(saved.body.userId, 'user-1');
    assert.equal(saved.body.itemCount, 1);
    assert.deepEqual(saved.body.evidence, {
      basketSource: 'weekly_baskets',
      latestPriceCount: 1,
      sourceTables: ['weekly_baskets', 'basket_items', 'products', 'latest_prices', 'stores']
    });
    assert.match(database.calls.find((call) => call.sql.includes('from weekly_baskets'))?.sql ?? '', /join basket_items/i);
    assert.match(database.calls.find((call) => call.sql.includes('from weekly_baskets'))?.sql ?? '', /order by week_start desc, id desc\s+limit 1/i);

    const partial = await request(app.getHttpServer())
      .post('/baskets/compare')
      .send({
        storeSlugs: ['coop-odenplan'],
        items: [
          { productId: 'product-milk', quantity: 2 },
          { productId: 'product-butter', quantity: 1 }
        ]
      })
      .expect(200);

    assert.equal(partial.body.strategies[1].id, 'all_at_one_store');
    assert.equal(partial.body.strategies[1].total, null);
    assert.deepEqual(
      partial.body.strategies[1].assignments.map((assignment: { productId: string; storeSlug: string; lineTotal: number | null; priceLabel: string }) => ({
        productId: assignment.productId,
        storeSlug: assignment.storeSlug,
        lineTotal: assignment.lineTotal,
        priceLabel: assignment.priceLabel
      })),
      [
        {
          productId: 'product-milk',
          storeSlug: 'coop-odenplan',
          lineTotal: 31,
          priceLabel: 'verified_latest_price'
        },
        { productId: 'product-butter', storeSlug: 'coop-odenplan', lineTotal: null, priceLabel: 'missing_price' }
      ]
    );
    assert.match(partial.body.strategies[1].warnings[0], /without estimating missing prices/i);

    const unpriced = await request(app.getHttpServer())
      .post('/baskets/compare')
      .send({
        storeSlugs: ['coop-odenplan'],
        items: [
          { productId: 'product-milk', quantity: 2 },
          { productId: 'product-oats', quantity: 1 }
        ]
      })
      .expect(200);

    const missing = unpriced.body.strategies[0].assignments.find(
      (assignment: { productId: string; slug: string; productName: string; lineTotal: number | null; priceLabel: string }) =>
        assignment.productId === 'product-oats'
    );
    assert.ok(missing);
    assert.equal(missing.slug, 'havregryn-1kg');
    assert.equal(missing.productName, 'Havregryn 1 kg');
    assert.equal(missing.lineTotal, null);
    assert.equal(missing.priceLabel, 'missing_price');
    assert.equal(unpriced.body.evidence.latestPriceCount, 1);
    assert.match(database.calls.at(-1)?.sql ?? '', /latest_prices\.price_type in \('shelf', 'online', 'member', 'promotion'\)/i);
    assert.match(database.calls.at(-1)?.sql ?? '', /from stores selected_stores/i);
  });

  it('serves product price history from persisted observation rows', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/standardmjolk-1l/price-history?priceType=promotion&sourceRun=run-willys-2026-05-21&minConfidence=0.9&from=2026-05-01T00:00:00.000Z&to=2026-05-31T23:59:59.000Z&limit=25')
      .expect(200);

    assert.equal(response.body.productId, 'product-milk');
    assert.equal(response.body.productSlug, 'standardmjolk-1l');
    assert.deepEqual(response.body.filters, {
      priceType: 'promotion',
      sourceRun: 'run-willys-2026-05-21',
      minConfidence: 0.9,
      observedFrom: '2026-05-01T00:00:00.000Z',
      observedTo: '2026-05-31T23:59:59.000Z',
      limit: 25
    });
    assert.equal(response.body.pointCount, 1);
    assert.deepEqual(response.body.evidence, {
      observationCount: 1,
      sourceTables: ['products', 'observations', 'chains', 'stores']
    });
    assert.deepEqual(response.body.points.map((point: { observationId: string }) => point.observationId), ['obs-milk-promo']);
    assert.equal(response.body.points[0].priceType, 'promotion');
    assert.equal(response.body.points[0].chainSlug, 'willys');
    assert.equal(response.body.points[0].chainName, 'Willys');
    assert.equal(response.body.points[0].storeSlug, 'willys-hemma-stockholm-torsplan');
    assert.equal(response.body.points[0].storeName, 'Willys Hemma Stockholm Torsplan');
    assert.equal(response.body.points[0].price, 13.9);
    assert.equal(response.body.points[0].regularPrice, 14.9);
    assert.equal(response.body.points[0].provenance.rawSnapshotRef, 's3://raw/willys/milk-promo.json');
    assert.equal(response.body.summary.latestPrice, 13.9);
    assert.equal('demo' in response.body, false);

    const productLookup = database.calls.find((call) => call.sql.includes('where slug = $1 or id::text = $1'));
    const observationsQuery = database.calls.find((call) => call.sql.includes('from observations'));
    assert.deepEqual(productLookup?.params, ['standardmjolk-1l', null]);
    assert.deepEqual(observationsQuery?.params, [
      'product-milk',
      'promotion',
      null,
      null,
      'run-willys-2026-05-21',
      '2026-05-01T00:00:00.000Z',
      '2026-05-31T23:59:59.000Z',
      0.9,
      25
    ]);
    assert.match(observationsQuery?.sql ?? '', /from observations/i);
    assert.match(observationsQuery?.sql ?? '', /left join chains/i);
    assert.match(observationsQuery?.sql ?? '', /left join stores/i);
    assert.match(observationsQuery?.sql ?? '', /source_run_id::text = \$5/i);
    assert.match(observationsQuery?.sql ?? '', /observed_at >=/i);
    assert.match(observationsQuery?.sql ?? '', /observations\.confidence >= \$8::numeric/i);
  });

  it('returns an explicit empty price history when persisted filters match no observation rows', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/standardmjolk-1l/price-history?priceType=promotion&sourceRun=run-without-milk-prices&limit=25')
      .expect(200);

    assert.equal(response.body.productId, 'product-milk');
    assert.equal(response.body.pointCount, 0);
    assert.deepEqual(response.body.points, []);
    assert.equal(response.body.summary, null);
    assert.deepEqual(response.body.evidence, {
      observationCount: 0,
      sourceTables: ['products', 'observations', 'chains', 'stores']
    });
    assert.match(response.body.guardrails.join(' '), /No observations are returned/i);
  });

  it('serves latest product prices from persisted latest price rows', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/standardmjolk-1l/prices')
      .expect(200);

    assert.deepEqual(
      response.body.map((row: { observationId: string; productId: string; storeId: string; price: number; confidence: string }) => ({
        observationId: row.observationId,
        productId: row.productId,
        storeId: row.storeId,
        price: row.price,
        confidence: row.confidence
      })),
      [
        {
          observationId: 'obs-milk-willys',
          productId: 'standardmjolk-1l',
          storeId: 'willys-hemma-stockholm-torsplan',
          price: 14.9,
          confidence: 'high'
        },
        {
          observationId: 'obs-milk-coop',
          productId: 'standardmjolk-1l',
          storeId: 'coop-odenplan',
          price: 15.5,
          confidence: 'high'
        }
      ]
    );
    assert.equal('demo' in response.body[0], false);
    assert.match(database.calls.at(-1)?.sql ?? '', /from products/i);
    assert.match(database.calls.at(-1)?.sql ?? '', /latest_prices/i);
    assert.deepEqual(database.calls.at(-1)?.params, ['standardmjolk-1l', null]);
  });

  it('serves product cheapest-now from persisted latest price rows', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/standardmjolk-1l/cheapest-now')
      .expect(200);

    assert.equal(response.body.productId, 'product-milk');
    assert.equal(response.body.cheapest.chain, 'willys');
    assert.equal(response.body.cheapest.storeId, 'willys-odenplan');
    assert.deepEqual(response.body.chainPrices.map((row: { chain: string; packagePrice: number }) => [row.chain, row.packagePrice]), [
      ['willys', 13.9],
      ['coop', 15.5]
    ]);
    assert.equal(response.body.observedPriceCount, 3);
    assert.equal('demo' in response.body, false);
    assert.match(database.calls.at(-1)?.sql ?? '', /from products/i);
    assert.match(database.calls.at(-1)?.sql ?? '', /left join latest_prices/i);
    assert.match(database.calls.at(-1)?.sql ?? '', /latest_prices\.price > 0/i);
    assert.deepEqual(database.calls.at(-1)?.params, ['standardmjolk-1l', null]);
  });

  it('serves real chain, category, and brand indices from persisted price rows', async () => {
    const chains = await request(app.getHttpServer()).get('/indices/chains').expect(200);
    assert.deepEqual(chains.body.categories, ['coffee', 'dairy']);
    assert.equal(chains.body.currency, 'SEK');
    assert.equal(chains.body.generatedFrom, 4);
    assert.equal(chains.body.chains[0].chainId, 'willys');
    assert.equal('demo' in chains.body, false);
    assert.match(database.calls.at(-1)?.sql ?? '', /from current_chain_prices/i);
    assert.match(database.calls.at(-1)?.sql ?? '', /latest_prices\.unit_price > 0/i);

    const categories = await request(app.getHttpServer()).get('/indices/categories').expect(200);
    assert.deepEqual(categories.body.indices.map((row: { category: string; value: number; productCount: number }) => [row.category, row.value, row.productCount]), [
      ['dairy', 72.83, 2],
      ['coffee', 83.31, 1]
    ]);
    assert.equal(categories.body.generatedFrom, 3);
    assert.match(database.calls.at(-1)?.sql ?? '', /from observations/i);
    assert.match(database.calls.at(-1)?.sql ?? '', /join base_prices/i);

    const brands = await request(app.getHttpServer()).get('/indices/brands').expect(200);
    assert.deepEqual(brands.body.indices.map((row: { brandTier: string; value: number; categoryCount: number }) => [row.brandTier, row.value, row.categoryCount]), [
      ['standard_private_label', 64.82, 1],
      ['national', 83.19, 2]
    ]);
    assert.equal(brands.body.privateLabelSavingsPercent, 7.19);
    assert.equal(brands.body.generatedFrom, 3);
    assert.match(database.calls.at(-1)?.sql ?? '', /private_label_owner/i);
  });
});
