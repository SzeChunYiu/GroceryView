import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { createAnalyticsConsentToken } from '../src/routes/analytics-consent.js';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

describe('GroceryView API app', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves health and OpenAPI docs', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', service: 'api' });

    const docs = await request(app.getHttpServer()).get('/api-json').expect(200);
    assert.equal(docs.body.info.title, 'GroceryView API');
    assert.ok(docs.body.paths['/health']);
    assert.ok(docs.body.paths['/products']);
    assert.ok(docs.body.paths['/products/{id}/terminal']);
    assert.ok(docs.body.paths['/products/{id}/spread']);
    assert.ok(docs.body.paths['/stores']);
  });

  it('serves products, stores, prices, watchlists, baskets, and alerts', async () => {
    const products = await request(app.getHttpServer()).get('/products?q=coffee').expect(200);
    assert.equal(products.body[0].id, 'coffee');
    assert.equal(products.body[0].currentPrices[0].priceType, 'shelf');
    assert.equal(products.body[0].currentPrices[0].sourceType, 'demo_seed');
    assert.ok(products.body[0].currentPrices[0].provenance);

    await request(app.getHttpServer()).get('/products/coffee').expect(200);
    await request(app.getHttpServer()).get('/stores/willys-odenplan').expect(200);

    const prices = await request(app.getHttpServer()).get('/products/coffee/prices').expect(200);
    assert.equal(prices.body[0].currency, 'SEK');
    assert.equal(prices.body[0].confidence, 'high');

    const terminal = await request(app.getHttpServer()).get('/products/coffee/terminal').expect(200);
    assert.equal(terminal.body.productId, 'coffee');
    assert.equal(terminal.body.ticker, 'ZOEGAS-COFFEE-450G');
    assert.equal(terminal.body.quote.bestPrice, 49.9);
    assert.deepEqual(terminal.body.distributions.map((distribution: { label: string }) => distribution.label), [
      'Whole Stockholm',
      'Odenplan local area'
    ]);
    assert.equal(terminal.body.chart.series[0].id, 'willys-odenplan:shelf');
    assert.equal(terminal.body.historySummary.isNewLow, true);
    assert.equal(terminal.body.evidenceGuardrails.length, 3);

    const spread = await request(app.getHttpServer()).get('/products/coffee/spread').expect(200);
    assert.equal(spread.body.productId, 'coffee');
    assert.equal(spread.body.currency, 'SEK');
    assert.equal(spread.body.sampleSize, 3);
    assert.equal(spread.body.bestStoreId, 'willys-odenplan');
    assert.equal(spread.body.highestStoreId, 'coop-odenplan');
    assert.equal(spread.body.spread, 15);
    assert.equal(spread.body.spreadPercent, 30.1);
    assert.deepEqual(spread.body.rows.map((row: { storeId: string; rank: number; priceLabel: string }) => ({
      storeId: row.storeId,
      rank: row.rank,
      priceLabel: row.priceLabel
    })), [
      { storeId: 'willys-odenplan', rank: 1, priceLabel: 'best' },
      { storeId: 'lidl-sveavagen', rank: 2, priceLabel: 'above_best' },
      { storeId: 'coop-odenplan', rank: 3, priceLabel: 'above_best' }
    ]);
    assert.match(spread.body.customerRead, /ranges 15.00 SEK/);
    assert.equal(spread.body.guardrails.length, 3);

    await request(app.getHttpServer())
      .post('/users/demo/watchlist')
      .send({ productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80, allowedPriceTypes: ['shelf'] })
      .expect(201);
    const watchlist = await request(app.getHttpServer()).get('/users/demo/watchlist').expect(200);
    assert.equal(watchlist.body.items[0].productId, 'coffee');
    assert.deepEqual(watchlist.body.items[0].allowedPriceTypes, ['shelf']);

    await request(app.getHttpServer())
      .post('/users/demo/basket/items')
      .send({ productId: 'coffee', quantity: 2 })
      .expect(201);
    const basket = await request(app.getHttpServer()).get('/users/demo/basket').expect(200);
    assert.equal(basket.body.items[0].quantity, 2);

    const comparison = await request(app.getHttpServer()).get('/users/demo/basket/comparison').expect(200);
    assert.deepEqual(comparison.body.strategies.map((strategy: { id: string }) => strategy.id), [
      'cheapest_across_selected',
      'all_at_one_store',
      'favorite_only',
      'private_label_substitution'
    ]);
    assert.deepEqual(comparison.body.strategies[0].missingProductIds, ['coffee']);
    assert.match(comparison.body.strategies[0].warnings[0], /missing verified prices/);

    await request(app.getHttpServer()).get('/users/demo/alerts').expect(200);
  });

  it('rejects invalid request DTOs through the global ValidationPipe', async () => {
    await request(app.getHttpServer())
      .post('/users/demo/basket/items')
      .send({ productId: 'coffee', quantity: 0 })
      .expect(400);
  });

  it('returns 404 for missing product terminal data', async () => {
    await request(app.getHttpServer()).get('/products/missing-product/terminal').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/spread').expect(404);
  });

  it('guards the item-card-impressions analytics endpoint by consent token', async () => {
    const sampleImpressions = {
      itemCards: [{ productId: 'coffee', storeId: 'willys-odenplan', position: 1 }]
    };
    const allowToken = createAnalyticsConsentToken({ consent: true });

    const accepted = await request(app.getHttpServer())
      .post('/api/analytics/item-card-impressions')
      .set('x-analytics-consent', allowToken)
      .send(sampleImpressions)
      .expect(201);

    assert.deepEqual(accepted.body, { accepted: 1 });

    await request(app.getHttpServer())
      .post('/api/analytics/item-card-impressions')
      .send(sampleImpressions)
      .expect(403);

    const deniedToken = createAnalyticsConsentToken({ consent: false });
    await request(app.getHttpServer())
      .post('/api/analytics/item-card-impressions')
      .set('x-analytics-consent', deniedToken)
      .send(sampleImpressions)
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/analytics/item-card-impressions')
      .set('x-analytics-consent', allowToken)
      .send({ itemCards: [] })
      .expect(400);
  });
});
