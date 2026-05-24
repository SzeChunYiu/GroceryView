import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const Module = require('node:module');
const ts = require('typescript');

async function loadDealCard() {
  const stubDir = await mkdtemp(join(tmpdir(), 'groceryview-deal-card-'));
  const linkStub = join(stubDir, 'link.cjs');
  await writeFile(linkStub, 'module.exports = function Link({ children }) { return children; }; module.exports.default = module.exports;');

  const originalResolveFilename = Module._resolveFilename;
  const originalTsxLoader = Module._extensions['.tsx'];

  Module._extensions['.tsx'] = function transpileTsx(module, filename) {
    const source = readFileSync(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022
      },
      fileName: filename
    });
    module._compile(outputText, filename);
  };

  Module._resolveFilename = function resolveDealCardImports(request, parent, isMain, options) {
    if (request === 'next/link') return linkStub;
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  try {
    return require('../src/components/deal-card.tsx');
  } finally {
    Module._resolveFilename = originalResolveFilename;
    if (originalTsxLoader) Module._extensions['.tsx'] = originalTsxLoader;
    else delete Module._extensions['.tsx'];
    await rm(stubDir, { recursive: true, force: true });
  }
}

describe('deal-card discount formatting', () => {
  it('rounds percentage discounts to 0 decimals with Intl.NumberFormat', async () => {
    const { formatDealDiscountPercent } = await loadDealCard();

    assert.equal(formatDealDiscountPercent(19.6, 'sv-SE'), '20');
    assert.equal(formatDealDiscountPercent(19.4, 'sv-SE'), '19');
  });
});
