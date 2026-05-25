import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('price anomalies are queued before deal highlighting', async () => {
  const priceEvents = await read('src/lib/price-events.ts');
  const priceReports = await read('src/app/price-reports/page.tsx');
  const actions = await read('src/components/price-report-review-actions.tsx');

  assert.match(priceEvents, /priceAnomalyReviewWorkflow/);
  assert.match(priceEvents, /subjectType: 'price_anomaly'/);
  assert.match(priceEvents, /manualReviewDropPercent/);
  assert.match(priceEvents, /getPriceAnomalyReviewDecision/);
  assert.match(priceEvents, /canHighlightDeal: false/);
  assert.match(priceEvents, /human_price_anomaly_review/);

  assert.match(priceReports, /priceAnomalyReviewWorkflow/);
  assert.match(priceReports, /getPriceAnomalyReviewDecision/);
  assert.match(priceReports, /Extreme price changes wait for verification/);
  assert.match(priceReports, /false savings claims/);

  assert.match(actions, /priceAnomalyReviewWorkflow/);
  assert.match(actions, /price_anomaly/);
  assert.match(actions, /decidePriceAnomaly/);
  assert.match(actions, /Verify anomaly price/);
  assert.match(actions, /Quarantine false savings/);
  assert.match(actions, /canHighlightDeal/);
  assert.match(actions, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.doesNotMatch(actions, /localStorage\.setItem\('groceryview:userId'/);
});
