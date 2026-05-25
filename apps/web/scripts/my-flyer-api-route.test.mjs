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
});
