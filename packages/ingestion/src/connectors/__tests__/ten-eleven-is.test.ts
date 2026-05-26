import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  fetchTenElevenIsPricingStudyStatus,
  parseTenElevenIsPricingStudyStatus,
  TEN_ELEVEN_IS_HOME_URL
} from '../ten-eleven-is.js';

const RETRIEVED_AT = '2026-05-25T13:25:00.000Z';
const OFFICIAL_HOME_FIXTURE = `<!doctype html>
<main>
  <h1>Þrjár frábærar staðsetningar!</h1>
  <section>
    <h2>Laugavegur</h2>
    <p>á móti Hlemmi</p>
    <p>Opnunartímar: Verslun 24/7</p>
    <a>Skoða á korti</a>
  </section>
  <section>
    <h2>Skólavörðustígur 42</h2>
    <p>Opnunartímar: Virka daga: 8-23.30 Helgar: 9-23.30</p>
  </section>
  <section>
    <h2>Austurstræti</h2>
    <p>í göngugötu</p>
    <p>Opnunartímar: Verslun 24/7</p>
  </section>
  <footer>Hagasmári 1 | 201 Kópavogur | Netfang: 10-11@10-11.is</footer>
</main>`;

describe('10-11 IS official pricing study connector', () => {
  it('records official stores but emits no unverified product price quirks', () => {
    const status = parseTenElevenIsPricingStudyStatus(OFFICIAL_HOME_FIXTURE, RETRIEVED_AT);

    assert.equal(status.status, 'official_site_locations_only_no_verifiable_product_prices');
    assert.deepEqual(status.codifiedPricingQuirks, []);
    assert.deepEqual(status.priceRows, []);
    assert.deepEqual(status.stores.map((store) => store.store_id), [
      'ten-eleven-is-laugavegur-hlemmur',
      'ten-eleven-is-skolavordustigur-42',
      'ten-eleven-is-austurstraeti'
    ]);
    assert.deepEqual(status.stores.map((store) => store.country), ['IS', 'IS', 'IS']);
    assert.match(status.evidence.join(' '), /does not expose product, price/);
  });

  it('fetches the official page with connector headers', async () => {
    const requestedUrls: string[] = [];
    const requestedHeaders: Array<HeadersInit | undefined> = [];
    const status = await fetchTenElevenIsPricingStudyStatus({
      fetchImpl: async (input, init) => {
        requestedUrls.push(String(input));
        requestedHeaders.push(init?.headers);
        return new Response(OFFICIAL_HOME_FIXTURE, { status: 200 });
      },
      retrievedAt: RETRIEVED_AT
    });

    assert.deepEqual(requestedUrls, [TEN_ELEVEN_IS_HOME_URL]);
    assert.equal(JSON.stringify(requestedHeaders[0]).includes('ten-eleven-is-connector'), true);
    assert.equal(status.stores.length, 3);
    assert.equal(status.sourceUrl, TEN_ELEVEN_IS_HOME_URL);
  });

  it('propagates HTTP failures from the official site', async () => {
    await assert.rejects(
      fetchTenElevenIsPricingStudyStatus({ fetchImpl: async () => new Response('blocked', { status: 503 }) }),
      /10-11 IS official site request failed with HTTP 503/
    );
  });
});
