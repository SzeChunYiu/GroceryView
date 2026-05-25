import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { buildShoppingListPdfDocument, printPriceSummary } from '../src/lib/exportListPdf.ts';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('shopping list PDF export', () => {
  it('builds a stable print-to-PDF document model with item quantities and store prices', () => {
    const document = buildShoppingListPdfDocument({
      generatedAt: '2026-05-25T00:00:00.000Z',
      listName: 'Weekly staples',
      items: [{
        id: 'oat-milk',
        name: 'Oat milk',
        quantity: '2 cartons',
        perStorePrices: [
          { storeName: 'ICA nearby store', priceLabel: '22.50 kr' },
          { storeName: 'Willys nearby store', priceLabel: '20.90 kr' }
        ]
      }]
    });

    assert.equal(document.fileName, 'weekly-staples-2026-05-25.pdf');
    assert.equal(document.subtitle, '1 item with quantities and per-store price evidence.');
    assert.equal(printPriceSummary(document.items[0]), 'ICA nearby store: 22.50 kr | Willys nearby store: 20.90 kr');
  });

  it('wires the formatted PDF export into the list page and print button components', async () => {
    const page = await read('src/app/list/page.tsx');
    const webPrintButton = await read('src/components/PrintButton.tsx');
    const uiPrintButton = await read('../../packages/ui/src/PrintButton.tsx');

    assert.match(page, /buildShoppingListPdfDocument/);
    assert.match(page, /data-shopping-list-pdf-export/);
    assert.match(page, /<PrintButton fileName=\{pdfDocument\.fileName\} label="Save as PDF" \/>/);
    assert.match(page, /printPriceSummary\(item\)/);
    assert.match(page, /Per-store prices/);
    assert.match(webPrintButton, /window\.print\(\)/);
    assert.match(webPrintButton, /document\.title = fileName\.replace/);
    assert.match(uiPrintButton, /export function PrintButton/);
    assert.match(uiPrintButton, /window\.print\(\)/);
  });
});
