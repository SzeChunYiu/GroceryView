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
    assert.ok(docs.body.paths['/stores/{id}/deal-summary']);
    assert.ok(docs.body.paths['/stores/{id}/coverage']);
    assert.ok(docs.body.paths['/stores/{id}/category-coverage']);

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

  it('serves store deal summaries with category leaders', async () => {
    const response = await request(app.getHttpServer()).get('/stores/willys-odenplan/deal-summary').expect(200);

    assert.equal(response.body.storeId, 'willys-odenplan');
    assert.equal(response.body.storeName, 'Willys Odenplan');
    assert.equal(response.body.dealCount, 4);
    assert.equal(response.body.buyVerdictCount, 1);
    assert.equal(response.body.averageDealScore, 67);
    assert.deepEqual(response.body.topDeal, {
      productId: 'coffee',
      ticker: 'ZOEGAS-COFFEE-450G',
      productName: 'Zoégas Coffee 450g',
      category: 'coffee',
      storeId: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      price: 49.9,
      dealScore: 82,
      band: { label: 'Good deal', verdict: 'Buy' },
      unitPrice: '110.89 SEK/kg'
    });
    assert.deepEqual(
      response.body.categories.map(
        (category: { category: string; dealCount: number; averageDealScore: number; topProductId: string; topDealScore: number }) => ({
          category: category.category,
          dealCount: category.dealCount,
          averageDealScore: category.averageDealScore,
          topProductId: category.topProductId,
          topDealScore: category.topDealScore
        })
      ),
      [
        { category: 'coffee', dealCount: 1, averageDealScore: 82, topProductId: 'coffee', topDealScore: 82 },
        { category: 'dairy', dealCount: 3, averageDealScore: 62, topProductId: 'private-label-milk', topDealScore: 73 }
      ]
    );
    assert.equal(response.body.guardrails.length, 3);
    assert.equal(response.body.demo, true);
  });

  it('returns 404 for missing store deal summaries', async () => {
    await request(app.getHttpServer()).get('/stores/missing-store/deal-summary').expect(404);
  });

  it('serves verified shelf price coverage from store profiles', async () => {
    const response = await request(app.getHttpServer()).get('/stores/willys-odenplan/coverage').expect(200);

    assert.equal(response.body.storeId, 'willys-odenplan');
    assert.equal(response.body.storeName, 'Willys Odenplan');
    assert.equal(response.body.currency, 'SEK');
    assert.equal(response.body.demo, true);
    assert.equal(response.body.productCount, response.body.lines.length);
    assert.equal(response.body.pricedProductCount, 4);
    assert.equal(response.body.coveragePercent, 100);
    assert.deepEqual(
      response.body.lines
        .filter((line: { priceLabel: string }) => line.priceLabel === 'verified_shelf')
        .map((line: { productId: string; price: number }) => ({ productId: line.productId, price: line.price })),
      [
        { productId: 'coffee', price: 49.9 },
        { productId: 'milk', price: 14.9 },
        { productId: 'private-label-milk', price: 12.9 },
        { productId: 'butter', price: 56.9 }
      ]
    );
    assert.deepEqual(response.body.missingProductIds, []);
    assert.equal(response.body.guardrails.length, 3);
  });

  it('returns 404 for missing store coverage feeds', async () => {
    await request(app.getHttpServer()).get('/stores/missing-store/coverage').expect(404);
  });

  it('serves verified shelf price coverage grouped by category', async () => {
    const response = await request(app.getHttpServer()).get('/stores/willys-odenplan/category-coverage').expect(200);

    assert.equal(response.body.storeId, 'willys-odenplan');
    assert.equal(response.body.storeName, 'Willys Odenplan');
    assert.equal(response.body.currency, 'SEK');
    assert.equal(response.body.demo, true);
    assert.equal(response.body.categoryCount, response.body.categories.length);
    assert.equal(response.body.fullyPricedCategoryCount, 2);
    assert.deepEqual(
      response.body.categories.map(
        (category: {
          category: string;
          productCount: number;
          pricedProductCount: number;
          coveragePercent: number;
          missingProductIds: string[];
          bestDealProductId: string | null;
        }) => ({
          category: category.category,
          productCount: category.productCount,
          pricedProductCount: category.pricedProductCount,
          coveragePercent: category.coveragePercent,
          missingProductIds: category.missingProductIds,
          bestDealProductId: category.bestDealProductId
        })
      ),
      [
        {
          category: 'coffee',
          productCount: 1,
          pricedProductCount: 1,
          coveragePercent: 100,
          missingProductIds: [],
          bestDealProductId: 'coffee'
        },
        {
          category: 'dairy',
          productCount: 3,
          pricedProductCount: 3,
          coveragePercent: 100,
          missingProductIds: [],
          bestDealProductId: 'milk'
        }
      ]
    );
    assert.equal(response.body.guardrails.length, 3);
  });

  it('returns 404 for missing store category coverage feeds', async () => {
    await request(app.getHttpServer()).get('/stores/missing-store/category-coverage').expect(404);
  });
});
