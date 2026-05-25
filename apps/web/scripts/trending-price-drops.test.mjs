import assert from 'node:assert/strict';
import { access, readFile, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(root);
const moduleCache = new Map();

const read = (relative) => new Promise((resolve, reject) => {
  readFile(new URL(relative, root), 'utf8', (error, data) => (error ? reject(error) : resolve(data)));
});

async function exists(relative) {
  try {
    await new Promise((resolve, reject) => access(new URL(relative, root), (error) => (error ? reject(error) : resolve())));
    return true;
  } catch {
    return false;
  }
}

function resolveLocalModule(fromRelative, specifier) {
  const base = specifier.startsWith('@/')
    ? join(rootPath, 'src', specifier.slice(2))
    : join(rootPath, dirname(fromRelative), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ];
  for (const candidate of candidates) {
    try {
      readFileSync(candidate, 'utf8');
      return normalize(candidate);
    } catch {
      // try the next extension
    }
  }
  throw new Error(`Unable to resolve ${specifier} from ${fromRelative}`);
}

function loadTsModule(relative, mocks = {}) {
  const absolute = normalize(join(rootPath, relative));
  const shouldCache = Object.keys(mocks).length === 0;
  if (shouldCache && moduleCache.has(absolute)) return moduleCache.get(absolute).exports;

  const source = readFileSync(absolute, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    },
    fileName: relative
  });

  const module = { exports: {} };
  if (shouldCache) moduleCache.set(absolute, module);
  const localRequire = (specifier) => {
    if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
    if (specifier === 'next/server') {
      return { NextResponse: { json: (body) => ({ body, json: async () => body }) } };
    }
    if (specifier === 'next/link') {
      return { __esModule: true, default: (props) => require('react/jsx-runtime').jsx('a', props) };
    }
    if (specifier === 'lucide-react') {
      const Icon = (props) => require('react/jsx-runtime').jsx('svg', props);
      return new Proxy({}, { get: () => Icon });
    }
    if (specifier.startsWith('@/') || specifier.startsWith('.')) {
      const fromRoot = normalize(absolute.slice(rootPath.length).replace(/^[/\\]/, ''));
      const resolved = resolveLocalModule(fromRoot, specifier);
      return loadTsModule(normalize(resolved.slice(rootPath.length + 1)), mocks);
    }
    return require(specifier);
  };

  vm.runInNewContext(transpiled.outputText, {
    exports: module.exports,
    module,
    require: localRequire,
    console,
    URL,
    URLSearchParams
  }, { filename: pathToFileURL(absolute).href });

  return module.exports;
}

function daysAgo(days) {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

function fixtureProducts() {
  return [{
    code: 'fixture-001',
    slug: 'fixture-oat-milk',
    name: 'Fixture Oat Milk',
    brands: 'Test Brand',
    image: '',
    quantity: '1 l',
    nutriscore: 'b',
    category: 'beverages',
    categories: ['en:beverages'],
    priceMin: 9,
    priceMedian: 12,
    priceMax: 15,
    observationCount: 40,
    lastObservedAt: daysAgo(2),
    observations: [
      { price: 15, date: daysAgo(9) },
      { price: 9, date: daysAgo(2) }
    ]
  }];
}

function childNodes(children) {
  if (children === undefined || children === null || typeof children === 'boolean') return [];
  return Array.isArray(children) ? children : [children];
}

function walk(element, visit) {
  if (element === undefined || element === null || typeof element !== 'object') return;
  visit(element);
  for (const child of childNodes(element.props?.children)) walk(child, visit);
}

function flatten(element) {
  const elements = [];
  walk(element, (node) => elements.push(node));
  return elements;
}

function textContent(element) {
  if (element === undefined || element === null || typeof element === 'boolean') return '';
  if (typeof element === 'string' || typeof element === 'number') return String(element);
  if (Array.isArray(element)) return element.map(textContent).join('');
  return childNodes(element.props?.children).map(textContent).join('');
}

test('city dashboard ships a trending price-drop engine, API feed, and concise cards', async () => {
  assert.equal(await exists('src/lib/trends.ts'), true);
  assert.equal(await exists('src/app/api/feed/trending/route.ts'), true);
  assert.equal(await exists('src/app/page-sections/trending.tsx'), true);

  const trends = await read('src/lib/trends.ts');
  const route = await read('src/app/api/feed/trending/route.ts');
  const section = await read('src/app/page-sections/trending.tsx');
  const carousel = await read('src/components/TrendingCarousel.tsx');
  const shell = await read('src/components/market-shell.tsx');

  assert.match(trends, /export function buildCityPriceDropTrends/);
  assert.match(trends, /cityAliases/);
  assert.match(trends, /latestDropPair/);
  assert.match(trends, /latest\.price >= previous\.price/);
  assert.match(trends, /deltaAmount/);
  assert.match(trends, /deltaPercent/);
  assert.match(trends, /confidenceScore/);
  assert.match(trends, /confidenceLabel/);
  assert.match(trends, /urgencyLabel/);
  assert.match(trends, /OpenPrices dated SEK observations/);

  assert.match(route, /export function GET\(request: Request\)/);
  assert.match(route, /searchParams\.get\('city'\)/);
  assert.match(route, /searchParams\.get\('limit'\)/);
  assert.match(route, /buildCityPriceDropTrends\(\{ city, limit \}\)/);
  assert.doesNotMatch(route, /console\./);

  assert.match(section, /export function TrendingPriceDropCards/);
  assert.match(section, /export function trendingPriceDropCardText/);
  assert.match(section, /data-trending-price-drop-card/);
  assert.match(section, /Top drops in \{feed\.city\}/);
  assert.match(section, /cardText\.deltaAmount/);
  assert.match(section, /cardText\.deltaPercent/);
  assert.match(section, /cardText\.confidence/);
  assert.match(section, /cardText\.urgency/);

  assert.match(trends, /export function buildCitySearchTrends/);
  assert.match(trends, /CitySearchTrendFeed/);
  assert.match(trends, /citySearchTrendHref/);
  assert.match(trends, /verified product observation momentum grouped into local query topics/);
  assert.match(section, /export function TrendingSearchModule/);
  assert.match(section, /data-trending-search-module/);
  assert.match(section, /data-trending-search-grid/);
  assert.match(section, /trend\.resultHref/);
  assert.match(carousel, /buildCitySearchTrends\(\{ city: 'stockholm', limit: 6 \}\)/);
  assert.match(carousel, /<TrendingSearchModule feed=\{searchFeed\} \/>/);

  assert.match(shell, /import \{ TrendingPriceDropCards \} from '@\/app\/page-sections\/trending'/);
  assert.match(shell, /<TrendingPriceDropCards city="stockholm" \/>/);
});

test('trending cards render fixture delta, confidence, and urgency text', () => {
  const { buildCityPriceDropTrends } = loadTsModule('src/lib/trends.ts');
  const { TrendingPriceDropCards, trendingPriceDropCardText } = loadTsModule('src/app/page-sections/trending.tsx');
  const feed = buildCityPriceDropTrends({ city: 'malmo', limit: 1, products: fixtureProducts(), generatedAt: '2026-05-25T00:00:00.000Z' });
  const [card] = feed.cards;
  const cardText = trendingPriceDropCardText(card);

  assert.equal(card.productName, 'Fixture Oat Milk');
  assert.equal(card.deltaAmount, -6);
  assert.equal(card.deltaPercent, -40);
  assert.equal(card.confidenceLabel, 'high');
  assert.equal(card.urgencyLabel, 'Act soon');

  const tree = TrendingPriceDropCards({ feed });
  const cards = flatten(tree).filter((element) => element.props?.['data-trending-price-drop-card']);
  assert.equal(cards.length, 1);
  const renderedText = textContent(cards[0]);

  assert.match(renderedText, /Fixture Oat Milk/);
  assert.match(renderedText, /Test Brand/);
  assert.ok(renderedText.includes(cardText.deltaAmount));
  assert.ok(renderedText.includes(cardText.deltaPercent));
  assert.ok(renderedText.includes(cardText.confidence));
  assert.ok(renderedText.includes(cardText.urgency));
});

test('trending feed handler payload returns fixture JSON shape with card evidence', async () => {
  const { buildCityPriceDropTrends } = loadTsModule('src/lib/trends.ts');
  const products = fixtureProducts();
  const { GET } = loadTsModule('src/app/api/feed/trending/route.ts', {
    '@/lib/trends': {
      buildCityPriceDropTrends: (options) => buildCityPriceDropTrends({ ...options, products })
    }
  });
  const response = GET(new Request('https://groceryview.test/api/feed/trending?city=malmo&limit=1&favoriteBrands=Test%20Brand'));
  const payload = await response.json();

  assert.equal(payload.city, 'Malmo');
  assert.deepEqual(payload.filters, { category: '', chain: '' });
  assert.deepEqual(payload.personalization.signals, ['favoriteBrands', 'dietary', 'nearbyChains', 'clicked', 'household category history']);
  assert.equal(payload.cards.length, 1);
  assert.deepEqual(Object.keys(payload.cards[0]).filter((key) => [
    'productName',
    'deltaAmount',
    'deltaPercent',
    'confidenceScore',
    'confidenceLabel',
    'urgencyLabel',
    'sourceLabel',
    'personalizationScore',
    'personalizationReason'
  ].includes(key)).sort(), [
    'confidenceLabel',
    'confidenceScore',
    'deltaAmount',
    'deltaPercent',
    'personalizationReason',
    'personalizationScore',
    'productName',
    'sourceLabel',
    'urgencyLabel'
  ]);
  assert.equal(payload.cards[0].productName, 'Fixture Oat Milk');
  assert.equal(payload.cards[0].deltaAmount, -6);
  assert.equal(payload.cards[0].confidenceLabel, 'high');
  assert.equal(payload.cards[0].urgencyLabel, 'Act soon');
});
