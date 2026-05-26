import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const printCssUrl = new URL('../../apps/web/src/app/[country]/my-flyer/print.css', import.meta.url);
const printImportUrl = new URL('../../apps/web/src/app/[country]/my-flyer/print-import.css', import.meta.url);
const pageUrl = new URL('../../apps/web/src/app/[country]/my-flyer/page.tsx', import.meta.url);

describe('MyFlyer print stylesheet', () => {
  it('imports the country print stylesheet only for print media', async () => {
    const printImport = await readFile(printImportUrl, 'utf8');
    assert.match(printImport, /@import\s+url\("\.\.\/\.\.\/\[country\]\/my-flyer\/print\.css"\)\s+print;/);

    const page = await readFile(pageUrl, 'utf8');
    assert.match(page, /import '\.\/print-import\.css';/);
  });

  it('defines the compact two-column printable offer layout', async () => {
    const css = await readFile(printCssUrl, 'utf8');
    assert.match(css, /@media\s+print/);
    assert.match(css, /\.my-flyer-print-grid[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    assert.match(css, /\.my-flyer-product-card[\s\S]*grid-template-columns:\s*34mm\s+1fr/);
  });

  it('hides navigation and ads while enlarging product images for print', async () => {
    const css = await readFile(printCssUrl, 'utf8');
    assert.match(css, /nav,[\s\S]*\[data-print-hide\],[\s\S]*\[data-ad\],[\s\S]*\.my-flyer-ad[\s\S]*display:\s*none\s*!important/);
    assert.match(css, /\.my-flyer-product-image[\s\S]*height:\s*36mm\s*!important/);
    assert.match(css, /\.my-flyer-product-image[\s\S]*object-fit:\s*contain\s*!important/);
  });
});
