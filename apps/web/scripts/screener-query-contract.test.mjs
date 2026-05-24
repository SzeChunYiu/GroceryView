import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const Module = require('node:module');
const ReactDOMServer = require('react-dom/server');
const ts = require('typescript');

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptsDir, '..');
const repoRoot = resolve(webRoot, '..', '..');
const workspacePackages = [
  'api',
  'api-contracts',
  'auth',
  'catalog',
  'core',
  'db',
  'ingestion',
  'monetization',
  'notifications',
  'ops',
  'scanning',
  'server',
  'mobile'
];

function installScreenerRuntime(nextStubs) {
  const originalResolveFilename = Module._resolveFilename;
  const originalTsLoader = Module._extensions['.ts'];
  const originalTsxLoader = Module._extensions['.tsx'];

  function transpileTypeScript(module, filename) {
    const source = readFileSync(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        resolveJsonModule: true,
        target: ts.ScriptTarget.ES2022
      },
      fileName: filename
    });
    module._compile(outputText, filename);
  }

  function resolveCompiledTsSibling(request, parent, isMain, options) {
    if (!request.startsWith('.') || !request.endsWith('.js') || !parent?.filename) return null;
    const extensionless = resolve(dirname(parent.filename), request.slice(0, -3));
    for (const extension of ['.ts', '.tsx']) {
      const candidate = `${extensionless}${extension}`;
      if (existsSync(candidate)) {
        return originalResolveFilename.call(Module, candidate, parent, isMain, options);
      }
    }
    return null;
  }

  Module._extensions['.ts'] = transpileTypeScript;
  Module._extensions['.tsx'] = transpileTypeScript;
  Module._resolveFilename = function resolveScreenerImports(request, parent, isMain, options) {
    if (request === 'next/link') return nextStubs.link;
    if (request === 'next/navigation') return nextStubs.navigation;
    if (request === 'next-intl') return nextStubs.nextIntl;
    if (request.startsWith('@/')) {
      return originalResolveFilename.call(this, join(webRoot, 'src', request.slice(2)), parent, isMain, options);
    }
    if (request.startsWith('@groceryview/')) {
      const packageName = request.slice('@groceryview/'.length);
      if (workspacePackages.includes(packageName)) {
        return originalResolveFilename.call(this, join(repoRoot, 'packages', packageName, 'src/index.ts'), parent, isMain, options);
      }
    }
    const compiledTsSibling = resolveCompiledTsSibling(request, parent, isMain, options);
    if (compiledTsSibling) return compiledTsSibling;
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  return () => {
    Module._resolveFilename = originalResolveFilename;
    if (originalTsLoader) Module._extensions['.ts'] = originalTsLoader;
    else delete Module._extensions['.ts'];
    if (originalTsxLoader) Module._extensions['.tsx'] = originalTsxLoader;
    else delete Module._extensions['.tsx'];
  };
}

async function createNextStubs() {
  const stubDir = await mkdtemp(join(tmpdir(), 'groceryview-screener-next-'));
  const navigation = join(stubDir, 'navigation.cjs');
  const link = join(stubDir, 'link.cjs');
  const nextIntl = join(stubDir, 'next-intl.cjs');
  await writeFile(navigation, [
    "exports.usePathname = () => '/screener';",
    'exports.useRouter = () => ({ push() {}, replace() {}, refresh() {}, prefetch() {}, back() {}, forward() {} });',
    'exports.useSearchParams = () => new URLSearchParams();'
  ].join('\n'));
  await writeFile(link, [
    `const React = require(${JSON.stringify(require.resolve('react'))});`,
    "module.exports = function Link({ href, children, ...props }) {",
    "  return React.createElement('a', { ...props, href: typeof href === 'string' ? href : String(href) }, children);",
    '};',
    'module.exports.default = module.exports;'
  ].join('\n'));
  await writeFile(nextIntl, [
    'exports.createTranslator = ({ messages = {} } = {}) => (key) => messages[key] ?? key;'
  ].join('\n'));
  return { dir: stubDir, link, navigation, nextIntl };
}

function summaryText(html) {
  const match = html.match(/Showing [^<]+/);
  assert.ok(match, 'screener render should include the visible-row summary');
  return match[0];
}

function rankedProductNames(html) {
  const tbodyStart = html.indexOf('<tbody');
  const tbodyEnd = html.indexOf('</tbody>', tbodyStart);
  assert.notEqual(tbodyStart, -1, 'screener render should include a product table body');
  assert.notEqual(tbodyEnd, -1, 'screener render should close the product table body');
  const tbody = html.slice(tbodyStart, tbodyEnd);
  return [...tbody.matchAll(/<a\b[^>]*href="\/products\/[^"]+"[^>]*>([^<]+)<\/a>/g)].map((match) => match[1]);
}

async function renderScreenerSamples() {
  const nextStubs = await createNextStubs();
  const cleanupRuntime = installScreenerRuntime(nextStubs);
  try {
    const { default: ScreenerPage } = require('../src/app/screener/page.tsx');
    const render = async (searchParams) => {
      const element = await ScreenerPage({ searchParams: Promise.resolve(searchParams) });
      return ReactDOMServer.renderToStaticMarkup(element);
    };
    return {
      defaultHtml: await render({}),
      invalidHtml: await render({ sort: 'unknown', category: 'does-not-exist' }),
      filteredHtml: await render({ sort: 'biggest-drop', min_discount: '20' }),
      invalidDiscountHtml: await render({ sort: 'biggest-drop', min_discount: 'not-a-number' })
    };
  } finally {
    cleanupRuntime();
    await rm(nextStubs.dir, { recursive: true, force: true });
  }
}

describe('screener query contract', () => {
  it('renders invalid query values with the stable biggest-drop/all defaults', async () => {
    const { defaultHtml, invalidHtml } = await renderScreenerSamples();

    assert.equal(summaryText(invalidHtml), summaryText(defaultHtml));
    assert.match(invalidHtml, /Showing \d+ rows sorted by biggest drop\./);
    assert.deepEqual(rankedProductNames(invalidHtml), rankedProductNames(defaultHtml));
    assert.ok(rankedProductNames(invalidHtml).length > 0, 'default all-category screener should render verified product rows');
    assert.match(
      invalidHtml,
      /<a class="[^"]*bg-slate-950[^"]*" href="\/screener\?sort=biggest-drop">Biggest drop<\/a>/
    );
    assert.match(
      invalidHtml,
      /<a class="[^"]*bg-emerald-900[^"]*" href="\/screener\?sort=biggest-drop">All<\/a>/
    );
    assert.doesNotMatch(invalidHtml, /does-not-exist|sort=unknown/);
  });


  it('normalizes min_discount and filters biggest-drop rows by price-history discount', async () => {
    const { defaultHtml, filteredHtml, invalidDiscountHtml } = await renderScreenerSamples();
    const defaultNames = rankedProductNames(defaultHtml);
    const filteredNames = rankedProductNames(filteredHtml);

    assert.equal(summaryText(invalidDiscountHtml), summaryText(defaultHtml));
    assert.match(filteredHtml, /Minimum discount/);
    assert.match(filteredHtml, /name="min_discount"/);
    assert.match(filteredHtml, /type="range"/);
    assert.match(filteredHtml, /min="0"/);
    assert.match(filteredHtml, /max="50"/);
    assert.match(filteredHtml, /value="20"/);
    assert.match(filteredHtml, /20% or more/);
    assert.match(filteredHtml, /with at least 20% discount/);
    assert.match(filteredHtml, /30-day price drop from price_history|OpenPrices history/);
    assert.ok(filteredNames.length > 0, '20% discount filter should keep verified drop rows');
    assert.ok(filteredNames.length < defaultNames.length, '20% discount filter should remove weaker price-history drops');
    assert.match(filteredHtml, /href="\/screener\?sort=cheapest-per-kg&amp;min_discount=20"/);
    assert.match(filteredHtml, /href="\/screener\?sort=biggest-drop&amp;min_discount=20"/);
  });
});
