import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchMlynNoStores, parseMlynNoLocations } from '../connectors/mlyn-no.js';

const fixture = `
  <script type="application/ld+json">
    {"@type":"Store","name":"Mlyn Oslo","address":{"streetAddress":"Testgata 1","postalCode":"0001","addressLocality":"Oslo"}}
  </script>
  <div data-store-name="Mlyn Drammen" data-address="Tollbugata 1" data-city="Drammen"></div>
`;

describe('Mlyn NO connector', () => {
  it('normalizes multiple Polish/Eastern European grocery locations', () => {
    const stores = parseMlynNoLocations(fixture, 'https://example.test/mlyn', '2026-05-24T15:00:00.000Z');
    assert.equal(stores.length, 2);
    assert.deepEqual(stores.map((store) => store.city), ['Drammen', 'Oslo']);
    assert.ok(stores.every((store) => store.category === 'ethnic_polish_eastern_european'));
  });

  it('fails closed unless at least two locations are verified', async () => {
    await assert.rejects(
      fetchMlynNoStores(['https://example.test/mlyn'], {
        fetchImpl: async () => new Response('<div data-store-name="Mlyn Oslo" data-address="Testgata 1" data-city="Oslo"></div>', { status: 200 }),
        retrievedAt: '2026-05-24T15:00:00.000Z'
      }),
      /multiple verified locations/
    );
  });
});
