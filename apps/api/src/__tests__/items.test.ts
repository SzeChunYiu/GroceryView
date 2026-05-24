import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../app.module.js';
import { configureApp } from '../configure-app.js';

describe('GroceryView API items routes', () => {
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

  it('serves paginated item lists with search and catalog filters', async () => {
    const response = await request(app.getHttpServer())
      .get('/items')
      .query({ q: 'milk', category: 'dairy', chain: 'willys', limit: '1', offset: '1' })
      .expect(200);

    assert.equal(response.body.demo, true);
    assert.equal(response.body.total, 2);
    assert.equal(response.body.limit, 1);
    assert.equal(response.body.offset, 1);
    assert.deepEqual(
      response.body.items.map((item: { id: string }) => item.id),
      ['private-label-milk']
    );
  });

  it('returns item detail by id and 404 for missing items', async () => {
    const response = await request(app.getHttpServer()).get('/items/coffee').expect(200);

    assert.equal(response.body.id, 'coffee');
    assert.equal(response.body.name, 'Zoégas Coffee 450g');
    assert.equal(response.body.demo, true);

    await request(app.getHttpServer()).get('/items/missing-item').expect(404);
  });

  it('returns current prices by item id and 404 for missing price feeds', async () => {
    const response = await request(app.getHttpServer()).get('/items/coffee/prices').expect(200);

    assert.equal(response.body.itemId, 'coffee');
    assert.equal(response.body.demo, true);
    assert.deepEqual(
      response.body.prices.map((price: { storeId: string; price: number }) => ({ storeId: price.storeId, price: price.price })),
      [
        { storeId: 'willys-odenplan', price: 49.9 },
        { storeId: 'lidl-sveavagen', price: 59.9 },
        { storeId: 'coop-odenplan', price: 64.9 }
      ]
    );

    await request(app.getHttpServer()).get('/items/missing-item/prices').expect(404);
  });
});
