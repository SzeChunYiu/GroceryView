import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchLloydsApotekSeProducts, parseLloydsApotekSeProducts } from '../lloyds-apotek-se.js';

const SOURCE_URL = 'https://www.lloydsapotek.se/sok?q=vitamin';
const OBSERVED_AT = '2026-05-25T12:00:00.000Z';

function fixture(candidates: unknown[]): string {
  return `<html><body><script type="application/json">${JSON.stringify({ props: { pageProps: { candidates } } })}</script></body></html>`;
}

function dozMagentoFixture(cards: string[], title = 'DOZ Apotek'): string {
  return `<html><head><meta name="title" content="${title}"/></head><body><ol>${cards.join('')}</ol></body></html>`;
}

function dozProductCard(input: {
  name: string;
  href: string;
  price: string;
  labels?: string;
  imageLabels?: string;
}): string {
  return `
    <li class="flex flex-col">
      <form method="post" class="item product product-item product_addtocart_form card-interactive">
        <a class="product photo product-item-photo" href="${input.href}">
          ${input.imageLabels ?? ''}
        </a>
        <div class="product-info">
          <div class="items-center justify-center text-center">
            <a class="product-item-link" href="${input.href}">
              ${input.name}
            </a>
          </div>
          ${input.labels ?? ''}
          <div class="lipscore-rating-small"
            data-ls-product-name="${input.name}"
            data-ls-product-url="${input.href}"
            data-ls-price="${input.price}"
            data-ls-price-currency="SEK">
          </div>
        </div>
      </form>
    </li>
  `;
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

  it('parses DOZ Magento product cards with data-ls price and campaign context', () => {
    const rows = parseLloydsApotekSeProducts(dozMagentoFixture([
      dozProductCard({
        name: 'V6 Strong Teeth Spearmint',
        href: 'https://dozapotek.se/v6-strong-teeth-spearmint-780872',
        price: '19.20',
        labels: '<span class="label">2 för 50 :-</span>'
      })
    ], 'V6 Ask 2 för 50 kr - Alltid erbjudande på DOZ - Kampanjer'), 'https://dozapotek.se/aktuella-kampanjer/alltid-pa-doz/2-for-50-kr-v6-ask', OBSERVED_AT);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.product_name, 'V6 Strong Teeth Spearmint');
    assert.equal(rows[0]?.price_sek, 19.2);
    assert.equal(rows[0]?.source_url, 'https://dozapotek.se/v6-strong-teeth-spearmint-780872');
    assert.equal(rows[0]?.campaign_label, 'V6 Ask 2 för 50 kr');
    assert.equal(rows[0]?.multi_buy, 'V6 Ask 2 för 50 kr');
    assert.deepEqual(rows[0]?.context_labels, ['V6 Ask 2 för 50 kr', '2 för 50 kr']);
  });

  it('keeps DOZ OUTLET, kort hållbarhet, and Wolt badge context source-backed', () => {
    const rows = parseLloydsApotekSeProducts(dozMagentoFixture([
      dozProductCard({
        name: 'DOZ Apotek vaniljfudge, 175 g',
        href: '/doz-apotek-vaniljfudge-175-g-687553',
        price: '55,30',
        labels: '<span class="label">Kort hållbarhet 30%</span><span class="label">OUTLET</span>',
        imageLabels: '<img alt="Wolt" src="https://media.dozapotek.se/cataloglabel/w/o/wolt-logo_29.png" />'
      })
    ]), SOURCE_URL, OBSERVED_AT);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.unit, '175 g');
    assert.equal(rows[0]?.source_url, 'https://dozapotek.se/doz-apotek-vaniljfudge-175-g-687553');
    assert.equal(rows[0]?.campaign_label, 'Kort hållbarhet 30%');
    assert.equal(rows[0]?.is_clearance, true);
    assert.deepEqual(rows[0]?.delivery_partners, ['Wolt']);
    assert.deepEqual(rows[0]?.context_labels, ['Kort hållbarhet 30%', 'OUTLET', 'Wolt']);
  });
});
