import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BONUS_IS_STORE_BASE_URL,
  BONUS_IS_SOURCE_RESEARCH,
  checkBonusIsConnectorHealth,
  fetchBonusIsProducts,
  parseBonusIsProducts
} from '../bonus-is.js';

const RETRIEVED_AT = '2026-05-25T10:45:00.000Z';
const SOURCE_URL = `${BONUS_IS_STORE_BASE_URL}/`;

const RECORDED_BONUS_FIXTURE = `<!doctype html>
<html lang="is">
  <body>
    <ul class="products columns-4">
      <li class="product type-product post-17 instock">
        <a href="https://verslun.bonus.is/vara/bonus-brusi/" class="woocommerce-LoopProduct-link">
          <img src="https://verslun.bonus.is/wp-content/uploads/2025/04/brusi.jpg" alt="Bónus Brúsi" />
          <h2 class="woocommerce-loop-product__title">Bónus Brúsi</h2>
          <span class="price"><span class="woocommerce-Price-amount amount"><bdi>1.998&nbsp;<span class="woocommerce-Price-currencySymbol">kr.</span></bdi></span></span>
        </a>
        <span class="sku">Bon17</span>
      </li>
      <li class="product type-product post-6 outofstock">
        <a href="/vara/white-cap/">
          <img data-src="/wp-content/uploads/2024/12/white-cap.jpg" alt="White Cap" />
          <h2 class="woocommerce-loop-product__title">White Cap</h2>
          <span class="price"><span class="woocommerce-Price-amount amount">1.498 kr.</span></span>
        </a>
        <span class="sku">Bon6</span>
        <span class="stock out-of-stock">Ekki til á lager</span>
      </li>
      <li class="product type-product post-999 instock">
        <a href="/vara/broken-row/"><h2 class="woocommerce-loop-product__title">Broken row without price</h2></a>
      </li>
      <li class="product type-product post-17 instock">
        <a href="https://verslun.bonus.is/vara/bonus-brusi/"><h2 class="woocommerce-loop-product__title">Duplicate Bónus Brúsi</h2><span class="price"><span class="woocommerce-Price-amount amount">9.999 kr.</span></span></a><span class="sku">Bon17</span>
      </li>
    </ul>
  </body>
</html>`;

function response(text: string, status = 200): Response {
  return new Response(text, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

describe('Bónus IS connector fixture parsing', () => {
  it('parses recorded WooCommerce fixture rows into normalized Bónus products', () => {
    const rows = parseBonusIsProducts(RECORDED_BONUS_FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[0], {
      chain: 'bonus-is',
      code: 'Bon17',
      name: 'Bónus Brúsi',
      categoryPath: ['dryck'],
      categorySlug: 'dryck',
      categoryConfidence: 'medium',
      categoryMatchedKeyword: 'brusi',
      categorySource: 'name',
      price: 1998,
      priceText: '1.998 kr.',
      currency: 'ISK',
      unitPrice: null,
      unitPriceText: null,
      productUrl: 'https://verslun.bonus.is/vara/bonus-brusi/',
      imageUrl: 'https://verslun.bonus.is/wp-content/uploads/2025/04/brusi.jpg',
      inStock: true,
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT
    });
    assert.deepEqual(
      { code: rows[1]?.code, name: rows[1]?.name, categoryPath: rows[1]?.categoryPath, categoryMatchedKeyword: rows[1]?.categoryMatchedKeyword, price: rows[1]?.price, currency: rows[1]?.currency, unitPrice: rows[1]?.unitPrice, imageUrl: rows[1]?.imageUrl, productUrl: rows[1]?.productUrl, inStock: rows[1]?.inStock },
      { code: 'Bon6', name: 'White Cap', categoryPath: ['dryck'], categoryMatchedKeyword: 'white cap', price: 1498, currency: 'ISK', unitPrice: null, imageUrl: 'https://verslun.bonus.is/wp-content/uploads/2024/12/white-cap.jpg', productUrl: 'https://verslun.bonus.is/vara/white-cap/', inStock: false }
    );
  });

  it('documents Bónus catalog access constraints and unit-price blocker evidence', () => {
    assert.equal(BONUS_IS_SOURCE_RESEARCH.officialSite, 'https://bonus.is/');
    assert.equal(BONUS_IS_SOURCE_RESEARCH.accessStatus, 'public_woocommerce_html');
    assert.match(BONUS_IS_SOURCE_RESEARCH.legalConstraint, /avoid cart\/session endpoints/);
    assert.match(BONUS_IS_SOURCE_RESEARCH.unitPriceEvidence, /unitPrice remains null/);
  });

  it('mocks HTTP with the fixture, skips malformed rows, de-duplicates codes, and preserves request metadata', async () => {
    const requestedUrls: string[] = [];
    const requestedHeaders: Array<HeadersInit | undefined> = [];

    const rows = await fetchBonusIsProducts({
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        requestedHeaders.push(init?.headers);
        return response(RECORDED_BONUS_FIXTURE);
      },
      sourceUrls: [SOURCE_URL],
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(requestedUrls, [SOURCE_URL]);
    assert.equal(JSON.stringify(requestedHeaders[0]).includes('GroceryView/0.1'), true);
    assert.deepEqual(rows.map((row) => row.code), ['Bon17', 'Bon6']);
    assert.equal(rows.every((row) => row.sourceUrl === SOURCE_URL), true);
    assert.equal(rows.every((row) => row.retrievedAt === RETRIEVED_AT), true);
  });

  it('falls back to WooCommerce URL slugs for Bónus category inference', () => {
    const [row] = parseBonusIsProducts(`
      <li class="product">
        <a href="/vara/islenst-kaffi/">
          <h2 class="woocommerce-loop-product__title">Mystery bundle</h2>
          <span class="price"><span class="woocommerce-Price-amount amount">599 kr.</span></span>
        </a>
      </li>
    `, SOURCE_URL, RETRIEVED_AT);

    assert.equal(row?.categorySource, 'url');
    assert.deepEqual(row?.categoryPath, ['skafferi', 'kaffe-te']);
    assert.equal(row?.categoryMatchedKeyword, 'kaffi');
  });

  it('reports Bónus connector health from a bounded fixture sample', async () => {
    const health = await checkBonusIsConnectorHealth({
      fetchImpl: async () => response(RECORDED_BONUS_FIXTURE),
      sourceUrls: [SOURCE_URL],
      maxRows: 2,
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(health, {
      chain: 'bonus-is',
      checkedAt: RETRIEVED_AT,
      sourceUrls: [SOURCE_URL],
      requestedMaxRows: 2,
      rowCount: 2,
      nonEmptyFields: { name: 2, price: 2, productUrl: 2, imageUrl: 2 },
      ok: true
    });
  });

  it('reports HTTP failures in Bónus connector health checks', async () => {
    const health = await checkBonusIsConnectorHealth({
      fetchImpl: async () => response('blocked', 503),
      sourceUrls: [SOURCE_URL],
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(health.ok, false);
    assert.equal(health.rowCount, 0);
    assert.deepEqual(health.nonEmptyFields, { name: 0, price: 0, productUrl: 0, imageUrl: 0 });
    assert.match(health.error ?? '', /Bónus request failed for https:\/\/verslun\.bonus\.is\/: 503/);
  });

  it('honours maxRows and propagates non-OK fixture responses', async () => {
    const rows = await fetchBonusIsProducts({
      fetchImpl: async () => response(RECORDED_BONUS_FIXTURE),
      sourceUrls: [SOURCE_URL, `${BONUS_IS_STORE_BASE_URL}/en/`],
      maxRows: 1,
      retrievedAt: RETRIEVED_AT
    });
    assert.deepEqual(rows.map((row) => row.code), ['Bon17']);

    await assert.rejects(
      fetchBonusIsProducts({ fetchImpl: async () => response('blocked', 503), sourceUrls: [SOURCE_URL] }),
      /Bónus request failed for https:\/\/verslun\.bonus\.is\/: 503/
    );
  });
});
