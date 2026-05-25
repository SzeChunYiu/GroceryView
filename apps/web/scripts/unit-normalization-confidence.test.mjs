import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('unit normalization exposes confidence metadata for price badges', async () => {
  const unitNormalizer = await read('src/lib/unit-normalizer.ts');
  const normalization = await read('src/lib/normalization.ts');
  const priceBadge = await read('src/components/price-badge.tsx');

  assert.match(unitNormalizer, /export type UnitNormalizationConfidence = "exact" \| "converted" \| "estimated"/);
  assert.match(unitNormalizer, /unitNormalizationConfidenceFor/);
  assert.match(unitNormalizer, /confidenceLabel/);
  assert.match(unitNormalizer, /Converted from/);

  assert.match(normalization, /confidence: 'exact' \| 'converted' \| 'estimated'/);
  assert.match(normalization, /Estimated from parsed multipack package text/);
  assert.match(normalization, /Converted package size from/);

  assert.match(priceBadge, /unitConfidence\?: "exact" \| "converted" \| "estimated" \| null/);
  assert.match(priceBadge, /unitConfidenceStyles/);
  assert.match(priceBadge, /Exact unit/);
  assert.match(priceBadge, /Converted unit/);
  assert.match(priceBadge, /Estimated unit/);
});
