import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { type RequestLogRecord } from '../src/middleware/logger.js';

describe('GroceryView API request logging', () => {
  let app: INestApplication;
  let records: RequestLogRecord[];

  beforeEach(async () => {
    records = [];
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app, {
      requestLogging: {
        enabled: true,
        serviceName: 'api-test',
        writer: (record) => records.push(record)
      }
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('emits one queryable structured log per response with the request id', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .set('x-request-id', 'factory-ticket-607')
      .expect(200);

    assert.equal(response.headers['x-request-id'], 'factory-ticket-607');
    assert.equal(records.length, 1);
    assert.deepEqual(
      {
        event: records[0].event,
        service: records[0].service,
        method: records[0].method,
        path: records[0].path,
        status: records[0].status,
        requestId: records[0].requestId
      },
      {
        event: 'http_request',
        service: 'api-test',
        method: 'GET',
        path: '/health',
        status: 200,
        requestId: 'factory-ticket-607'
      }
    );
    assert.equal(typeof records[0].durationMs, 'number');
    assert.ok(records[0].durationMs >= 0);
    assert.match(records[0].timestamp, /^\d{4}-\d{2}-\d{2}T/);
  });
});
