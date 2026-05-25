import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve, join } from 'node:path';
import { describe, it } from 'node:test';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const Module = require('node:module');
const root = new URL('..', import.meta.url).pathname;
const read = (path) => readFile(join(root, path), 'utf8');

function installTypeScriptRuntime() {
  const originalResolveFilename = Module._resolveFilename;
  const originalTsLoader = Module._extensions['.ts'];
  const ts = require('typescript');

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
      if (existsSync(candidate)) return originalResolveFilename.call(this, candidate, parent, isMain, options);
    }
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  return () => {
    Module._resolveFilename = originalResolveFilename;
    if (originalTsLoader) Module._extensions['.ts'] = originalTsLoader;
    else delete Module._extensions['.ts'];
  };
}

describe('comparison table price history sparklines', () => {
  it('builds compact sparkline paths from compare snapshot history rows', () => {
    const cleanup = installTypeScriptRuntime();
    const { buildComparePriceSnapshotSparkline } = require('../src/lib/compare-price-snapshots.js');
    cleanup();

    const path = buildComparePriceSnapshotSparkline([
      { date: '2026-05-01', price: 15, priceLabel: '15 kr' },
      { date: '2026-05-02', price: 12, priceLabel: '12 kr' },
      { date: '2026-05-03', price: 13, priceLabel: '13 kr' }
    ]);

    assert.match(path, /^M/);
    assert.match(path, /L/);
  });

  it('surfaces item and store row historical sparklines in source', async () => {
    const table = await read('src/components/ItemComparisonTable.tsx');
    const terminal = await read('src/components/price-chart-terminal.tsx');
    const snapshots = await read('src/lib/compare-price-snapshots.ts');

    assert.match(table, /data-comparison-price-history-sparkline/);
    assert.match(table, /compact historical price sparkline/);
    assert.match(table, /ComparisonSparkline/);
    assert.match(table, /Price history sparkline waits for at least two observations/);

    assert.match(terminal, /priceHistorySparklinePath/);
    assert.match(terminal, /points\.length < 2/);

    assert.match(snapshots, /ComparePriceSnapshotHistoryPoint/);
    assert.match(snapshots, /historyPointsFromPayload/);
    assert.match(snapshots, /buildComparePriceSnapshotSparkline/);
  });
});
