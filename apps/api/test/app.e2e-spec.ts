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

    await request(app.getHttpServer())
      .post('/users/demo/watchlist')
      .send({ productId: 'coffee', targetPrice: 50, alertDealScoreAt: 80 })
      .expect(201);
    const watchlist = await request(app.getHttpServer()).get('/users/demo/watchlist').expect(200);
    assert.equal(watchlist.body.items[0].productId, 'coffee');

    await request(app.getHttpServer())
      .post('/users/demo/basket/items')
      .send({ productId: 'coffee', quantity: 2 })
      .expect(201);
    const basket = await request(app.getHttpServer()).get('/users/demo/basket').expect(200);
    assert.equal(basket.body.items[0].quantity, 2);

    await request(app.getHttpServer()).get('/users/demo/alerts').expect(200);
  });

  it('rejects invalid request DTOs through the global ValidationPipe', async () => {
    await request(app.getHttpServer())
      .post('/users/demo/basket/items')
      .send({ productId: 'coffee', quantity: 0 })
      .expect(400);
  });
});
