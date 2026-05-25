import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const Module = require('node:module');
const ts = require('typescript');

function installTypeScriptRuntime() {
  const originalResolveFilename = Module._resolveFilename;
  const originalTsLoader = Module._extensions['.ts'];

  Module._extensions['.ts'] = function transpileTypeScript(module, filename) {
    const source = readFileSync(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022
      },
      fileName: filename
    });
    module._compile(outputText, filename);
  };

  Module._resolveFilename = function resolveCompiledTsSibling(request, parent, isMain, options) {
    if (request.startsWith('.') && request.endsWith('.js') && parent?.filename) {
      const candidate = resolve(dirname(parent.filename), request.slice(0, -3) + '.ts');
      if (existsSync(candidate)) {
        return originalResolveFilename.call(this, candidate, parent, isMain, options);
      }
    }
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  return () => {
    Module._resolveFilename = originalResolveFilename;
    if (originalTsLoader) Module._extensions['.ts'] = originalTsLoader;
    else delete Module._extensions['.ts'];
  };
}

const cleanupRuntime = installTypeScriptRuntime();
const {
  fetchComparePriceSnapshots,
  parseCompareItemIdsParam
} = require('../src/lib/compare-price-snapshots.js');
cleanupRuntime();

describe('compare price snapshots helper', () => {
  it('parses comma and repeated query values by trimming, de-duping, and enforcing the item limit', () => {
    assert.deepEqual(
      parseCompareItemIdsParam([' milk, bread ', 'milk', 'eggs,,coffee,tea'], 4),
      ['milk', 'bread', 'eggs', 'coffee']
    );
    assert.deepEqual(parseCompareItemIdsParam('a,b,a,c,d,e', 3), ['a', 'b', 'c']);
    assert.deepEqual(parseCompareItemIdsParam(undefined), []);
  });

  it('shapes fetched comparison items into flat store rows and explicit missing ids', async () => {
    const seenUrls = [];
    const result = await fetchComparePriceSnapshots('milk,bread,missing', {
      endpoint: '/compare/items',
      fetcher: async (url) => {
        seenUrls.push(url);
        return {
          ok: true,
          json: async () => ({
            items: [
              {
                slug: 'milk',
                name: 'Milk',
                storePrices: [
                  { storeName: 'Store A', price: 12.5, priceLabel: '12,50 kr', unitPrice: 12.5, unitPriceLabel: '12,50 kr/l', unitLabel: 'kr/l' },
                  { storeName: 'Store B', price: 11, priceLabel: '11,00 kr', unitLabel: 'kr/l' }
                ]
              },
              {
                slug: 'bread',
                name: 'Bread',
                storePrices: [
                  { storeName: 'Store A', price: 25, priceLabel: '25,00 kr', unitLabel: 'kr/st' }
                ]
              }
            ],
            missingItemIds: ['missing']
          })
        };
      }
    });

    assert.deepEqual(seenUrls, ['/compare/items?items=milk%2Cbread%2Cmissing']);
    assert.equal(result.endpointUnavailable, false);
    assert.deepEqual(result.itemIds, ['milk', 'bread', 'missing']);
    assert.deepEqual(result.missingItemIds, ['missing']);
    assert.deepEqual(result.storeRows, [
      { itemId: 'milk', itemName: 'Milk', storeName: 'Store A', price: 12.5, priceLabel: '12,50 kr', unitPrice: 12.5, unitPriceLabel: '12,50 kr/l', unitLabel: 'kr/l' },
      { itemId: 'milk', itemName: 'Milk', storeName: 'Store B', price: 11, priceLabel: '11,00 kr', unitLabel: 'kr/l' },
      { itemId: 'bread', itemName: 'Bread', storeName: 'Store A', price: 25, priceLabel: '25,00 kr', unitLabel: 'kr/st' }
    ]);
  });

  it('falls back to a no-row result when the compare endpoint is unavailable', async () => {
    const rejected = await fetchComparePriceSnapshots('milk,milk,bread', {
      fetcher: async () => {
        throw new Error('offline');
      }
    });
    assert.deepEqual(rejected, {
      itemIds: ['milk', 'bread'],
      storeRows: [],
      missingItemIds: ['milk', 'bread'],
      endpointUnavailable: true
    });

    const notOk = await fetchComparePriceSnapshots('milk,bread', {
      fetcher: async () => ({ ok: false, json: async () => ({}) })
    });
    assert.equal(notOk.endpointUnavailable, true);
    assert.deepEqual(notOk.missingItemIds, ['milk', 'bread']);
  });
});
