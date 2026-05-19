import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import request = require('supertest');
import { createApiApp } from '../src/main';

describe('api app', () => {
  it('serves health and swagger docs', async () => {
    const app = await createApiApp();

    try {
      await app.init();

      await request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect(({ body }) => {
          assert.equal(body.status, 'ok');
          assert.equal(body.service, 'groceryview-api');
        });

      await request(app.getHttpServer()).get('/api').expect(200).expect('content-type', /text\/html/);
    } finally {
      await app.close();
    }
  });
});
