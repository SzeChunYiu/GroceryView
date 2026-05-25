import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchLloydsApotekSeProducts, parseLloydsApotekSeProducts } from '../lloyds-apotek-se.js';

const SOURCE_URL = 'https://www.lloydsapotek.se/sok?q=vitamin';
const OBSERVED_AT = '2026-05-25T12:00:00.000Z';

function fixture(candidates: unknown[]): string {
  return `<html><body><script type="application/json">${JSON.stringify({ props: { pageProps: { candidates } } })}</script></body></html>`;
}

describe('lloyds-apotek-se connector', () => {
  it('normalizes Lloyds public pharmacy rows with the shared pharmacy shape', () => {
    const rows = parseLloydsApotekSeProducts(fixture([
      {
        productName: 'Lloyds D-vitamin 100 tabletter',
        price: { current: { inclVat: 79, currency: 'SEK' } },
        gtin: '07350001234567',
        packageSize: '100 st',
        productUrl: '/produkt/lloyds-d-vitamin-100-tabletter/'
      }
    ]), SOURCE_URL, OBSERVED_AT);

    assert.deepEqual(rows, [
      {
        country: 'SE',
        currency: 'SEK',
        chain: 'lloyds-apotek',
        product_name: 'Lloyds D-vitamin 100 tabletter',
        price_sek: 79,
        unit: '100 st',
        observed_at: OBSERVED_AT,
        source_url: 'https://www.lloydsapotek.se/produkt/lloyds-d-vitamin-100-tabletter/'
      }
    ]);
  });

  it('fetches configured Lloyds source URLs and keeps the connector user agent', async () => {
    const requested: Array<{ url: string; init?: RequestInit }> = [];
    const rows = await fetchLloydsApotekSeProducts({
      observedAt: OBSERVED_AT,
      sourceUrls: [SOURCE_URL],
      fetchImpl: (async (url, init) => {
        requested.push({ url: String(url), init });
        return new Response(fixture([{ productName: 'Flux', price: { current: { inclVat: 39 } }, gtin: '07350007654321', quantity: '500 ml' }]), { status: 200 });
      }) as typeof fetch
    });

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.chain, 'lloyds-apotek');
    assert.equal(requested[0]?.url, SOURCE_URL);
    assert.equal(JSON.stringify(requested[0]?.init?.headers).includes('lloyds-apotek-se-connector'), true);
  });
});
