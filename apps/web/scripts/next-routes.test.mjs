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
});
