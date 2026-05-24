import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Module from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const ts = require('typescript');

const testDir = dirname(fileURLToPath(import.meta.url));
const componentPath = resolve(testDir, '../deal-card.tsx');

function loadDealCardModule() {
  const source = readFileSync(componentPath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    },
    fileName: componentPath
  });
  const module = new Module(componentPath, null);
  module.filename = componentPath;
  module.paths = Module._nodeModulePaths(dirname(componentPath));
  module._compile(outputText, componentPath);
  return module.exports;
}

test('DealCard snapshots rounded percentage discount text', () => {
  const { DealCard } = loadDealCardModule();
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(DealCard, {
      title: 'Bananas',
      storeName: 'ICA',
      priceText: '19,90 kr',
      href: '/products/bananas',
      discountPercent: 12.6
    })
  );

  assert.equal(
    html,
    '<a class="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href="/products/bananas"><p class="text-sm font-semibold text-slate-600">ICA</p><h3 class="mt-1 text-xl font-black text-slate-950">Bananas</h3><p class="mt-3 text-2xl font-black text-emerald-800">19,90 kr</p><p class="mt-1 text-sm font-semibold text-slate-600">13% off</p></a>'
  );
});
