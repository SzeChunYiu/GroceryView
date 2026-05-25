import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('SLO error budget dashboard', () => {
  it('defines required reliability SLO dimensions with burn-rate thresholds and admin UI evidence', async () => {
    const [sourceHealth, page, sourceHealthPage] = await Promise.all([
      read('src/lib/source-health.ts'),
      read('src/app/admin/slo-error-budgets/page.tsx'),
      read('src/app/admin/source-health/page.tsx')
    ]);

    for (const dimension of [
      'availability',
      'p95_latency',
      'freshness',
      'ingestion_success',
      'source_coverage',
      'alert_delivery'
    ]) {
      assert.match(sourceHealth, new RegExp(`dimension: '${dimension}'`));
    }

    assert.match(sourceHealth, /criticalJourneyBurnRateThresholds/);
    assert.match(sourceHealth, /burnRate:\s*14\.4/);
    assert.match(sourceHealth, /burnRate:\s*6/);
    assert.match(sourceHealth, /burnRate:\s*1/);
    assert.match(sourceHealth, /status: 'unmeasured'/);
    assert.match(sourceHealth, /recentRoutePerformanceBudgetReports/);
    assert.match(sourceHealth, /sourceFreshnessSlaDashboard/);
    assert.match(sourceHealth, /ingestionPipelineMonitorRows/);
    assert.match(sourceHealth, /\/api\/metrics\/notifications/);

    assert.match(page, /SLOs and error budgets/);
    assert.match(page, /Burn-rate alert thresholds/);
    assert.match(page, /Rows with no attached metric stay unmeasured/);
    assert.match(page, /reliabilitySloDashboard/);
    assert.match(sourceHealthPage, /href="\/admin\/slo-error-budgets"/);
    assert.match(sourceHealthPage, /View SLO budgets/);
  });
});
