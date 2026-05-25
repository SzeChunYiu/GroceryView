import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const routes = [
  'index.html',
  'market/index.html',
  'products/index.html',
  'products/compare/index.html',
  'stores/index.html',
  'stores/map/index.html',
  'categories/index.html',
  'index-methodology/index.html',
  'watchlist/index.html',
  'basket/index.html',
  'scanner/index.html',
  'account/index.html',
  'privacy/index.html'
];

function indexMethodologyHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="GroceryView chain price index methodology." />
    <title>Grocery index methodology — GroceryView</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="app-shell">
      <section class="card">
        <div class="eyebrow">Public methodology</div>
        <h1>GroceryView Chain Price Index methodology</h1>
        <p class="lede">Eligible constituents, category weights, base date, rebalance rules, and confidence gates are documented without requiring live API data.</p>
      </section>
      <section class="card" aria-labelledby="index-metrics">
        <h2 id="index-metrics">Index metrics</h2>
        <dl>
          <dt>Index base date</dt>
          <dd>UTC source snapshot date</dd>
          <dt>Base value</dt>
          <dd>100.00 market median basket</dd>
          <dt>Category constituents</dt>
          <dd>Weighted by source coverage</dd>
        </dl>
      </section>
      <section class="card" aria-labelledby="constituents">
        <h2 id="constituents">Universe and constituents</h2>
        <p>Chains enter only with comparable unit-price evidence after public retailer and offer rows are canonicalized to kr/kg, kr/l, or kr/st.</p>
      </section>
      <section class="card" aria-labelledby="calculation">
        <h2 id="calculation">Index formula and base</h2>
        <p>Base date uses the current source snapshot. Base value 100.00 equals the current market-median basket across eligible categories.</p>
      </section>
      <section class="card" aria-labelledby="rebalancing">
        <h2 id="rebalancing">Reconstitution follows generated source refreshes</h2>
        <p>Rebalance trigger: when source modules are regenerated and the web build consumes the new files.</p>
        <p>Weight update: category weights recompute from eligible row counts at each refresh.</p>
      </section>
      <section class="card" aria-labelledby="confidence">
        <h2 id="confidence">Coverage and confidence</h2>
        <p>Overall chain confidence is high at 30+ rows and 4+ categories, medium at 10+ rows and 2+ categories, otherwise low.</p>
        <p>Category-cell confidence is high at 12+ observations, medium at 4+ observations, and low below 4.</p>
      </section>
    </main>
  </body>
</html>`;
}

function pageHtml(title, path) {
  if (path === 'index-methodology/index.html') return indexMethodologyHtml();

  const appPath = path === 'index.html' ? '/' : `/${path.replace(/\/index\.html$/, '')}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="GroceryView verified grocery data page." />
    <title>${title} — GroceryView</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="app-shell">
      <section class="card">
        <div class="eyebrow">Verified-data static fallback</div>
        <h1>${title}</h1>
        <p class="lede">This generated fallback intentionally contains no sample baskets, fake accounts, invented store scores, or placeholder prices.</p>
        <p class="lede">Use the Next.js app route for live rendered data from the Axfood, OpenPrices, and OpenStreetMap snapshot modules.</p>
        <p><a class="button" href="${appPath}">Open ${title}</a></p>
      </section>
    </main>
  </body>
</html>`;
}

function titleFor(path) {
  if (path === 'index.html') return 'GroceryView overview';
  return path.replace('/index.html', '').split('/').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export async function buildStaticPages(root) {
  const written = [];
  for (const route of routes) {
    const outPath = join(root, route);
    await mkdir(join(outPath, '..'), { recursive: true });
    await writeFile(outPath, pageHtml(titleFor(route), route));
    written.push(route);
  }
  return written;
}
