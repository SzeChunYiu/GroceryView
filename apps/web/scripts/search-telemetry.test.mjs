import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('search telemetry route validates and persists bounded event batches', async () => {
  const source = await read('src/app/api/search/telemetry/route.ts');

  assert.match(source, /events\.length === 0 \|\| events\.length > 20/);
  assert.match(source, /events\.every\(isValidSearchTelemetryEvent\)/);
  assert.match(source, /Date\.parse\(value\.observedAt\)/);
  assert.match(source, /DATABASE_URL/);
  assert.match(source, /createPostgresSearchTelemetryWriter/);
  assert.match(source, /writer\.persistEvents\(events\)/);
  assert.match(source, /search_telemetry_database_unconfigured/);
  assert.match(source, /search_telemetry_persist_failed/);
});
