import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchSkeljungurIsFuelPrices,
  fetchSkeljungurIsShopProduct,
  parseSkeljungurIsFuelPriceList,
  parseSkeljungurIsShopProductPage,
  SKELJUNGUR_IS_FUEL_PRICES_URL,
  SKELJUNGUR_IS_SAMPLE_PRODUCT_URL
} from '../skeljungur-is.js';

const CAPTURED_AT = '2026-05-25T17:25:00.000Z';
const FUEL_FIXTURE = JSON.stringify({
  executiontime: '2026-05-25 17:21:14',
  items: [
    { ItemName: 'Bensín 95 okt', Price: '231.30' },
    { ItemName: 'Bensín 98 okt', Price: '271.20' },
    { ItemName: 'Gasolía-Diesel', Price: '266.80' },
    { ItemName: 'Metan', Price: '238.89' }
  ]
});

const SHOP_FIXTURE = `<!doctype html>
<main>
  <h1>Shell Bensínbrúsi 5L * Gulur* með áfyllingarstút</h1>
  <p>listaverð með VSK:</p>
  <p>Netverslun: Til á lager</p>
  <p>Verslun Skútuvogi: Til á lager</p>
  <form
    data-variants="[{&quot;display_price&quot;:&quot;2.226&amp;nbsp;kr.&quot;,&quot;price&quot;:{&quot;amount&quot;:&quot;2226.0&quot;,&quot;currency&quot;:&quot;ISK&quot;},&quot;option_values&quot;:[{&quot;name&quot;:&quot;STK&quot;,&quot;presentation&quot;:&quot;STK&quot;}],&quot;sku&quot;:&quot;2020078-STK&quot;,&quot;qty_uom&quot;:&quot;1 STK&quot;},{&quot;display_price&quot;:&quot;26.712&amp;nbsp;kr.&quot;,&quot;price&quot;:{&quot;amount&quot;:&quot;26712.0&quot;,&quot;currency&quot;:&quot;ISK&quot;},&quot;option_values&quot;:[{&quot;name&quot;:&quot;KASSI&quot;,&quot;presentation&quot;:&quot;KASSI&quot;}],&quot;sku&quot;:&quot;2020078-KASSI&quot;,&quot;qty_uom&quot;:&quot;12 STK&quot;}]">
  </form>
</main>`;

describe('Skeljungur IS pricing connector', () => {
  it('parses public fuel list prices as non-member list-price rows', () => {
    const rows = parseSkeljungurIsFuelPriceList({ body: FUEL_FIXTURE, capturedAt: CAPTURED_AT });

    assert.equal(rows.length, 4);
    assert.deepEqual(rows[0], {
      domain: 'fuel',
      productId: 'fuel-95-e10',
      gradeLabel: 'Skeljungur Bensín 95 okt',
      pricePerLitre: 231.3,
      unit: 'l',
      currency: 'ISK',
      chainId: 'skeljungur-is',
      sourceKind: 'operator_public_price_page',
      operatorName: 'Skeljungur',
      sourceUrl: SKELJUNGUR_IS_FUEL_PRICES_URL,
      observedAt: CAPTURED_AT,
      effectiveFrom: '2026-05-25',
      channel: 'list_price',
      is_member_price: false,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows.find((row) => row.productId === 'fuel-methane')?.unit, 'kg');
    assert.match(rows[0]?.provenance.listPriceDisclaimer ?? '', /special terms/);
  });

  it('emits online and store rows plus concrete multi-buy rows from shop variants', () => {
    const rows = parseSkeljungurIsShopProductPage({ body: SHOP_FIXTURE, capturedAt: CAPTURED_AT });

    assert.equal(rows.length, 4);
    assert.equal(rows.filter((row) => row.channel === 'online').length, 2);
    assert.equal(rows.filter((row) => row.channel === 'store' && row.store_id === 'skeljungur-is-skutuvogur').length, 2);
    assert.deepEqual(rows.find((row) => row.sku === '2020078-KASSI' && row.channel === 'online')?.multi_buy, {
      type: 'multi_buy',
      minimumQuantity: 12,
      quantityUnit: 'STK',
      totalPrice: 26712
    });
    assert.equal(rows.some((row) => row.is_coupon_price || row.is_subscription_price || row.is_clearance), false);
  });

  it('fetches fuel and shop sources with connector headers', async () => {
    const requestedUrls: string[] = [];
    const requestedHeaders: Array<HeadersInit | undefined> = [];
    await fetchSkeljungurIsFuelPrices({
      capturedAt: CAPTURED_AT,
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        requestedHeaders.push(init?.headers);
        return new Response(FUEL_FIXTURE, { status: 200 });
      }
    });
    await fetchSkeljungurIsShopProduct({
      capturedAt: CAPTURED_AT,
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        requestedHeaders.push(init?.headers);
        return new Response(SHOP_FIXTURE, { status: 200 });
      }
    });

    assert.equal(requestedUrls[0], `${SKELJUNGUR_IS_FUEL_PRICES_URL}?date=2026-05-25`);
    assert.equal(requestedUrls[1], SKELJUNGUR_IS_SAMPLE_PRODUCT_URL);
    assert.equal(requestedHeaders.every((headers) => JSON.stringify(headers).includes('skeljungur-is-connector')), true);
  });
});
