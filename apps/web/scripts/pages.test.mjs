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
    assert.match(app, /searchParams/);
    assert.match(app, /params\.brand/);
    const shell = await readFile(new URL('../src/components/market-shell.tsx', import.meta.url), 'utf8');
    assert.match(shell, /name="brand"/);
    assert.match(shell, /productBrandFilterOptions/);
    assert.match(shell, /selectedBrand/);
  });
});
