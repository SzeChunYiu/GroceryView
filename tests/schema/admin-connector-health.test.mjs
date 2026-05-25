import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

describe('admin connector health dashboard', () => {
  it('surfaces connector run freshness, product counts, and 24h row movement on /admin', () => {
    const adminPage = readFileSync('apps/web/src/app/admin/page.tsx', 'utf8');

    assert.match(adminPage, /sourceHealthDashboardRows/);
    assert.match(adminPage, /sourceHealthDashboardSummary/);
    assert.match(adminPage, /connector_runs freshness snapshot/);
    assert.match(adminPage, /last successful run/);
    assert.match(adminPage, /product rows per chain/);
    assert.match(adminPage, /24-hour ingest window/);
    assert.match(adminPage, /Product count/);
    assert.match(adminPage, /Price rows 24h/);
    assert.match(adminPage, /\/admin\/source-health/);
  });
});
