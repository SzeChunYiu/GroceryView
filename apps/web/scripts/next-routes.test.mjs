import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const requiredFiles = [
  'src/app/page.tsx',
  'src/app/products/[slug]/page.tsx',
  'src/app/stores/[slug]/page.tsx',
  'src/app/categories/[slug]/page.tsx',
  'src/app/providers.tsx',
  'tailwind.config.ts',
  'src/components/ui/button.tsx'
];

describe('Next.js web scaffold', () => {
  it('declares App Router routes, Tailwind, shadcn-style UI, and TanStack Query', async () => {
    for (const file of requiredFiles) {
      const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
      assert.ok(source.length > 0, `${file} should not be empty`);
    }

    const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    assert.match(packageJson.dependencies.next, /^(\^)?16\./);
    assert.ok(packageJson.dependencies['@tanstack/react-query']);
    assert.ok(packageJson.dependencies['class-variance-authority']);
  });

  it('keeps the homepage backed by visible product and store driver data', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const productSlugs = demoData.match(/slug: '[^']+'/g) ?? [];
    const storeNames = demoData.match(/name: '[A-ZÅÄÖ]/g) ?? [];

    assert.ok(productSlugs.length >= 14, 'homepage driver data should expose at least 14 product/category/store slugs');
    assert.ok(storeNames.length >= 7, 'homepage driver data should expose at least 7 named Stockholm stores');
    assert.match(demoData, /matmissionen-hagersten/);
    assert.match(demoData, /eldorado-basmati-rice-1kg/);
    assert.match(demoData, /barilla-spaghetti-1kg/);
    assert.match(marketShell, /stores\.map/);
    assert.match(marketShell, /\/stores\/\$\{store\.slug\}/);
    assert.match(marketShell, /Stockholm store tape/);
  });

  it('surfaces category instruments from the homepage driver data', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const categorySection = demoData.split('export const categories = ')[1] ?? '';
    const categorySlugs = categorySection.match(/slug: '[^']+'/g) ?? [];

    assert.ok(categorySlugs.length >= 8, 'homepage driver data should expose at least 8 category instruments');
    assert.match(demoData, /slug: 'rice'/);
    assert.match(demoData, /slug: 'butter'/);
    assert.match(demoData, /ELDORADO-BASMATI-RICE-1KG/);
    assert.match(demoData, /BREGOTT-NORMALSALTAT-600G/);
    assert.match(marketShell, /categories\.map/);
    assert.match(marketShell, /\/categories\/\$\{category\.slug\}/);
    assert.match(marketShell, /Category market tape/);
  });

  it('surfaces weekly basket planning rows on the homepage', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const basketSection = demoData.split('export const weeklyBasket = ')[1] ?? '';
    const basketRows = basketSection.match(/slug: '[^']+'/g) ?? [];

    assert.ok(basketRows.length >= 12, 'homepage driver data should expose at least 12 weekly basket rows');
    assert.match(demoData, /eldorado-basmati-rice-1kg/);
    assert.match(demoData, /barilla-spaghetti-1kg/);
    assert.match(demoData, /bregott-normalsaltat-600g/);
    assert.match(demoData, /garant-havregryn-1kg/);
    assert.match(demoData, /weeklyTotal: '438\.50 SEK'/);
    assert.match(marketShell, /weeklyBasket\.map/);
    assert.match(marketShell, /householdSavings\.weeklyTotal/);
    assert.match(marketShell, /Weekly basket tape/);
  });

  it('surfaces savings playbook actions on the homepage', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const playbookSection = demoData.split('export const savingsPlaybook = ')[1] ?? '';
    const playbookRows = playbookSection.match(/title: '[^']+'/g) ?? [];

    assert.ok(playbookRows.length >= 4, 'homepage driver data should expose at least 4 savings playbook actions');
    assert.match(demoData, /Coffee stock-up window/);
    assert.match(demoData, /Butter caution flag/);
    assert.match(marketShell, /savingsPlaybook\.map/);
    assert.match(marketShell, /Savings playbook/);
  });

  it('surfaces source coverage rows on the homepage', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const sourceSection = demoData.split('export const sourceCoverage = ')[1] ?? '';
    const coverageRows = sourceSection.match(/chain: '[^']+'/g) ?? [];

    assert.ok(coverageRows.length >= 6, 'homepage driver data should expose at least 6 source coverage rows');
    assert.match(demoData, /fixture: 'Store locator'/);
    assert.match(demoData, /fixture: 'Weekly offers'/);
    assert.match(marketShell, /sourceCoverage\.map/);
    assert.match(marketShell, /Source coverage tape/);
  });

  it('surfaces generated OpenPrices and OSM fixture counts on the homepage', async () => {
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    assert.match(marketShell, /pricedProducts\.length\.toLocaleString/);
    assert.match(marketShell, /totalObservedPrices\.toLocaleString/);
    assert.match(marketShell, /osmStores\.length\.toLocaleString/);
    assert.match(marketShell, /OpenPrices fixture radar/);
  });

  it('surfaces Stockholm area coverage on the homepage', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');

    const areaSection = demoData.split('export const stockholmAreas = ')[1] ?? '';
    const areaSlugs = areaSection.match(/slug: '[^']+'/g) ?? [];

    assert.ok(areaSlugs.length >= 7, 'homepage driver data should expose at least 7 Stockholm area rows');
    assert.match(demoData, /slug: 'hagersten'/);
    assert.match(demoData, /slug: 'stockholm-county'/);
    assert.match(demoData, /topSavings: 'Rice'/);
    assert.match(demoData, /topSavings: 'Pasta'/);
    assert.match(marketShell, /stockholmAreas\.map/);
    assert.match(marketShell, /Area coverage tape/);
  });

  it('surfaces a dedicated savings dashboard route from homepage driver data', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    const savingsPage = await readFile(new URL('../src/app/savings-dashboard/page.tsx', import.meta.url), 'utf8');

    assert.match(demoData, /export const savingsDashboard = /);
    assert.match(demoData, /monthToDate/);
    assert.match(demoData, /districtSavings/);
    assert.match(marketShell, /\/savings-dashboard/);
    assert.match(marketShell, /savingsDashboard\.watchpoints\.map/);
    assert.match(savingsPage, /savingsDashboard\.districtSavings\.map/);
    assert.match(savingsPage, /Priority watchpoints/);
  });

  it('surfaces a dedicated account profile route from homepage driver data', async () => {
    const demoData = await readFile(new URL('../src/lib/demo-data.ts', import.meta.url), 'utf8');
    const marketShell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    const accountPage = await readFile(new URL('../src/app/account/page.tsx', import.meta.url), 'utf8');
    const profilePage = await readFile(new URL('../src/app/account/profile/page.tsx', import.meta.url), 'utf8');

    assert.match(demoData, /export const accountProfile = /);
    assert.match(demoData, /profileCompleteness/);
    assert.match(demoData, /routeLinks/);
    assert.match(marketShell, /\/account\/profile/);
    assert.match(marketShell, /accountProfile\.routeLinks\.map/);
    assert.match(accountPage, /accountProfile\.shopperName/);
    assert.match(profilePage, /accountProfile\.preferences\.map/);
    assert.match(profilePage, /Connected routes/);
  });
});
