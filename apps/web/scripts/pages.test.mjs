import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildStaticPages } from './pages.mjs';

describe('legacy static page generator', () => {
  it('is not used as the source of truth for the redesigned Next interface', async () => {
    const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    assert.match(packageJson.scripts.build, /next build/);
    assert.match(packageJson.scripts.build, /--webpack/);
    const app = await readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
    assert.match(app, /MvpHomePage/);
  });

  it('renders focused index methodology fallback content without API data', async () => {
    const root = await mkdtemp(join(tmpdir(), 'groceryview-pages-'));

    try {
      const written = await buildStaticPages(root);
      const html = await readFile(join(root, 'index-methodology/index.html'), 'utf8');

      assert.equal(written.includes('index-methodology/index.html'), true);
      assert.match(html, /GroceryView Chain Price Index methodology/);
      assert.match(html, /Universe and constituents/);
      assert.match(html, /Category constituents/);
      assert.match(html, /Index base date/);
      assert.match(html, /Base value/);
      assert.match(html, /100\.00 market median basket/);
      assert.match(html, /Rebalance trigger: when source modules are regenerated/);
      assert.match(html, /Weight update: category weights recompute from eligible row counts/);
      assert.match(html, /Overall chain confidence is high at 30\+ rows and 4\+ categories/);
      assert.match(html, /Category-cell confidence is high at 12\+ observations/);
      assert.doesNotMatch(html, /fetch\(/);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
