import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const Module = require('node:module');
const ts = require('typescript');

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptsDir, '..');
const repoRoot = resolve(webRoot, '..', '..');
const workspacePackages = ['api', 'core'];

function installRuntime() {
  const originalResolveFilename = Module._resolveFilename;
  const originalTsLoader = Module._extensions['.ts'];

  Module._extensions['.ts'] = function transpileTypeScript(module, filename) {
    const source = readFileSync(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.Node10,
        target: ts.ScriptTarget.ES2022
      },
      fileName: filename
    });
    module._compile(outputText, filename);
  };

  Module._resolveFilename = function resolveImports(request, parent, isMain, options) {
    if (request.startsWith('@/')) {
      return originalResolveFilename.call(this, join(webRoot, 'src', request.slice(2)), parent, isMain, options);
    }
    if (request.startsWith('@groceryview/')) {
      const packageName = request.slice('@groceryview/'.length);
      if (workspacePackages.includes(packageName)) {
        return originalResolveFilename.call(this, join(repoRoot, 'packages', packageName, 'src/index.ts'), parent, isMain, options);
      }
    }
    if (request.startsWith('.') && request.endsWith('.js') && parent?.filename) {
      const extensionless = resolve(dirname(parent.filename), request.slice(0, -3));
      for (const extension of ['.ts', '.tsx']) {
        const candidate = `${extensionless}${extension}`;
        if (existsSync(candidate)) {
          return originalResolveFilename.call(this, candidate, parent, isMain, options);
        }
      }
    }
    if (request.startsWith('.') && parent?.filename) {
      const extensionless = resolve(dirname(parent.filename), request);
      for (const extension of ['.ts', '.tsx']) {
        const candidate = `${extensionless}${extension}`;
        if (existsSync(candidate)) {
          return originalResolveFilename.call(this, candidate, parent, isMain, options);
        }
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

function loadMyFlyerModule() {
  const cleanup = installRuntime();
  try {
    return {
      cleanup,
      module: require('../src/lib/my-flyer.ts')
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}

function flyerOffer(overrides = {}) {
  return {
    offerId: 'offer-base',
    flyerId: 'flyer-base',
    chain: 'willys',
    storeId: 'willys-odenplan',
    storeName: 'Willys Odenplan',
    branchDistrict: 'Stockholm',
    productId: 'base-product',
    productName: 'Base Product',
    category: 'skafferi',
    regularPrice: 50,
    offerPrice: 40,
    savings: 10,
    discountPercent: 20,
    currency: 'SEK',
    packageQuantity: 1,
    packageUnit: 'kg',
    effectiveUnitPrice: 40,
    effectiveUnitPriceUnit: 'kg',
    priceType: 'flyer',
    validFrom: '2026-05-19T00:00:00.000Z',
    validThrough: '2026-05-25T21:59:59.000Z',
    observedAt: '2026-05-19T06:30:00.000Z',
    sourceType: 'weekly_flyer',
    sourceUrl: 'https://www.willys.se/erbjudanden/stockholm/vecka-21',
    sourceRunId: 'source-run-willys-flyer-2026-05-19',
    confidence: 0.9,
    dealScore: 80,
    band: 'good',
    ...overrides
  };
}

describe('my-flyer API payload', () => {
  it('ranks active weekly flyer rows per user and algorithm', () => {
    const { cleanup, module } = loadMyFlyerModule();
    try {
      const asOf = new Date('2026-05-20T12:00:00.000Z');
      const payload = module.buildMyFlyerPayload({
        userId: 'user-1',
        algorithm: 'watchlist_first',
        country: 'se',
        limit: 2
      }, asOf);

      assert.equal(payload.userId, 'user-1');
      assert.equal(payload.algorithm, 'watchlist_first');
      assert.equal(payload.cache.ttlSeconds, 3600);
      assert.equal(payload.source.offerCount, 4);
      assert.equal(payload.rows.length, 2);
      assert.deepEqual(payload.rows.map((row) => row.rank), [1, 2]);
      assert.ok(payload.rows[0].personalizedScore >= payload.rows[1].personalizedScore);
      assert.match(payload.rows[0].explanation.join(' '), /watchlist_first ranker/);
      assert.ok(payload.rows.every((row) => row.offer.sourceUrl && row.offer.sourceRunId));
      assert.ok(payload.rows.every((row) => row.offer.packageQuantity && row.offer.packageUnit));
    } finally {
      cleanup();
    }
  });

  it('ranks organic eco flyer rows by savings and excludes untagged rows', () => {
    const { cleanup, module } = loadMyFlyerModule();
    try {
      const ranked = module.rankOrganicEcoListings([
        flyerOffer({
          offerId: 'untagged-high-savings',
          productId: 'untagged-high-savings',
          productName: 'Untagged High Savings',
          labels: [],
          savings: 50
        }),
        flyerOffer({
          offerId: 'organic-lower-savings',
          productId: 'organic-lower-savings',
          productName: 'Organic Lower Savings',
          labels: ['ecological'],
          savings: 8
        }),
        flyerOffer({
          offerId: 'organic-higher-savings',
          productId: 'organic-higher-savings',
          productName: 'Organic Higher Savings',
          tags: ['KRAV'],
          savings: 18
        }),
        flyerOffer({
          offerId: 'organic-without-source',
          productId: 'organic-without-source',
          productName: 'Organic Without Source',
          labels: ['organic'],
          sourceRunId: '',
          savings: 80
        })
      ]);

      assert.deepEqual(ranked.map((offer) => offer.offerId), ['organic-higher-savings', 'organic-lower-savings']);
    } finally {
      cleanup();
    }
  });


  it('uses API-provided unit economics for best-unit-price ranking without productId hints', () => {
    const source = readFileSync(new URL('../src/lib/my-flyer.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(source, /unitHints/);
    assert.doesNotMatch(source, /coffee:\s*0\.45/);

    const { cleanup, module } = loadMyFlyerModule();
    try {
      const payload = module.buildMyFlyerPayload({
        userId: 'user-1',
        algorithm: 'best_unit_price',
        country: 'se',
        limit: 4
      }, new Date('2026-05-20T12:00:00.000Z'));

      assert.equal(payload.rows.length, 4);
      assert.ok(payload.rows.every((row) => typeof row.scoreBreakdown.unitPrice === 'number' && row.scoreBreakdown.unitPrice > 0));
      assert.ok(payload.rows.every((row) => row.offer.effectiveUnitPrice === row.scoreBreakdown.unitPrice));
      assert.match(payload.source.guardrails.join(' '), /excludes flyer rows that lack package quantity/i);
    } finally {
      cleanup();
    }
  });

  it('keeps cache entries scoped by user id for one hour', () => {
    const { cleanup, module } = loadMyFlyerModule();
    try {
      module.clearMyFlyerCache();
      const first = module.getCachedMyFlyerPayload({
        userId: 'user-1',
        algorithm: 'best_savings',
        country: 'se',
        limit: 3
      }, Date.parse('2026-05-20T12:00:00.000Z'));
      const second = module.getCachedMyFlyerPayload({
        userId: 'user-1',
        algorithm: 'best_savings',
        country: 'se',
        limit: 3
      }, Date.parse('2026-05-20T12:30:00.000Z'));
      const otherUser = module.getCachedMyFlyerPayload({
        userId: 'user-2',
        algorithm: 'best_savings',
        country: 'se',
        limit: 3
      }, Date.parse('2026-05-20T12:30:00.000Z'));

      assert.equal(first.cacheStatus, 'MISS');
      assert.equal(second.cacheStatus, 'HIT');
      assert.equal(otherUser.cacheStatus, 'MISS');
      assert.notEqual(second.payload.cache.key, otherUser.payload.cache.key);
      assert.match(second.payload.cache.key, /^my-flyer:user-1:/);
    } finally {
      cleanup();
    }
  });

  it('validates query controls in the route source', () => {
    const route = readFileSync(new URL('../src/app/api/my-flyer/route.ts', import.meta.url), 'utf8');

    assert.match(route, /z\.object/);
    assert.match(route, /user_id/);
    assert.match(route, /algorithm: z\.enum\(myFlyerAlgorithms\)\.default\('watchlist_first'\)/);
    assert.match(route, /country: z\.enum\(myFlyerCountries\)\.default\('se'\)/);
    assert.match(route, /limit: z\.coerce\.number\(\)\.int\(\)\.min\(1\)\.max\(50\)\.default\(12\)/);
    assert.match(route, /'Cache-Control': 'private, max-age=3600'/);
    assert.match(route, /'X-MyFlyer-Cache'/);
  });

  it('wires the MyFlyer page ranker into the API refresh query', () => {
    const page = readFileSync(new URL('../src/app/[city]/my-flyer/page.tsx', import.meta.url), 'utf8');
    const pushActions = readFileSync(new URL('../src/components/my-flyer-push-actions.tsx', import.meta.url), 'utf8');

    assert.match(page, /import \{ AlgorithmPicker \} from '@\/components\/algorithm-picker'/);
    assert.match(page, /<AlgorithmPicker/);
    assert.match(page, /allowedAlgorithms=\{\['watchlist_first', 'best_savings', 'best_unit_price'\]\}/);
    assert.match(pushActions, /readStoredAlgorithmChoice/);
    assert.match(pushActions, /groceryview:user-preferences-changed/);
    assert.match(pushActions, /buildMyFlyerRefreshUrl\(\{\s*algorithm,/);
  });
});
