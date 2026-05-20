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
});
