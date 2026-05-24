import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('store map falls back to manual entry when geolocation is unavailable', async () => {
  const source = await readFile(new URL('../store-map.tsx', import.meta.url), 'utf8');

  assert.match(source, /typeof navigator !== 'undefined' && 'geolocation' in navigator/);
  assert.match(source, /setGeolocationAvailable\(canGeolocate\)/);
  assert.match(source, /if \(canGeolocate\) \{[\s\S]*new maplibregl\.GeolocateControl/);
  assert.match(source, /htmlFor="manual-location"/);
  assert.match(source, /encodeURIComponent\(query\)/);
});
