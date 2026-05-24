import test from 'node:test';
import assert from 'node:assert/strict';
import type { BenchmarkPriceLayer, BenchmarkStatus, CountryCode, EssentialsVertical, OfficialIndexSourceId } from '../benchmark.js';

const countries = ['SE', 'NO', 'IS'] as const satisfies readonly CountryCode[];
const verticals = ['grocery', 'pharmacy', 'fuel'] as const satisfies readonly EssentialsVertical[];
const sourceIds = ['EUROSTAT_HICP', 'SCB_CPI', 'SSB_CPI_03013', 'STATICE_CPI', 'STATICE_ENERGY', 'TLV_MEDICINES', 'NOMA_MEDICINES', 'EU_AGRI_FOOD'] as const satisfies readonly OfficialIndexSourceId[];
const layers = ['consumer_index', 'retail_observation', 'regulated_reference', 'upstream_agriculture', 'energy_context'] as const satisfies readonly BenchmarkPriceLayer[];
const statuses = ['registry_only', 'ingestion_planned', 'ingestion_ready', 'live'] as const satisfies readonly BenchmarkStatus[];

test('benchmark literal unions stay exhaustive for the Nordic registry', () => {
  assert.deepEqual([...countries], ['SE', 'NO', 'IS']);
  assert.equal(verticals.length, 3);
  assert.equal(sourceIds.length, 8);
  assert.equal(layers.length, 5);
  assert.equal(statuses.length, 4);
});
