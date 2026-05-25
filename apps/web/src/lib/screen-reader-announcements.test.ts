import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  chartSummaryAnnouncement,
  dealVerdictAnnouncement,
  filterPanelAnnouncement,
  mapListSyncAnnouncement,
  screenReaderAnnouncementContracts,
  searchAutocompleteAnnouncement
} from './screen-reader-announcements';

test('documents the required dynamic screen reader announcement surfaces', () => {
  assert.deepEqual(screenReaderAnnouncementContracts.map((contract) => contract.surface), [
    'search-autocomplete',
    'filters',
    'deal-verdict',
    'chart-summary',
    'map-list-sync'
  ]);
  assert.ok(screenReaderAnnouncementContracts.every((contract) => contract.wcagSignals.includes('4.1.3 Status Messages') || contract.wcagSignals.length > 0));
});

test('formats no-data and dynamic status announcements without fabricated values', () => {
  assert.match(searchAutocompleteAnnouncement({ status: 'empty', query: 'zzzz', resultCount: 0, optionCount: 0 }), /No verified product results/);
  assert.match(filterPanelAnnouncement({ activeFilterCount: 2, selectedDietary: ['vegan'], noData: true }), /No matching verified rows/);
  assert.match(chartSummaryAnnouncement({ chartAvailable: false, latestReadout: 'no points', markerCount: 0, pointCount: 0, rendererStatus: 'idle', title: 'Price history', windowLabel: '1Y' }), /No chart data/);
});

test('formats verdict and map/list sync summaries as complete sentences', () => {
  assert.equal(
    dealVerdictAnnouncement({ title: 'Oat milk', currentPriceLabel: '19 kr', verdict: 'Good deal', freshnessLabel: 'Fresh today', evidenceLabel: 'Source: verified row' }),
    'Oat milk. 19 kr. Verdict: Good deal. Freshness: Fresh today. Evidence: Source: verified row.'
  );
  assert.equal(
    mapListSyncAnnouncement({ selectedStoreName: 'ICA Nära', selectedStorePosition: 2, totalStores: 10, sourceCaveat: 'OSM location only; no shelf price inferred.' }),
    'ICA Nära selected, 2 of 10. OSM location only; no shelf price inferred.'
  );
});
