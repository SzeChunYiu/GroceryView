import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertNoDatabaseConnectionLeaks,
  createDatabaseConnectionUsageMiddleware,
  getDatabaseConnectionLeakSnapshot,
  recordDatabaseCheckout,
  resetDatabaseConnectionLeakSnapshot,
  type DatabaseConnectionUsageLogRecord
} from '../src/database/connection-usage.js';

class FakeResponse {
  private finishListeners: Array<() => void> = [];

  on(event: 'finish', listener: () => void): void {
    if (event === 'finish') this.finishListeners.push(listener);
  }

  finish(): void {
    for (const listener of this.finishListeners) listener();
  }
}

describe('database connection usage instrumentation', () => {
  it('counts checkouts and reports no leaks after awaited queries', async () => {
    resetDatabaseConnectionLeakSnapshot();

    const result = await recordDatabaseCheckout(async () => ['row-1']);

    assert.deepEqual(result, ['row-1']);
    assert.deepEqual(assertNoDatabaseConnectionLeaks({ maxCheckoutCount: 1 }), {
      checkoutCount: 1,
      activeCheckoutCount: 0,
      maxActiveCheckoutCount: 1
    });
  });

  it('fails when a test exceeds the expected checkout count', async () => {
    resetDatabaseConnectionLeakSnapshot();

    await recordDatabaseCheckout(async () => undefined);
    await recordDatabaseCheckout(async () => undefined);

    assert.throws(
      () => assertNoDatabaseConnectionLeaks({ maxCheckoutCount: 1 }),
      /checkout count 2 exceeded expected maximum 1/i
    );
  });

  it('emits per-route checkout usage for dev and test request logging', async () => {
    resetDatabaseConnectionLeakSnapshot();
    const records: DatabaseConnectionUsageLogRecord[] = [];
    const response = new FakeResponse();
    const middleware = createDatabaseConnectionUsageMiddleware({
      enabled: true,
      serviceName: 'api-test',
      writer: (record) => records.push(record)
    });

    await new Promise<void>((resolve) => {
      middleware(
        {
          method: 'GET',
          path: '/api/products',
          headers: { 'x-request-id': 'db-usage-test' }
        },
        response,
        () => {
          void recordDatabaseCheckout(async () => undefined).then(() => {
            response.finish();
            resolve();
          });
        }
      );
    });

    assert.deepEqual(records.map(({ event, service, method, path, requestId, checkoutCount, leakedCheckoutCount }) => ({
      event,
      service,
      method,
      path,
      requestId,
      checkoutCount,
      leakedCheckoutCount
    })), [
      {
        event: 'database_connection_usage',
        service: 'api-test',
        method: 'GET',
        path: '/api/products',
        requestId: 'db-usage-test',
        checkoutCount: 1,
        leakedCheckoutCount: 0
      }
    ]);
    assert.equal(getDatabaseConnectionLeakSnapshot().activeCheckoutCount, 0);
  });
});
