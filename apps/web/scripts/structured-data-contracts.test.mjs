import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const structured = read('src/lib/structured-data.ts');

test('structured data helpers exist without unsafe stock or medical overclaims', () => {
  for (const helper of ['JsonLd', 'buildBreadcrumbJsonLd', 'buildOrganizationJsonLd', 'buildWebSiteJsonLd', 'buildProductJsonLd', 'buildStoreLocalBusinessJsonLd', 'buildFuelStationJsonLd', 'buildPharmacyProductJsonLd', 'buildDatasetJsonLd']) {
    assert.match(structured, new RegExp(`function ${helper}`));
  }
  assert.doesNotMatch(structured, /availability/);
  assert.match(structured, /no medical advice, prescription, or stock claim/);
});

test('safe structured data is applied to root product store fuel pharmacy and dataset surfaces', () => {
  assert.match(read('src/app/layout.tsx'), /buildOrganizationJsonLd/);
  assert.match(read('src/app/layout.tsx'), /buildWebSiteJsonLd/);
  assert.match(read('src/app/products/[slug]/page.tsx'), /Product/);
  assert.match(read('src/app/stores/[slug]/page.tsx'), /buildStoreLocalBusinessJsonLd/);
  assert.match(read('src/app/fuel/stations/[stationId]/page.tsx'), /buildFuelStationJsonLd/);
  assert.match(read('src/app/pharmacy/[product]/page.tsx'), /buildPharmacyProductJsonLd/);
  assert.match(read('src/app/data-sources/page.tsx'), /buildDatasetJsonLd/);
  assert.match(read('src/app/methodology/page.tsx'), /buildDatasetJsonLd/);
});
