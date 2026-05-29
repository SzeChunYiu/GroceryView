import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { buildQualityDatabaseReport } from '../../../scripts/ops/quality-report.mjs';
import { buildDeadLetterDatabaseReport } from '../../../scripts/ops/dead-letter-report.mjs';
import { buildSearchAnalyticsDatabaseReport } from '../../../scripts/ops/search-analytics-report.mjs';
import { buildUnavailableReport, isUndefinedTableError } from '../../../scripts/ops/report-env.mjs';

const repoRoot = new URL('../../../', import.meta.url);
const readSource = (rel) => readFileSync(new URL(rel, repoRoot), 'utf8');
const dbEnv = { DATABASE_URL: 'postgresql://stub:stub@127.0.0.1:5432/stub', GROCERYVIEW_REPORT_MODE: 'database' };

// Mock pg Pool: routes each query through `handler(sql, params)`; records SQL seen.
function mockPoolFactory(handler) {
  const seen = [];
  class MockPool {
    constructor() {}
    async query(text, params) {
      seen.push(text);
      return handler(text, params);
    }
    async end() {}
  }
  return { Pool: MockPool, seen };
}

test('quality-report DB query never references the non-existent products.metadata column', () => {
  // Regression for the shipped bug: `p.metadata->>'requiresPrescription'` crashed in DB mode
  // because no GroceryView schema defines products.metadata.
  const source = readSource('scripts/ops/quality-report.mjs');
  assert.doesNotMatch(source, /p\.metadata/, 'quality-report must not query p.metadata');
  assert.match(source, /receptbel/, 'prescription guard should use the connector receptbel signal on canonical_name');
});

test('quality-report runs all DB checks without column errors and stays live', async () => {
  const { Pool, seen } = mockPoolFactory(() => ({ rows: [{ count: 0 }] }));
  const report = await buildQualityDatabaseReport(dbEnv, { Pool });
  assert.equal(report.status, 'live');
  assert.ok(Array.isArray(report.checks) && report.checks.length > 0);
  // The pharmacy prescription-leak guard must query canonical_name, not a metadata column.
  const prescriptionSql = seen.find((sql) => sql.includes("lp.domain = 'pharmacy'"));
  assert.ok(prescriptionSql, 'expected a pharmacy prescription-leak query');
  assert.match(prescriptionSql, /canonical_name/);
  assert.doesNotMatch(prescriptionSql, /metadata/);
});

test('dead-letter report degrades to status "unavailable" when dead_letters table is absent', async () => {
  const { Pool } = mockPoolFactory((sql) => {
    if (sql.includes('to_regclass')) return { rows: [{ relation: null }] };
    throw new Error('should not query dead_letters when relation is absent');
  });
  const report = await buildDeadLetterDatabaseReport(dbEnv, { Pool });
  assert.equal(report.status, 'unavailable');
  assert.equal(report.productionClaim, false);
  assert.deepEqual(report.rows, []);
  assert.match(report.unavailableReason, /dead_letters/);
});

test('dead-letter report stays live when dead_letters table exists', async () => {
  const { Pool } = mockPoolFactory((sql) => {
    if (sql.includes('to_regclass')) return { rows: [{ relation: 'dead_letters' }] };
    return { rows: [] };
  });
  const report = await buildDeadLetterDatabaseReport(dbEnv, { Pool });
  assert.equal(report.status, 'live');
});

test('search-analytics report degrades to status "unavailable" when analytics_events table is absent', async () => {
  const { Pool } = mockPoolFactory((sql) => {
    if (sql.includes('to_regclass')) return { rows: [{ relation: null }] };
    throw new Error('should not query analytics_events when relation is absent');
  });
  const report = await buildSearchAnalyticsDatabaseReport(dbEnv, { Pool });
  assert.equal(report.status, 'unavailable');
  assert.equal(report.productionClaim, false);
  assert.deepEqual(report.rows, []);
  assert.match(report.unavailableReason, /analytics_events/);
});

test('report-env helpers classify undefined-table errors and build the unavailable shape', () => {
  assert.equal(isUndefinedTableError({ code: '42P01' }), true);
  assert.equal(isUndefinedTableError(new Error('relation "dead_letters" does not exist')), true);
  assert.equal(isUndefinedTableError(new Error('connection refused')), false);
  assert.equal(isUndefinedTableError(null), false);

  const report = buildUnavailableReport({ reportType: 'x_report', missingRelation: 'foo', databaseSource: 'DATABASE_URL' });
  assert.equal(report.status, 'unavailable');
  assert.equal(report.mode, 'database');
  assert.deepEqual(report.rows, []);
  assert.equal(report.productionClaim, false);
  assert.match(report.unavailableReason, /foo/);
});
