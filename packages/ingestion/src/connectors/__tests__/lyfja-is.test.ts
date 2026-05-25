import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchLyfjaIsProducts, LYFJA_IS_STORE_URL, parseLyfjaIsProducts } from '../lyfja-is.js';

const RETRIEVED_AT = '2026-05-25T15:50:00.000Z';
const FIXTURE = `<!doctype html><main>
  <article class="product card" data-sku="lyfja-1">
    <a href="/verslun/ofnaemi/dymista-nefudi-25ml-101001/"><img src="/media/dymista.jpg" /></a>
    <h2>Dymista nefúði 187,00 mcg/sk - 25 ml</h2>
    <span class="price">6.199 kr.</span>
    <span>Lyf</span>
  </article>
  <article class="product card" data-sku="lyfja-2">
    <a href="/verslun/hudvorur/vichy-mineral-89-50ml-100002/"><h3>Vichy Mineral 89 Moisturising Cream Rich 50 ml</h3></a>
    <span class="price">6.599 kr.</span><span class="price">5.279 kr.</span><span>20%</span>
  </article>
</main>`;

describe('Lyfja IS connector', () => {
  it('parses official Lyfja product cards with ISK prices and discounts', () => {
    const rows = parseLyfjaIsProducts(FIXTURE, LYFJA_IS_STORE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'IS',
      currency: 'ISK',
      chain: 'lyfja',
      retailerType: 'pharmacy',
      code: 'lyfja-1',
      name: 'Dymista nefúði 187,00 mcg/sk - 25 ml',
      category: 'otc',
      categorySlug: 'store',
      price: 6199,
      priceText: '6.199 kr.',
      originalPrice: null,
      originalPriceText: '',
      discountPercent: 0,
      productUrl: 'https://www.lyfja.is/verslun/ofnaemi/dymista-nefudi-25ml-101001/',
      imageUrl: 'https://www.lyfja.is/media/dymista.jpg',
      sourceUrl: LYFJA_IS_STORE_URL,
      retrievedAt: RETRIEVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows[1]?.category, 'beauty');
    assert.equal(rows[1]?.price, 5279);
    assert.equal(rows[1]?.originalPrice, 6599);
    assert.equal(rows[1]?.discountPercent, 20);
  });

  it('rejects non-Lyfja sources and blocked pages', () => {
    assert.throws(() => parseLyfjaIsProducts(FIXTURE, 'https://example.com/store/', RETRIEVED_AT), /lyfja\.is source URLs/);
    assert.throws(() => parseLyfjaIsProducts('access denied', LYFJA_IS_STORE_URL, RETRIEVED_AT), /blocked\/login/);
  });

  it('fetches with connector headers, maxRows, and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const rows = await fetchLyfjaIsProducts({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(FIXTURE, { status: 200 });
      },
      sourceUrls: [LYFJA_IS_STORE_URL],
      retrievedAt: RETRIEVED_AT,
      maxRows: 1
    });

    assert.equal(rows.length, 1);
    assert.equal(JSON.stringify(headers[0]).includes('lyfja-is-connector'), true);
    await assert.rejects(
      () => fetchLyfjaIsProducts({ fetchImpl: async () => new Response('blocked', { status: 403 }), sourceUrls: [LYFJA_IS_STORE_URL] }),
      /blocked with HTTP 403/
    );
  });
});
