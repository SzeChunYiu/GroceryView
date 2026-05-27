import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ALL_STORE_RUNNER_CHAINWIDE_CATALOG_CONNECTORS } from '../all-store-runner.js';
import { fetchMathemPrenumerationProducts, toMathemPrenumerationProduct } from '../mathem-prenumeration-se.js';
import { buildMathemSearchUrl } from '../mathem.js';

const RETRIEVED_AT = '2026-05-25T09:15:00.000Z';

function nextDataFixture(products: unknown[]): string {
  return `<!doctype html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: {
      pageProps: {
        dehydratedState: {
          queries: [{
            state: {
              data: {
                items: products
              }
            }
          }]
        }
      }
    }
  })}</script>`;
}

describe('Mathem prenumeration connector', () => {
  it('rebrands Mathem subscription-tier rows as the prenumeration chain', () => {
    const row = toMathemPrenumerationProduct({
      code: 'sub-1001',
      name: 'Subscription cereal',
      brand: 'Mathem',
      packageText: '500 g',
      price: 29,
      priceText: '29.00 SEK',
      unitPrice: 58,
      unitPriceText: '58.00 SEK',
      unitPriceUnit: 'kg',
      imageUrl: '',
      productUrl: 'https://www.mathem.se/se/products/sub-1001/',
      available: true,
      country: 'SE',
      currency: 'SEK',
      chain: 'mathem',
      mathem_tier: 'subscription',
      channel: 'online',
      is_coupon_price: false,
      is_subscription_price: true,
      is_clearance: false,
      multi_buy: '',
      sourceUrl: buildMathemSearchUrl('flingor'),
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(row?.country, 'SE');
    assert.equal(row?.currency, 'SEK');
    assert.equal(row?.chain, 'mathem-prenumeration');
    assert.equal(row?.mathem_tier, 'subscription');
    assert.equal(row?.is_subscription_price, true);
  });

  it('fetches only subscription rows and registers the chainwide runner connector', async () => {
    const rows = await fetchMathemPrenumerationProducts({
      queries: ['flingor'],
      pages: [1],
      retrievedAt: RETRIEVED_AT,
      fetchImpl: async () => new Response(nextDataFixture([
        {
          id: 'spot-1',
          type: 'product',
          attributes: {
            id: 'spot-1',
            fullName: 'Spot cereal',
            grossPrice: '35.00',
            currency: 'SEK'
          }
        },
        {
          id: 'sub-1',
          type: 'product',
          attributes: {
            id: 'sub-1',
            fullName: 'Subscription cereal',
            grossPrice: '29.00',
            currency: 'SEK',
            isSubscriptionPrice: true
          }
        }
      ]), { status: 200 })
    });

    assert.deepEqual(rows.map((row) => [row.code, row.chain, row.mathem_tier, row.is_subscription_price]), [
      ['sub-1', 'mathem-prenumeration', 'subscription', true]
    ]);
    assert.ok(ALL_STORE_RUNNER_CHAINWIDE_CATALOG_CONNECTORS.includes('mathem-prenumeration-se-products'));
  });
});
