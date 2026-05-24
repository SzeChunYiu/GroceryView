import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('Breadcrumbs accessibility', () => {
  it('ships breadcrumb ARIA semantics and keyboard roving focus without changing link destinations', async () => {
    const component = await read('src/components/breadcrumbs.tsx');
    const productPage = await read('src/app/products/[slug]/page.tsx');

    assert.match(component, /'use client'/);
    assert.match(component, /<nav aria-label=\{ariaLabel\}/);
    assert.match(component, /<ol className=/);
    assert.ok(component.includes("aria-current={isCurrent ? 'page' : undefined}"));
    assert.match(component, /data-breadcrumb-focusable="true"/);
    assert.match(component, /ArrowRight/);
    assert.match(component, /ArrowLeft/);
    assert.match(component, /event\.preventDefault\(\)/);
    assert.match(component, /Home/);
    assert.match(component, /End/);
    assert.match(productPage, /<Breadcrumbs/);
    assert.match(productPage, /label: 'Home', href: '\/'/);
    assert.match(productPage, /label: 'Products', href: '\/products'/);
  });
});
