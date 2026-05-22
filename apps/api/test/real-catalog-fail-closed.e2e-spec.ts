import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { PostgresQueryExecutorService } from '../src/database/postgres-query-executor.service.js';

class UnconfiguredPostgresExecutor {
  queryCount = 0;

  isConfigured(): boolean {
    return false;
  }

  async query<T>(): Promise<T[]> {
    this.queryCount += 1;
    throw new Error('Unexpected PostgreSQL query without DATABASE_URL.');
  }
}

describe('real catalog API fail-closed behavior', () => {
  let app: INestApplication;
  let database: UnconfiguredPostgresExecutor;

  beforeEach(async () => {
    database = new UnconfiguredPostgresExecutor();
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

  it('fails closed instead of querying or serving demo data without PostgreSQL', async () => {
    await request(app.getHttpServer()).get('/products/search/faceted?q=mjolk').expect(503);
    await request(app.getHttpServer()).get('/indices/chains').expect(503);
    await request(app.getHttpServer()).get('/indices/categories').expect(503);
    await request(app.getHttpServer()).get('/indices/brands').expect(503);
    await request(app.getHttpServer()).get('/products/standardmjolk-1l/cheapest-now').expect(503);
    await request(app.getHttpServer())
      .post('/baskets/compare')
      .send({ items: [{ productId: 'standardmjolk-1l', quantity: 1 }] })
      .expect(503);
    await request(app.getHttpServer()).get('/users/user-1/basket/compare').expect(503);

    assert.equal(database.queryCount, 0);
  });
});
