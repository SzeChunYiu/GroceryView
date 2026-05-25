import assert from 'node:assert/strict';
import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { describe, it } from 'node:test';
import { AdminController } from '../src/admin/admin.controller.js';

function createController(configured = true) {
  const calls: string[] = [];
  const controller = new AdminController({
    isConfigured: () => configured,
    query: async (sql: string) => {
      calls.push(sql);
      if (sql.includes('group by kind')) {
        return [{
          kind: 'zero_rows',
          alert_count: '2',
          connector_count: '1',
          latest_detected_at: new Date('2026-05-25T12:00:00.000Z')
        }];
      }
      return [{
        id: 'alert-1',
        kind: 'zero_rows',
        connector: 'bonus-is',
        detected_at: '2026-05-25T12:00:00.000Z',
        payload: { rowCount: 0 }
      }];
    }
  } as never);
  return { calls, controller };
}

describe('admin coverage anomaly endpoint', () => {
  it('summarizes unresolved ingestion alerts for admin and ops roles', async () => {
    const { calls, controller } = createController();
    const response = await controller.coverage('ops');

    assert.equal(calls.length, 2);
    assert.match(calls[0] ?? '', /from ingestion_alert/);
    assert.deepEqual(response.unresolved, [{
      kind: 'zero_rows',
      alertCount: 2,
      connectorCount: 1,
      latestDetectedAt: '2026-05-25T12:00:00.000Z'
    }]);
    assert.deepEqual(response.recent[0], {
      id: 'alert-1',
      kind: 'zero_rows',
      connector: 'bonus-is',
      detectedAt: '2026-05-25T12:00:00.000Z',
      payload: { rowCount: 0 }
    });
  });

  it('keeps /admin/coverage guarded and fails closed without PostgreSQL', async () => {
    await assert.rejects(() => createController().controller.coverage(undefined), UnauthorizedException);
    await assert.rejects(() => createController(false).controller.coverage('admin'), ServiceUnavailableException);
  });
});
