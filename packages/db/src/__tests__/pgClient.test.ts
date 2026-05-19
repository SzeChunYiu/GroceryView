import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPgQueryExecutor } from '../index.js';

describe('createPgQueryExecutor', () => {
  it('adapts a pg-like client to the QueryExecutor interface', async () => {
    const calls: Array<{ text: string; values: unknown[] }> = [];
    const client = {
      async query(text: string, values: unknown[]) {
        calls.push({ text, values });
        return { rows: [{ id: 'row-1' }] };
      }
    };

    const executor = createPgQueryExecutor(client);
    const rows = await executor.query<{ id: string }>('select * from app_users where id = $1', ['user-1']);

    assert.deepEqual(rows, [{ id: 'row-1' }]);
    assert.deepEqual(calls, [{ text: 'select * from app_users where id = $1', values: ['user-1'] }]);
  });
});
