import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';

describe('GroceryView API store deals', () => {
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

  it('serves ranked in-store deals from store profiles', async () => {
    const docs = await request(app.getHttpServer()).get('/api-json').expect(200);
    assert.ok(docs.body.paths['/stores/{id}/deals']);

    const response = await request(app.getHttpServer()).get('/stores/willys-odenplan/deals').expect(200);

    assert.equal(response.body[0].storeId, 'willys-odenplan');
    assert.equal(response.body[0].productId, 'coffee');
    assert.equal(response.body[0].dealScore, 82);
    assert.equal(response.body[0].band.label, 'Good deal');
    assert.deepEqual(response.body.map((deal: { storeId: string }) => deal.storeId), [
      'willys-odenplan',
      'willys-odenplan',
      'willys-odenplan',
      'willys-odenplan'
    ]);
  });

  it('returns 404 for missing store deal feeds', async () => {
    await request(app.getHttpServer()).get('/stores/missing-store/deals').expect(404);
  });
});
