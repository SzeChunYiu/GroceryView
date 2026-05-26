import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchLloydsApotekSeProducts, parseLloydsApotekSePricingQuirks, parseLloydsApotekSeProducts } from '../lloyds-apotek-se.js';

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
        format: 'doz_apotek',
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

  it('emits source-backed DOZ/Lloyds pricing quirks without fabricating store prices', () => {
    const rows = parseLloydsApotekSePricingQuirks({
      observedAt: OBSERVED_AT,
      homeHtml: 'DOZ Apotek | Apotek online och i butik',
      memberHtml: 'Med DOZ Plus erbjuds rabatterade priser på utvalda produkter och teman som passar in i tiden. Varje månad erbjuder vi även rabatterade medlemspriser. Dessa kan variera mellan apotek och online för att det ska finnas så mycket som möjligt att välja på. DulcoSoft oral lösning 0,5 g/ml, 250 ml Kampanjpris 74,40 kr Ord.pris 93,00 kr',
      campaignHtml: '25% vid köp av 2 på DOZ Apotek Erbjudandet gäller under perioden 28/1-26/2, både online och i butik. Vi reserverar oss för eventuellt slutförsäljning. Priserna kan skiljas åt mot butik. DOZ Apotek Zinkcitrat 20 mg, 100 st Kampanjpris 66,50 kr Ord.pris 95,00 kr',
      onlineOnlyProductHtml: 'DOZ Apotek vaniljfudge, 175 g Onlinepris 79,00 kr Butikspris Jämförpris / kg OBS! Kort hållbarhetsdatum! Utgångsdatum: Juni 2026. GÄLLER ENDAST ONLINE, EJ HÄMTNING I BUTIK.'
    });

    assert.equal(rows.length, 3);
    assert.equal(rows.find((row) => row.format === 'doz_plus')?.is_member_price, true);
    assert.equal(rows.find((row) => row.format === 'doz_plus')?.price_sek, 74.4);
    assert.equal(rows.find((row) => row.multi_buy === '25% vid köp av 2')?.price_sek, 66.5);
    assert.equal(rows.find((row) => row.format === 'doz_online_only')?.channel, 'online');
    assert.equal(rows.find((row) => row.format === 'doz_online_only')?.is_clearance, true);
    assert.equal(rows.some((row) => row.channel === 'store'), false);
    assert.equal(rows.some((row) => row.is_subscription_price || row.is_coupon_price), false);
  });

  it('fails closed when required primary-source quirk evidence is absent', () => {
    assert.throws(() => parseLloydsApotekSePricingQuirks({
      observedAt: OBSERVED_AT,
      homeHtml: '',
      memberHtml: '',
      campaignHtml: '',
      onlineOnlyProductHtml: ''
    }), /missing evidence/);
  });
});
