import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('search telemetry helper batches autocomplete analytics without console output', async () => {
  const source = await read('src/lib/telemetry.ts');

  assert.match(source, /search_suggestion_clicked/);
  assert.match(source, /search_suggestions_dismissed/);
  assert.match(source, /search_first_result_time/);
  assert.match(source, /search_stream_event/);
  assert.match(source, /navigator\.sendBeacon/);
  assert.match(source, /keepalive: true/);
  assert.doesNotMatch(source, /console\./);
});

test('search telemetry route validates bounded event batches', async () => {
  const source = await read('src/app/api/search/telemetry/route.ts');

  assert.match(source, /events\.length === 0 \|\| events\.length > 20/);
  assert.match(source, /events\.every\(isValidSearchTelemetryEvent\)/);
  assert.match(source, /Number\.isInteger\(value\)/);
  assert.match(source, /Date\.parse\(value\.observedAt\)/);
  assert.match(source, /Invalid search telemetry batch/);
  assert.match(source, /accepted: events\.length/);
});

test('search bar records clicks, dismissals, first-result time, and stream events', async () => {
  const source = await read('src/components/SearchBar.tsx');
  const appNav = await read('src/components/app-nav.tsx');
  const globalSearchBar = await read('src/components/search/global-search-bar.tsx');

  assert.match(source, /trackSearchTelemetry/);
  assert.match(source, /trackSearchStreamEvent/);
  assert.match(source, /eventType: 'search_suggestion_clicked'/);
  assert.match(source, /eventType: 'search_suggestions_dismissed'/);
  assert.match(source, /eventType: 'search_first_result_time'/);
  assert.match(source, /autocomplete_request_started/);
  assert.match(source, /autocomplete_results_rendered/);
  assert.match(source, /closeSuggestions\('escape_key'\)/);
  assert.match(source, /dismissSuggestions\('query_changed'\)/);
  assert.doesNotMatch(source, /console\./);
  assert.match(globalSearchBar, /GlobalSearchBar/);
  assert.match(appNav, /<GlobalSearchBar \/>/);
});
