import { describe, expect, it } from 'vitest';
import { fetchBiltemaSeProducts, parseBiltemaSeProducts } from '../biltema-se.js';

const RETRIEVED_AT = '2026-05-25T00:00:00.000Z';
const SOURCE_URL = 'https://www.biltema.se/hem/';

const ARTICLE_LISTING_HTML = `
  <script>
    window.articleListing_121339 = window.articleListing_121339 || [{
      "name":"Refillpåsar Original till fuktslukare, 3-pack",
      "articleNumber":"36375",
      "articleNumberFriendlyName":"36-375",
      "imageUrl":"https://productimages.biltema.com/v1/Image/article/medium/36375/2",
      "url":"/hem/stadning/fuktslukare/refillpasar-original-till-fuktslukare-3-pack-2000055266",
      "priceIncVAT":"47,900000000",
      "previousPrice":"59,900000000",
      "analyticsProductEntity":{"categoryHierarchy":"Hem/Städning/Fuktslukare","categories":["Hem","Städning","Fuktslukare"]}
    },{
      "name":"Alkaliska batterier AA, 24-pack",
      "articleNumber":"381064",
      "imageUrl":"/image/381064.jpg",
      "url":"/kontor---teknik/batterier/alkaliska-batterier-aa-24-pack-2000045678",
      "priceIncVAT":"69,900000000",
      "previousPrice":"0,000000000",
      "analyticsProductEntity":{"categoryHierarchy":"Kontor & Teknik/Batterier/Alkaliska batterier","categories":["Kontor & Teknik","Batterier"]}
    }];
  </script>
`;

describe('Biltema SE connector', () => {
  it('parses SEK household rows from biltema.se article listings', () => {
    const rows = parseBiltemaSeProducts(ARTICLE_LISTING_HTML, SOURCE_URL, RETRIEVED_AT);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      country: 'SE',
      currency: 'SEK',
      chain: 'biltema-se',
      retailerType: 'household',
      code: '36375',
      name: 'Refillpåsar Original till fuktslukare, 3-pack',
      category: 'Hem/Städning/Fuktslukare',
      price: 47.9,
      priceText: '47,90 kr',
      previousPrice: 59.9,
      previousPriceText: '59,90 kr'
    });
    expect(rows[0]?.productUrl).toBe('https://www.biltema.se/hem/stadning/fuktslukare/refillpasar-original-till-fuktslukare-3-pack-2000055266');
    expect(rows[0]?.imageUrl).toBe('https://productimages.biltema.com/v1/Image/article/medium/36375/2');
    expect(rows[1]).toMatchObject({ code: '381064', price: 69.9, previousPrice: 0, previousPriceText: '' });
  });

  it('fetches Swedish Biltema pages with maxRows, dedupe, and blocked response handling', async () => {
    const requestedUrls: string[] = [];
    const rows = await fetchBiltemaSeProducts({
      sourceUrls: [SOURCE_URL, 'https://www.biltema.se/kontor---teknik/batterier/'],
      fetchImpl: async (url) => {
        requestedUrls.push(String(url));
        return new Response(ARTICLE_LISTING_HTML);
      },
      maxRows: 1,
      retrievedAt: RETRIEVED_AT
    });

    expect(rows).toHaveLength(1);
    expect(requestedUrls).toHaveLength(1);
    await expect(fetchBiltemaSeProducts({ fetchImpl: async () => new Response('blocked', { status: 403 }) })).rejects.toThrow(/blocked with HTTP 403/);
  });
});
