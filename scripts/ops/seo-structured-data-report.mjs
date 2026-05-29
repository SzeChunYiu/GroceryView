import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const structured = read('apps/web/src/lib/structured-data.ts');
const helpers = ['JsonLd', 'buildBreadcrumbJsonLd', 'buildOrganizationJsonLd', 'buildWebSiteJsonLd', 'buildProductJsonLd', 'buildStoreLocalBusinessJsonLd', 'buildFuelStationJsonLd', 'buildPharmacyProductJsonLd', 'buildDatasetJsonLd'];
const missingHelpers = helpers.filter((helper) => !structured.includes(`function ${helper}`));
assert.deepEqual(missingHelpers, []);
const uses = {
  layout: read('apps/web/src/app/layout.tsx').includes('buildOrganizationJsonLd') && read('apps/web/src/app/layout.tsx').includes('buildWebSiteJsonLd'),
  store: read('apps/web/src/app/stores/[slug]/page.tsx').includes('buildStoreLocalBusinessJsonLd'),
  fuelStation: read('apps/web/src/app/fuel/stations/[stationId]/page.tsx').includes('buildFuelStationJsonLd'),
  pharmacyProduct: read('apps/web/src/app/pharmacy/[product]/page.tsx').includes('buildPharmacyProductJsonLd'),
  dataset: read('apps/web/src/app/data-sources/page.tsx').includes('buildDatasetJsonLd') && read('apps/web/src/app/methodology/page.tsx').includes('buildDatasetJsonLd')
};
assert.deepEqual(Object.entries(uses).filter(([, ok]) => !ok), []);
assert.equal(/availability/i.test(structured), false, 'structured-data helper must not emit stock availability by default');
console.log(JSON.stringify({ status: 'ok', helpers, uses }, null, 2));
