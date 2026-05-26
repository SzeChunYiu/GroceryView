import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { describe, it } from 'node:test';
import {
  fetchMattilbudNoAccessReport,
  mattilbudNoChainSlug,
  parseMattilbudNoAccessReport,
  parseMattilbudNoOffers
} from '../mattilbud-no.js';

const RETRIEVED_AT = '2026-05-25T18:45:00.000Z';
const SOURCE_URL = 'https://mattilbud.no/';

const htmlAppData = (key: unknown, payload: unknown): string => {
  const encodedKey = Buffer.from(JSON.stringify(key)).toString('base64');
  return `<app-data data-key="${encodedKey}">${JSON.stringify(payload).replace(/"/g, '&quot;')}</app-data>`;
};

const PUBLIC_HOME_FIXTURE = `<!doctype html><html><body>
  ${htmlAppData(['businesses', {}], {
    businesses: [
      {
        public_id: 'rema-1000',
        name: 'REMA 1000',
        slug: 'rema-1000',
        country_code: 'NO',
        publication_count: 1,
        positive_logotype: { url: '/images/rema.svg' },
        negative_logotype: { url: '/images/rema-negative.svg' }
      },
      {
        public_id: 'meny',
        name: 'MENY',
        slug: 'meny',
        country_code: 'NO',
        publication_count: 2
      }
    ]
  })}
</body></html>`;

const OFFER_PAYLOAD = {
  publications: [
    {
      id: 'pub-uke-22',
      business: { public_id: 'kiwi', name: 'KIWI', slug: 'kiwi' },
      validFrom: '2026-05-25',
      validTo: '2026-05-31',
      publicationUrl: '/avis/kiwi/uke-22',
      offers: [
        {
          id: 'offer-1',
          product: { name: 'Tine lettmelk 1 l', gtin: '7041010000000', imageUrl: '/img/melk.jpg' },
          price: { amount: 19.9, formatted: '19,90 kr' },
          unitPriceText: '19,90/l',
          pageNumber: 3,
          category: 'meieri'
        }
      ]
    }
  ]
};

describe('Mattilbud NO connector', () => {
  it('maps known Norwegian flyer chains to GroceryView chain ids', () => {
    assert.equal(mattilbudNoChainSlug('REMA 1000'), 'rema-1000-no');
    assert.equal(mattilbudNoChainSlug('Coop Mega'), 'coop-mega-no');
  });

  it('parses public homepage app-data coverage and reports the offer access blocker', () => {
    const report = parseMattilbudNoAccessReport(PUBLIC_HOME_FIXTURE, SOURCE_URL, RETRIEVED_AT);

    assert.equal(report.offerAccess, 'not_embedded_public_homepage');
    assert.equal(report.offerRows.length, 0);
    assert.match(report.blocker, /no offer\/publication payloads/i);
    assert.deepEqual(report.coverageRows.map((row) => [row.chain, row.name, row.publicationCount]), [
      ['rema-1000-no', 'REMA 1000', 1],
      ['meny-no', 'MENY', 2]
    ]);
    assert.equal(report.coverageRows[0]?.positiveLogotype, 'https://mattilbud.no/images/rema.svg');
  });

  it('normalizes supplied Tjek-style offer payloads with validity, flyer page, and source dates', () => {
    const rows = parseMattilbudNoOffers(OFFER_PAYLOAD, SOURCE_URL, RETRIEVED_AT);

    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      country: 'NO',
      currency: 'NOK',
      chain: 'kiwi-no',
      businessId: 'kiwi',
      code: '7041010000000',
      name: 'Tine lettmelk 1 l',
      category: 'meieri',
      promotionType: 'weekly_flyer',
      price: 19.9,
      priceText: '19,90 kr',
      comparePriceText: '19,90/l',
      validFrom: '2026-05-25',
      validTo: '2026-05-31',
      flyerPage: 3,
      publicationId: 'pub-uke-22',
      publicationUrl: 'https://mattilbud.no/avis/kiwi/uke-22',
      productUrl: 'https://mattilbud.no/avis/kiwi/uke-22',
      imageUrl: 'https://mattilbud.no/img/melk.jpg',
      sourceUrl: SOURCE_URL,
      retrievedAt: RETRIEVED_AT,
      canonicalProductKey: '7041010000000',
      confidenceLabel: 'barcode',
      provenance: rows[0]?.provenance
    });
  });

  it('fetches with connector headers and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const report = await fetchMattilbudNoAccessReport({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(PUBLIC_HOME_FIXTURE, { headers: { 'content-type': 'text/html' } });
      },
      retrievedAt: RETRIEVED_AT
    });

    assert.equal(report.coverageRows.length, 2);
    assert.equal(JSON.stringify(headers[0]).includes('mattilbud-no-connector'), true);
    await assert.rejects(
      () => fetchMattilbudNoAccessReport({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
