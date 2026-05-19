import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const layout = ({ title, description, body }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${description}" />
    <title>${title}</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="shell">
      <a class="pill" href="/">← GroceryView</a>
      ${body}
    </main>
  </body>
</html>`;

const pages = [
  {
    path: 'market/index.html',
    title: 'Stockholm Grocery Market — GroceryView',
    description: 'Stockholm grocery market overview with indices, top movers, and true deals.',
    body: `<section class="card"><div class="eyebrow">Market</div><h1>Stockholm Grocery Market</h1><p class="lede">Top movers, best true deals, and grocery indices for Stockholm.</p><div class="grid"><div class="metric"><strong>101.6</strong><span>Stockholm Grocery Index</span></div><div class="metric"><strong>91.6</strong><span>Coffee Index</span></div><div class="metric"><strong>108.4</strong><span>Dairy Index</span></div></div></section>`
  },
  {
    path: 'products/coffee/index.html',
    title: 'ZOEGAS-COFFEE-450G price history — GroceryView',
    description: 'Zoégas Coffee 450g price ticker with current prices, price history, and Deal Score.',
    body: `<section class="card"><div class="eyebrow">Product ticker</div><h1>ZOEGAS-COFFEE-450G</h1><p class="lede">Current best price: 49.90 SEK at Willys Odenplan.</p><div class="grid"><div class="metric"><strong>82</strong><span>Deal Score</span></div><div class="metric"><strong>8th</strong><span>Stockholm percentile</span></div><div class="metric"><strong>6th</strong><span>Historical percentile</span></div></div></section>`
  },
  {
    path: 'stores/willys-odenplan/index.html',
    title: 'Willys Odenplan store deals — GroceryView',
    description: 'Willys Odenplan profile with deal score, price level, and best categories.',
    body: `<section class="card"><div class="eyebrow">Store</div><h1>Willys Odenplan</h1><p class="lede">Favorite-store profile for Odenplan grocery deals.</p><div class="grid"><div class="metric"><strong>82</strong><span>Deal Score Today</span></div><div class="metric"><strong>-12%</strong><span>vs Stockholm average</span></div><div class="metric"><strong>Coffee</strong><span>Best category</span></div></div></section>`
  },
  {
    path: 'categories/coffee/index.html',
    title: 'Coffee deals in Stockholm — GroceryView',
    description: 'Coffee category page with price index, top deals, and percentile signals.',
    body: `<section class="card"><div class="eyebrow">Category</div><h1>Stockholm Coffee Deals</h1><p class="lede">Coffee Index is at 91.6 with strong current promotions.</p><div class="grid"><div class="metric"><strong>-8.4%</strong><span>1M move</span></div><div class="metric"><strong>12th</strong><span>Historical percentile</span></div><div class="metric"><strong>Zoégas</strong><span>Top deal</span></div></div></section>`
  }
];

export async function buildStaticPages(root) {
  const written = [];
  for (const page of pages) {
    const destination = join(root, page.path);
    await mkdir(join(destination, '..'), { recursive: true });
    await writeFile(destination, layout(page));
    written.push(page.path);
  }
  return written;
}
