import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('product detail extracted components', () => {
  it('renders ProductHeader with mock props', async () => {
    const source = await read('src/app/products/[slug]/product-header.tsx');
    const mockProps = {
      kindLabel: 'OpenPrices product',
      name: 'Mock coffee',
      subtitle: 'Mock brand · 450 g',
      primaryEvidence: { mode: 'openprices', medianPriceLabel: '49.90 kr' },
      sourceFields: { code: 'mock-code', categoryLabel: 'Coffee', sourceLabel: 'OpenPrices' },
      freshnessBadge: { sourceName: 'OpenPrices', caveat: 'Mock caveat' }
    };

    assert.match(source, /export function ProductHeader/);
    assert.match(source, /<Eyebrow>\{kindLabel\}<\/Eyebrow>/);
    assert.match(source, /\{name\}/);
    assert.match(source, /\{subtitle\}/);
    assert.match(source, /primaryEvidence\.mode === 'chain'/);
    assert.match(source, /freshnessBadge\.sourceName/);
    assert.equal(mockProps.primaryEvidence.mode, 'openprices');
  });

  it('renders ProductPriceTable with mock props', async () => {
    const source = await read('src/app/products/[slug]/product-price-table.tsx');
    const mockProps = {
      rows: [{ chain: 'willys', priceLabel: '49.90 kr', priceUnit: '110.89 kr/kg', savingsLabel: '10.00 kr' }]
    };

    assert.match(source, /export function ProductPriceTable/);
    assert.match(source, /rows\.map/);
    assert.match(source, /\{row\.chain\}/);
    assert.match(source, /\{row\.priceLabel\}/);
    assert.match(source, /listed saving/);
    assert.equal(mockProps.rows[0].chain, 'willys');
  });

  it('renders ProductHistoryChart with mock props', async () => {
    const source = await read('src/app/products/[slug]/product-history-chart.tsx');
    const mockProps = {
      chart: { title: 'Mock chart' },
      crossChainHistoryOverlay: {
        available: false,
        title: 'coverage withheld',
        chainHistoryCoverageRows: [{ chainLabel: 'OpenPrices', lineStyle: 'dotted' }]
      }
    };

    assert.match(source, /export function ProductHistoryChart/);
    assert.match(source, /<PriceChartTerminal chart=\{chart\} \/>/);
    assert.match(source, /crossChainHistoryOverlay\.available/);
    assert.match(source, /crossChainHistoryOverlay\.crossChainOverlaySeries\.map/);
    assert.match(source, /crossChainHistoryOverlay\.chainHistoryCoverageRows\.map/);
    assert.equal(mockProps.crossChainHistoryOverlay.chainHistoryCoverageRows[0].lineStyle, 'dotted');
  });
});
