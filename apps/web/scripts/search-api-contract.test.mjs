import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

const repoRoot = resolve(new URL('../../..', import.meta.url).pathname);

function read(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

describe('product search barcode contract', () => {
  it('documents the public search endpoint and exact-match barcode semantics', () => {
    const docs = read('docs/api/search.md');

    assert.match(docs, /GET \/api\/search\?q=<query>/);
    assert.match(docs, /Barcode scanner handoffs use the same `q` parameter/);
    assert.match(docs, /products\.barcode = query\.term/);
    assert.match(docs, /exact-match only for barcodes/);
    assert.match(docs, /must not be treated as a barcode match unless the barcode field matches/);
    assert.match(docs, /does not infer price, stock, retailer availability/);
  });

  it('keeps the route wired to DB search and the DB query ranked by exact barcode equality', () => {
    const route = read('apps/web/src/app/api/search/route.ts');
    const dbSearch = read('packages/db/src/index.ts');

    assert.match(route, /searchParams\.get\('q'\)/);
    assert.match(route, /searchProductsByText/);
    assert.match(route, /query\.length < 2/);
    assert.match(route, /product_search_database_unconfigured/);
    assert.match(dbSearch, /products\.barcode = query\.term/);
    assert.match(dbSearch, /when products\.barcode = query\.term then 0/);
  });

  it('keeps scanner fallback from inventing catalogue matches when barcode lookup misses', () => {
    const helper = read('apps/web/src/lib/barcode-lookup.ts');
    const scanner = read('apps/web/src/components/scanner-upload-actions.tsx');

    assert.match(helper, /normalizeBarcode\(value\)/);
    assert.match(helper, /candidate\.code\) === barcode/);
    assert.match(helper, /missingProductDraftForBarcode/);
    assert.match(helper, /no price, stock, or retailer availability inferred from the scan/);
    assert.match(scanner, /No exact product match was returned/);
    assert.match(scanner, /Manual product candidate/);
  });
});
