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
  'watchlist/index.html',
  'basket/index.html',
  'scanner/index.html',
  'account/index.html',
  'privacy/index.html'
];

function pageHtml(title, path) {
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
