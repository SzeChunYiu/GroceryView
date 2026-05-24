import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchBonusIsOffers, parseBonusIsOffers } from '../bonus-is.js';

const fixture = `
  <article data-product-id="bonus-1" data-name="Skyr með bláberjum" data-price="249 kr." data-url="/vara/skyr"></article>
  <article data-product-id="bonus-2" data-name="Invalid" data-price="call us" data-url="/vara/invalid"></article>
`;

describe('bonus-is connector fixture', () => {
  it('parses recorded product cards into the normalized row shape and skips invalid prices', () => {
    assert.deepEqual(parseBonusIsOffers(fixture, 'https://bonus.is/tilbod/'), [
      {
        chain: 'bonus-is',
        country: 'IS',
        code: 'bonus-1',
        name: 'Skyr með bláberjum',
        price: 249,
        currency: 'ISK',
        productUrl: 'https://bonus.is/vara/skyr',
        sourceUrl: 'https://bonus.is/tilbod/'
      }
    ]);
  });

  it('raises on HTTP errors from the fixture fetcher', async () => {
    await assert.rejects(
      fetchBonusIsOffers(async () => new Response('nope', { status: 503 }), 'https://bonus.is/tilbod/'),
      /Bonus IS request failed: 503/
    );
  });
});
