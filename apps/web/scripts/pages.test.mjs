import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

describe('legacy static page generator', () => {
  it('is not used as the source of truth for the redesigned Next interface', async () => {
    const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    assert.match(packageJson.scripts.build, /next build/);
    assert.match(packageJson.scripts.build, /--webpack/);
    const app = await readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
    assert.match(app, /MarketShell/);
  });

  it('renders breadcrumb hierarchy and current-page semantics for category and item pages', async () => {
    const [breadcrumb, categoryPage, itemPage, productPage] = await Promise.all([
      readFile(new URL('../src/components/Breadcrumb.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/app/categories/[slug]/page.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/app/items/[id]/page.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/app/products/[slug]/page.tsx', import.meta.url), 'utf8')
    ]);

    assert.match(breadcrumb, /<nav aria-label="Breadcrumb"/);
    assert.match(breadcrumb, /<ol className="flex flex-wrap items-center gap-2" role="list">/);
    assert.match(breadcrumb, /aria-current=\{current \? 'page' : undefined\}/);
    assert.match(breadcrumb, /label: 'Home', href: '\/'/);
    assert.match(breadcrumb, /label: 'Categories', href: '\/categories'/);
    assert.match(breadcrumb, /href: node\.routable && node\.slug !== slug \? `\/categories\/\$\{node\.slug\}` : undefined/);
    assert.match(breadcrumb, /export function ProductBreadcrumb/);
    assert.match(breadcrumb, /label: 'Products', href: '\/products'/);
    assert.match(breadcrumb, /label: categoryLabel, href: `\/categories\/\$\{categorySlug\}`/);
    assert.match(breadcrumb, /\{ label: productName \}/);
    assert.match(categoryPage, /<CategoryBreadcrumb categoryLabel=\{categoryLabel\} slug=\{slug\} \/>/);
    assert.match(productPage, /<ProductBreadcrumb categoryLabel=\{labelFromSlug\(product\.category\)\} categorySlug=\{product\.category\} productName=\{product\.name\} \/>/);
    assert.match(itemPage, /ProductPage\(\{ params: Promise\.resolve\(\{ slug: id \}\) \}\)/);
  });
});
