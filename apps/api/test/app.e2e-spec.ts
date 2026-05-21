import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
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
    assert.ok(docs.body.paths['/stores']);
    assert.ok(docs.body.paths['/stores/{id}/deals']);
  });

  it('serves products, stores, prices, watchlists, baskets, and alerts', async () => {
    const products = await request(app.getHttpServer()).get('/products?q=coffee').expect(200);
    assert.equal(products.body[0].id, 'coffee');
    assert.equal(products.body[0].currentPrices[0].priceType, 'shelf');
    assert.equal(products.body[0].currentPrices[0].sourceType, 'demo_seed');
    assert.ok(products.body[0].currentPrices[0].provenance);

    await request(app.getHttpServer()).get('/products/coffee').expect(200);
    await request(app.getHttpServer()).get('/stores/willys-odenplan').expect(200);

    const storeDeals = await request(app.getHttpServer()).get('/stores/willys-odenplan/deals').expect(200);
    assert.deepEqual(
      storeDeals.body.map((deal: { productId: string; storeId: string; dealScore: number; demo: boolean }) => ({
        productId: deal.productId,
        storeId: deal.storeId,
        dealScore: deal.dealScore,
        demo: deal.demo
      })),
      [
        { productId: 'coffee', storeId: 'willys-odenplan', dealScore: 82, demo: true },
        { productId: 'private-label-milk', storeId: 'willys-odenplan', dealScore: 73, demo: true },
        { productId: 'milk', storeId: 'willys-odenplan', dealScore: 73, demo: true },
        { productId: 'butter', storeId: 'willys-odenplan', dealScore: 40, demo: true }
      ]
    );

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
  });

  it('returns 404 for missing store deals', async () => {
    await request(app.getHttpServer()).get('/stores/missing-store/deals').expect(404);
  });
});
