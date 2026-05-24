import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const ReactDOMServer = require("react-dom/server");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const moduleCache = new Map();

function resolveLocalModule(specifier, fromFile) {
  const base = specifier.startsWith(".")
    ? path.resolve(path.dirname(fromFile), specifier)
    : path.resolve(appRoot, specifier);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")];
  const file = candidates.find((candidate) => fs.existsSync(candidate));
  if (!file) {
    throw new Error(`Unable to resolve ${specifier} from ${fromFile}`);
  }
  return file;
}

function loadTsModule(file) {
  if (moduleCache.has(file)) {
    return moduleCache.get(file).exports;
  }

  const source = fs.readFileSync(file, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: file,
  }).outputText;

  const module = { exports: {} };
  moduleCache.set(file, module);

  const localRequire = (specifier) => {
    if (specifier.startsWith(".")) {
      return loadTsModule(resolveLocalModule(specifier, file));
    }
    return require(specifier);
  };

  vm.runInNewContext(output, {
    console,
    exports: module.exports,
    module,
    require: localRequire,
    Response,
  }, { filename: file });

  return module.exports;
}

const trending = loadTsModule(path.resolve(appRoot, "src/app/page-sections/trending.tsx"));
const route = loadTsModule(path.resolve(appRoot, "src/app/api/feed/trending/route.ts"));

const fixture = [
  {
    id: "fixture-bananas",
    name: "Bananas",
    store: "Willys",
    currentPrice: 12.9,
    previousPrice: 15.9,
    deltaPercent: -19,
    confidence: 0.94,
    urgency: "low-stock",
    urgencyLabel: "Low stock nearby",
  },
];

const html = ReactDOMServer.renderToStaticMarkup(trending.TrendingPriceDrops({ items: fixture }));
assert.match(html, /Bananas/);
assert.match(html, /-19% price drop/);
assert.match(html, /94% confidence/);
assert.match(html, /Low stock nearby/);

const [item] = route.buildTrendingFeedPayload(fixture).items;
assert.deepEqual(item, {
  id: "fixture-bananas",
  name: "Bananas",
  store: "Willys",
  currentPrice: 12.9,
  previousPrice: 15.9,
  deltaPercent: -19,
  confidence: 0.94,
  urgency: "low-stock",
  urgencyLabel: "Low stock nearby",
});

const response = await route.GET();
const json = await response.json();
assert.equal(Array.isArray(json.items), true);
assert.equal(typeof json.items[0].deltaPercent, "number");
assert.equal(typeof json.items[0].confidence, "number");
assert.equal(typeof json.items[0].urgency, "string");
