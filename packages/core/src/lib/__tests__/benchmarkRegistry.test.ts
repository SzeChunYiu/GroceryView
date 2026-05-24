import test from 'node:test';
import assert from 'node:assert/strict';
import { benchmarkRegistry, getBenchmarkCategories, getBenchmarksFor, linkBenchmarkToCommodity } from '../benchmarkRegistry.js';

test('SE grocery registry includes SCB, Eurostat, and EU agri-food context', () => {
  const ids = getBenchmarksFor('SE', 'grocery').map((source) => source.id);
  assert.ok(ids.includes('SCB_CPI'));
  assert.ok(ids.includes('EUROSTAT_HICP'));
  assert.ok(ids.includes('EU_AGRI_FOOD'));
});

test('benchmark registry seed snapshot', () => {
  assert.deepEqual(benchmarkRegistry.map((source) => ({ id: source.id, countries: source.countries, verticals: source.verticals, layer: source.layer, frequency: source.frequency, status: source.status })), [
    { id: 'EUROSTAT_HICP', countries: ['SE', 'NO', 'IS'], verticals: ['grocery', 'pharmacy', 'fuel'], layer: 'consumer_index', frequency: 'monthly', status: 'registry_only' },
    { id: 'SCB_CPI', countries: ['SE'], verticals: ['grocery', 'pharmacy', 'fuel'], layer: 'consumer_index', frequency: 'monthly', status: 'registry_only' },
    { id: 'SSB_CPI_03013', countries: ['NO'], verticals: ['grocery', 'pharmacy', 'fuel'], layer: 'consumer_index', frequency: 'monthly', status: 'registry_only' },
    { id: 'STATICE_CPI', countries: ['IS'], verticals: ['grocery', 'pharmacy', 'fuel'], layer: 'consumer_index', frequency: 'monthly', status: 'registry_only' },
    { id: 'STATICE_ENERGY', countries: ['IS'], verticals: ['fuel'], layer: 'energy_context', frequency: 'monthly', status: 'registry_only' },
    { id: 'TLV_MEDICINES', countries: ['SE'], verticals: ['pharmacy'], layer: 'regulated_reference', frequency: 'quarterly', status: 'registry_only' },
    { id: 'NOMA_MEDICINES', countries: ['NO'], verticals: ['pharmacy'], layer: 'regulated_reference', frequency: 'quarterly', status: 'registry_only' },
    { id: 'EU_AGRI_FOOD', countries: ['SE'], verticals: ['grocery'], layer: 'upstream_agriculture', frequency: 'weekly', status: 'registry_only' },
  ]);
});

test('category filtering and commodity extension do not mutate registry categories', () => {
  const eurostat = benchmarkRegistry.find((source) => source.id === 'EUROSTAT_HICP')!;
  const grocery = getBenchmarkCategories(eurostat, 'grocery');
  const linked = linkBenchmarkToCommodity(grocery[0]!, 'milk');
  assert.equal(grocery.every((category) => category.vertical === 'grocery'), true);
  assert.deepEqual(linked.groceryViewCommodityIds, ['milk']);
  assert.equal(grocery[0]!.groceryViewCommodityIds, undefined);
});
