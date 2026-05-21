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
    assert.ok(docs.body.paths['/products/{id}/spread']);
    assert.ok(docs.body.paths['/products/{id}/deal-score']);
    assert.ok(docs.body.paths['/products/{id}/equivalents']);
    assert.ok(docs.body.paths['/stores']);
    assert.ok(docs.body.paths['/stores/{id}/deals']);
    assert.ok(docs.body.paths['/users/demo/basket/local-offers']);
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

    const dealScore = await request(app.getHttpServer()).get('/products/coffee/deal-score?distanceKm=12.5').expect(200);
    assert.equal(dealScore.body.productId, 'coffee');
    assert.equal(dealScore.body.score, 82);
    assert.deepEqual(dealScore.body.band, { label: 'Good deal', verdict: 'Buy' });
    assert.equal(dealScore.body.verdict, 'Buy');
    assert.equal(dealScore.body.discountVsMedianPercent, 16.7);
    assert.equal(dealScore.body.historicalPercentile, 12);
    assert.equal(dealScore.body.confidence, 0.9);
    assert.match(dealScore.body.reasons[0], /Willys Odenplan/);
    assert.equal(dealScore.body.demo, true);

    const equivalents = await request(app.getHttpServer()).get('/products/milk/equivalents').expect(200);
    assert.deepEqual(
      equivalents.body.map((equivalent: { productId: string; bestStoreId: string; dealScore: number; demo: boolean }) => ({
        productId: equivalent.productId,
        bestStoreId: equivalent.bestStoreId,
        dealScore: equivalent.dealScore,
        demo: equivalent.demo
      })),
      [
        { productId: 'private-label-milk', bestStoreId: 'willys-odenplan', dealScore: 73, demo: true },
        { productId: 'butter', bestStoreId: 'coop-odenplan', dealScore: 40, demo: true }
      ]
    );

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

    const localOffers = await request(app.getHttpServer())
      .get('/users/demo/basket/local-offers?asOf=2026-05-20T12:00:00.000Z')
      .expect(200);
    assert.equal(localOffers.body.userId, 'demo');
    assert.equal(localOffers.body.demo, true);
    assert.equal(localOffers.body.basketItemCount, 1);
    assert.ok(localOffers.body.storeIds.length > 0);
    assert.equal(localOffers.body.bestStore.storeId, 'willys-odenplan');
    assert.equal(localOffers.body.bestStore.matchedProductIds[0], 'coffee');
    assert.equal(localOffers.body.guardrails.length, 3);

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
    await request(app.getHttpServer()).get('/products/missing-product/deal-score').expect(404);
    await request(app.getHttpServer()).get('/products/missing-product/equivalents').expect(404);
  });

  it('returns 404 for missing store deals', async () => {
    await request(app.getHttpServer()).get('/stores/missing-store/deals').expect(404);
  });
});
