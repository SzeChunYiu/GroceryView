import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadPriceEventsModule() {
  const source = await readFile(new URL('../src/lib/price-events.ts', import.meta.url), 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022
    }
  });
  return import(`data:text/javascript,${encodeURIComponent(transpiled.outputText)}`);
}

describe('price drop shelf occupancy context', () => {
  it('keeps the price-events adapter wired into the product chart terminal', async () => {
    const helper = await readFile(new URL('../src/lib/price-events.ts', import.meta.url), 'utf8');
    assert.match(helper, /temporary_clearance/);
    assert.match(helper, /stable_campaign/);
    assert.match(helper, /shelfOccupancyContextForDrop/);

    const productPage = await readFile(new URL('../src/app/products/[slug]/page.tsx', import.meta.url), 'utf8');
    assert.match(productPage, /shelfOccupancyContextForDrop\(result\.series\)/);

    const terminal = await readFile(new URL('../src/components/price-chart-terminal.tsx', import.meta.url), 'utf8');
    assert.match(terminal, /Drop context:/);
    assert.match(terminal, /shelfOccupancyContext\.purchaseTiming/);
  });

  it('classifies one-off lows differently from stable campaign prices', async () => {
    const { shelfOccupancyContextForDrop } = await loadPriceEventsModule();
    const clearance = shelfOccupancyContextForDrop([
      {
        sourceType: 'shelf',
        points: [
          { time: '2026-05-01T00:00:00.000Z', value: 50 },
          { time: '2026-05-10T00:00:00.000Z', value: 40 }
        ],
        markers: []
      }
    ]);
    assert.equal(clearance.status, 'temporary_clearance');

    const campaign = shelfOccupancyContextForDrop([
      {
        sourceType: 'online',
        points: [
          { time: '2026-05-01T00:00:00.000Z', value: 50 },
          { time: '2026-05-05T00:00:00.000Z', value: 40 },
          { time: '2026-05-10T00:00:00.000Z', value: 40.5 }
        ],
        markers: []
      }
    ]);
    assert.equal(campaign.status, 'stable_campaign');
  });
});
