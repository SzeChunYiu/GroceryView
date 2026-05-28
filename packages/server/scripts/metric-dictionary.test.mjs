import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const dictionaryUrl = new URL('../../../docs/data/metric-dictionary.md', import.meta.url);

const requiredFields = ['Definition', 'Formula', 'Source tables', 'Owner'];

function parseMetrics(markdown) {
  const sections = markdown.split(/\n---\n/);
  const metrics = [];
  for (const section of sections) {
    const titleMatch = section.match(/^## ([a-z0-9_]+)/m);
    if (!titleMatch) continue;
    const id = titleMatch[1];
    const fields = {};
    for (const field of requiredFields) {
      const pattern = new RegExp(`\\*\\*${field}\\*\\* \\| ([^\n|]+)`, 'i');
      const match = section.match(pattern);
      fields[field] = match?.[1]?.trim() ?? '';
    }
    metrics.push({ id, ...fields });
  }
  return metrics;
}

describe('docs/data/metric-dictionary.md', () => {
  it('defines at least ten metrics with definition, formula, source tables, and owner', async () => {
    const markdown = await readFile(dictionaryUrl, 'utf8');
    const metrics = parseMetrics(markdown);

    assert.ok(metrics.length >= 10, `expected >= 10 metrics, got ${metrics.length}`);

    const requiredIds = [
      'unit_price_sek',
      'deal_score',
      'observation_confidence',
      'basket_savings_sek',
      'price_spread_pct',
      'freshness_rate',
      'coverage_rate',
      'search_zero_result_rate'
    ];

    for (const id of requiredIds) {
      assert.ok(metrics.some((metric) => metric.id === id), `missing metric ${id}`);
    }

    for (const metric of metrics) {
      for (const field of requiredFields) {
        assert.ok(metric[field]?.length > 0, `${metric.id} missing ${field}`);
      }
      assert.match(metric.Owner, /data_engineering|analytics|product/, `${metric.id} owner must be set`);
      assert.match(metric['Source tables'], /[a-z_]+/, `${metric.id} must list source tables`);
    }
  });
});
