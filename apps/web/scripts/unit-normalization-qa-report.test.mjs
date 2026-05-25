import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('data sources page surfaces unit normalization QA report', async () => {
  const unitNormalizer = await read('src/lib/unit-normalizer.ts');
  const normalization = await read('src/lib/normalization.ts');
  const dataSources = await read('src/app/data-sources/page.tsx');

  assert.match(unitNormalizer, /UnitNormalizationQaIssueKind/);
  assert.match(unitNormalizer, /missing_unit/);
  assert.match(unitNormalizer, /suspicious_pack_size/);
  assert.match(unitNormalizer, /inconsistent_unit_price/);
  assert.match(unitNormalizer, /unitNormalizationQaSeverity/);

  assert.match(normalization, /buildUnitNormalizationQaReport/);
  assert.match(normalization, /unitNormalizationQaIssuesForProduct/);
  assert.match(normalization, /packageEvidenceFromText/);
  assert.match(normalization, /No parseable package unit/);
  assert.match(normalization, /outside the expected grocery package range/);
  assert.match(normalization, /Normalized unit-price conversion/);

  assert.match(dataSources, /unitNormalizationQaReport/);
  assert.match(dataSources, /Unit normalization QA/);
  assert.match(dataSources, /Missing units/);
  assert.match(dataSources, /Suspicious pack sizes/);
  assert.match(dataSources, /Inconsistent conversions/);
  assert.match(dataSources, /synthetic kr\/kg, kr\/l, or kr\/st values/);
});

test('unit normalization audit keeps parser, mismatch, and bucket regressions covered', async () => {
  const normalization = await read('src/lib/normalization.ts');

  assert.match(normalization, /packageUnitPattern = 'kg\|g\|l\|ml\|st\|pc\|pcs\|piece\|pieces\|each'/);
  assert.match(normalization, /packCount \* packAmount/);
  assert.match(normalization, /ratio < 0\.5 \|\| ratio > 2/);
  assert.match(normalization, /differs sharply from reported unit price/);
  assert.match(normalization, /UnitNormalizationOutlierBucket = 'kg' \| 'l' \| 'piece'/);
  assert.match(normalization, /packageOutlierBucket/);
  assert.match(normalization, /suspiciousPackSizeBuckets/);
  assert.match(normalization, /Record<UnitNormalizationOutlierBucket, number> = \{ kg: 0, l: 0, piece: 0 \}/);
});
