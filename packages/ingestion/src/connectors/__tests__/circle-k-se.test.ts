import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ALL_STORE_RUNNER_CHAINWIDE_CATALOG_CONNECTORS } from '../all-store-runner.js';
import {
  CIRCLE_K_SE_FUEL_PRICES_URL,
  fetchCircleKSeConvenienceProducts,
  fetchCircleKSeFuelPrices,
  parseCircleKSeConvenienceProducts,
  parseCircleKSeFuelPricePage
} from '../circle-k-se.js';

const CAPTURED_AT = '2026-05-25T12:20:00.000Z';
const FUEL_FIXTURE = `<!doctype html><table><tbody>
<tr><td><img alt="Miles 95"/></td><td><span>Produktnamn:</span> miles 95</td><td><span>Pris:</span> 18,64</td><td><span>Ändringsdatum:</span> <time datetime="2026-05-25T12:00:00Z">2026-05-25</time></td><td><span>Enhet:</span> kr/l</td><td><span>Ändring:</span> -0,25</td></tr>
<tr><td><img alt="Diesel"/></td><td><span>Produktnamn:</span> miles diesel</td><td><span>Pris:</span> 20,99</td><td><span>Ändringsdatum:</span> <time datetime="2026-05-25T12:00:00Z">2026-05-25</time></td><td><span>Enhet:</span> kr/l</td><td><span>Ändring:</span> -0,35</td></tr>
<tr><td><img alt="CNG"/></td><td><span>Produktnamn:</span> Fordonsgas</td><td><span>Pris:</span> 30,19</td><td><span>Ändringsdatum:</span> <time datetime="2026-03-11T12:00:00Z">2026-03-11</time></td><td><span>Enhet:</span> kr/kg</td><td><span>Ändring:</span> +0,51</td></tr>
</tbody></table>`;

const FOODINFO_FIXTURE = {
  menuItems: [{
    id: 91,
    name: 'Gigant svart Kaffe',
    category_id: 22,
    image: '/SE/Espresso.jpeg',
    barcode: '7317070002371',
    price: null,
    category: [{ id: 22, name: 'KAFFE / VARM DRYCK', slug: 'kaffe' }]
  }, {
    id: 928,
    name: 'Surdegsbaguette',
    image: '/SE/Surdegsbaguette.jpeg',
    barcode: '7315060098892',
    price: '49,00',
    category: [{ id: 12, name: 'BAGUETTER', slug: 'sandwiches' }]
  }, {
    id: 1,
    name: 'Unrelated metadata row',
    price: null,
    category: [{ id: 99, name: 'ANNAT', slug: 'other' }]
  }]
};

describe('Circle K SE connector', () => {
  it('parses business fuel price rows with chain and country tags', () => {
    const rows = parseCircleKSeFuelPricePage({ html: FUEL_FIXTURE, capturedAt: CAPTURED_AT });

    assert.equal(rows.length, 3);
    assert.deepEqual({ chain: rows[0]?.chain, country: rows[0]?.country, productId: rows[0]?.productId, price: rows[0]?.pricePerLitre }, {
      chain: 'circle-k',
      country: 'SE',
      productId: 'fuel-95-e10',
      price: 18.64
    });
    assert.equal(rows.find((row) => row.productId === 'fuel-cng')?.unit, 'kg');
    assert.equal(rows.find((row) => row.productId === 'fuel-diesel')?.provenance.originalChangeText, '-0,35');
  });

  it('parses FoodInfo convenience rows while marking unpublished prices explicitly', () => {
    const rows = parseCircleKSeConvenienceProducts({ payload: FOODINFO_FIXTURE, retrievedAt: CAPTURED_AT });

    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.chain, 'circle-k');
    assert.equal(rows[0]?.country, 'SE');
    assert.equal(rows[0]?.category, 'drink');
    assert.equal(rows[0]?.priceAvailability, 'not_published');
    assert.equal(rows[1]?.category, 'sandwich');
    assert.equal(rows[1]?.price, 49);
  });

  it('fetches fuel and convenience sources with connector headers and registers the chainwide catalog connector', async () => {
    const requestedUrls: string[] = [];
    const requestedHeaders: Array<HeadersInit | undefined> = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      requestedUrls.push(String(input));
      requestedHeaders.push(init?.headers);
      if (String(input) === CIRCLE_K_SE_FUEL_PRICES_URL) return new Response(FUEL_FIXTURE, { status: 200, headers: { 'content-type': 'text/html' } });
      return new Response(JSON.stringify(FOODINFO_FIXTURE), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    assert.equal((await fetchCircleKSeFuelPrices({ fetchImpl, capturedAt: CAPTURED_AT })).length, 3);
    assert.equal((await fetchCircleKSeConvenienceProducts({ fetchImpl, retrievedAt: CAPTURED_AT, queries: ['kaffe'] })).length, 2);
    assert.equal(requestedUrls.some((url) => url.includes('/getMenuItems/se/kaffe')), true);
    assert.equal(JSON.stringify(requestedHeaders).includes('circle-k-se-fuel-connector'), true);
    assert.equal(JSON.stringify(requestedHeaders).includes('circle-k-se-convenience-connector'), true);
    assert.equal(ALL_STORE_RUNNER_CHAINWIDE_CATALOG_CONNECTORS.includes('circle-k-se-convenience-products'), true);
  });
});
