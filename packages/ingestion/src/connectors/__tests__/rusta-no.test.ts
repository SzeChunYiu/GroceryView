import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchRustaNoProducts, parseRustaNoProducts, RUSTA_NO_DEFAULT_SOURCE_URLS } from '../rusta-no.js';

const RETRIEVED_AT = '2026-05-25T12:00:00.000Z';

const CURRENT_PAGE_HTML = `<html><body><script>
window.CURRENT_PAGE = {"products":[
  {
    "url":"/nb-no/kjokken-og-husholdning/kjokkenmaskiner/mikrobolgeovner/mikrobolgeovn-700w-20-l-mwo26-900101780101",
    "images":[{"url":"/globalassets/productimages/900101780101-3-p.jpg"}],
    "price":{"current":{"inclVat":799.0},"original":{"inclVat":799.0},"memberCurrent":{"inclVat":499.0},"comparisonPrice":0,"comparisonUnit":null},
    "displayName":"Mikrobølgeovn",
    "code":"900101780101",
    "variationCode":"900101780101",
    "buyableOnline":true,
    "buyableInStore":true,
    "memberPrice":true,
    "subTitle":"700W 20 l MWO26",
    "category":"Mikrobølgeovner",
    "rateAndReviewsScore":{"brand":"Rusta Home"},
    "isSale":false
  },
  {
    "url":"/nb-no/fritid-og-reise/mat-og-drikke/sjokolade/sjokoladeplate-100-g-123",
    "images":[],
    "price":{"current":{"inclVat":24.9},"original":{"inclVat":29.9},"comparisonPrice":249,"comparisonUnit":"kg"},
    "displayName":"Sjokoladeplate",
    "code":"123",
    "buyableOnline":false,
    "buyableInStore":true,
    "category":"Sjokolade",
    "isSale":true
  }
]};
</script></body></html>`;

describe('Rusta NO connector', () => {
  it('parses Rusta Norway CURRENT_PAGE product listings', () => {
    const rows = parseRustaNoProducts(CURRENT_PAGE_HTML, RUSTA_NO_DEFAULT_SOURCE_URLS[0], RETRIEVED_AT);

    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'rusta-no',
      retailerType: 'variety_discount',
      code: '900101780101',
      name: 'Mikrobølgeovn',
      brand: 'Rusta Home',
      category: 'Mikrobølgeovner',
      subtitle: '700W 20 l MWO26',
      price: 799,
      priceText: '799 kr',
      originalPrice: 799,
      memberPrice: 499,
      comparisonPrice: null,
      comparisonUnit: '',
      onSale: false,
      memberOffer: true,
      buyableOnline: true,
      buyableInStore: true,
      productUrl: 'https://www.rusta.com/nb-no/kjokken-og-husholdning/kjokkenmaskiner/mikrobolgeovner/mikrobolgeovn-700w-20-l-mwo26-900101780101',
      imageUrl: 'https://www.rusta.com/globalassets/productimages/900101780101-3-p.jpg',
      sourceUrl: RUSTA_NO_DEFAULT_SOURCE_URLS[0],
      retrievedAt: RETRIEVED_AT
    });
    assert.equal(rows[1].price, 24.9);
    assert.equal(rows[1].priceText, '24,90 kr');
    assert.equal(rows[1].onSale, true);
    assert.equal(rows[1].comparisonPrice, 249);
  });

  it('fetches Rusta pages with maxRows, dedupe, and blocked response handling', async () => {
    const requestedUrls: string[] = [];
    const rows = await fetchRustaNoProducts({
      sourceUrls: ['https://www.rusta.com/nb-no/kjokken-og-husholdning', 'https://www.rusta.com/nb-no/fritid-og-reise/mat-og-drikke'],
      fetchImpl: async (url) => {
        requestedUrls.push(String(url));
        return new Response(CURRENT_PAGE_HTML);
      },
      maxRows: 1,
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(rows.length, 1);
    assert.equal(requestedUrls.length, 1);
    await assert.rejects(
      () => fetchRustaNoProducts({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
