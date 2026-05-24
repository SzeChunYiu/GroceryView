import { fetchNettoProducts, parseNettoProductPage } from '../netto.js';

type Matcher<T> = {
  toBe(expected: T): void;
  toEqual(expected: T): void;
};

declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void | Promise<void>) => void;
declare function expect<T>(actual: T): Matcher<T>;

describe('Netto Sweden scraper', () => {
  const productUrl = 'https://netto.se/produkt/kaffe-mellanrost-500g';
  const retrievedAt = '2026-05-25T08:00:00.000Z';
  const productHtml = `
    <html>
      <head>
        <meta property="og:image" content="/images/kaffe.jpg">
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Kaffe Mellanrost 500g",
            "sku": "netto-kaffe-500g",
            "gtin13": "7310865004703",
            "brand": { "name": "Netto" },
            "category": "Skafferi > Kaffe",
            "size": "500g",
            "description": "Jämförpris 79,80 kr/kg",
            "image": ["/images/kaffe.jpg"],
            "url": "/produkt/kaffe-mellanrost-500g",
            "offers": {
              "@type": "Offer",
              "price": "39,90",
              "priceCurrency": "SEK",
              "availability": "https://schema.org/InStock"
            }
          }
        </script>
      </head>
    </html>
  `;

  it('maps product JSON-LD into the internal scraper schema', () => {
    expect(parseNettoProductPage(productHtml, productUrl, retrievedAt)).toEqual({
      chainId: 'netto-se',
      retailer: 'Netto Sweden',
      countryCode: 'SE',
      productId: 'netto-se:netto-kaffe-500g',
      sku: 'netto-kaffe-500g',
      ean: '7310865004703',
      name: 'Kaffe Mellanrost 500g',
      brand: 'Netto',
      categoryPath: ['Skafferi', 'Kaffe'],
      price: 39.9,
      currency: 'SEK',
      priceText: '39.90 SEK',
      unitPrice: 79.8,
      unitPriceText: '79,80 kr/kg',
      packageText: '500g',
      normalizedPackage: { quantity: 0.5, unit: 'kg' },
      imageUrl: 'https://netto.se/images/kaffe.jpg',
      productUrl,
      sourceUrl: productUrl,
      inStock: true,
      retrievedAt
    });
  });

  it('fetches configured product pages and deduplicates by EAN', async () => {
    const requestedUrls: string[] = [];
    const fetchImpl = async (url: string | URL | Request) => {
      requestedUrls.push(url.toString());
      return { ok: true, text: async () => productHtml } as Response;
    };

    const rows = await fetchNettoProducts({
      fetchImpl,
      productUrls: [productUrl, `${productUrl}?duplicate=1`],
      retrievedAt
    });

    expect(requestedUrls).toEqual([productUrl, `${productUrl}?duplicate=1`]);
    expect(rows.length).toBe(1);
    expect(rows[0].ean).toBe('7310865004703');
  });
});
