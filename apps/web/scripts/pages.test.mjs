import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = {
  packageJson: new URL('../package.json', import.meta.url),
  productsPage: new URL('src/app/products/[slug]/page.tsx', import.meta.url),
  categoriesPage: new URL('src/app/categories/[slug]/page.tsx', import.meta.url),
  breadcrumb: new URL('src/components/Breadcrumb.tsx', import.meta.url),
  appPage: new URL('../src/app/page.tsx', import.meta.url)
};

describe('legacy static page generator', () => {
  it('is not used as the source of truth for the redesigned Next interface', async () => {
    const packageJson = JSON.parse(await readFile(files.packageJson, 'utf8'));
    assert.match(packageJson.scripts.build, /next build/);
    assert.match(packageJson.scripts.build, /--webpack/);
    const app = await readFile(files.appPage, 'utf8');
    assert.match(app, /MarketShell/);
  });
});

describe('page breadcrumb contracts', () => {
  it('renders category pages with hierarchy-aware breadcrumbs and current-page semantics', async () => {
    const categoriesPage = await readFile(files.categoriesPage, 'utf8');
    const breadcrumb = await readFile(files.breadcrumb, 'utf8');

    assert.match(categoriesPage, /import \{ CategoryBreadcrumb \} from ['"]@\/components\/Breadcrumb['"]/);
    assert.match(categoriesPage, /<CategoryBreadcrumb[^>]+categoryLabel=\{categoryLabel\}\s+slug=\{slug\}\s*\/>/);
    assert.match(breadcrumb, /aria-label="Breadcrumb"/);
    assert.match(breadcrumb, /aria-current=\{current \? 'page' : undefined\}/);
    assert.match(breadcrumb, /href: node\.routable && node\.slug !== slug \? `\/categories\/\$\{node\.slug\}` : undefined/);
  });

  it('renders product pages with hierarchy-aware breadcrumb items and proper current-page behavior', async () => {
    const productsPage = await readFile(files.productsPage, 'utf8');

    assert.match(productsPage, /import \{ Breadcrumb \} from ['"]@\/components\/Breadcrumb['"]/);
    assert.match(productsPage, /import \{ categoryPathForSlug \} from ['"]@groceryview\/db['"]/);
    assert.match(productsPage, /function productBreadcrumbItemsFor\(product\:/);
    assert.match(productsPage, /label: 'Home',\s*href: '\/'/);
    assert.match(productsPage, /label: 'Products',\s*href: '\/products'/);
    assert.match(productsPage, /categoryPathForSlug\(product\.category\)/);
    assert.match(productsPage, /label: product\.name/);
    assert.match(productsPage, /<Breadcrumb items=\{productBreadcrumbItemsFor\(product\)\}/);
  });
});
