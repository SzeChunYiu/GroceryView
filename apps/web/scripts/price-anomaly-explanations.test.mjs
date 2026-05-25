import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = {
  actions: new URL('../src/components/price-report-review-actions.tsx', import.meta.url),
  data: new URL('../src/lib/verified-data.ts', import.meta.url),
  normalization: new URL('../src/lib/normalization.ts', import.meta.url)
};

describe('price report anomaly explanations', () => {
  it('defines reusable anomaly causes for reviewer triage', async () => {
    const normalization = await readFile(files.normalization, 'utf8');

    assert.match(normalization, /PriceAnomalyCauseKind = 'unit_mismatch' \| 'stale_feed' \| 'promotion_parsing'/);
    assert.match(normalization, /export function explainPriceAnomaly/);
    assert.match(normalization, /Possible unit mismatch/);
    assert.match(normalization, /Possible stale feed/);
    assert.match(normalization, /Possible promotion parsing/);
  });

  it('wires anomaly examples into verified data and the review actions UI', async () => {
    const [data, actions] = await Promise.all([
      readFile(files.data, 'utf8'),
      readFile(files.actions, 'utf8')
    ]);

    assert.match(data, /export const priceAnomalyReviewPlan/);
    assert.match(data, /price-anomaly-unit-coffee/);
    assert.match(data, /price-anomaly-stale-salmon/);
    assert.match(data, /price-anomaly-promo-juice/);
    assert.match(data, /explainPriceAnomaly\(row\)/);

    assert.match(actions, /priceAnomalyReviewPlan/);
    assert.match(actions, /aria-label="Price anomaly explanations"/);
    assert.match(actions, /Anomaly triage/);
    assert.match(actions, /reviewerHint/);
  });
});
