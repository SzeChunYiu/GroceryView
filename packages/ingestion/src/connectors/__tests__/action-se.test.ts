import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildActionSeRows, fetchActionSePresence, parseActionSePresence } from '../action-se.js';

const CHECKED_AT = '2026-05-25T13:12:00.000Z';
const COUNTRY_SELECTOR_FIXTURE = `<!doctype html><main>
  <h1>Welcome to the Action website</h1>
  <ul>
    <li>Nederlands Nederland</li><li>Deutsch Deutschland</li><li>Français France</li>
    <li>Polski Polska</li><li>Português Portugal</li><li>Română România</li>
    <li>Italiano Italia</li><li>Español España</li><li>Hrvatski Hrvatska</li>
  </ul>
</main>`;

describe('Action SE presence check', () => {
  it('closes the connector as no Swedish presence when the official selector lacks Sweden', () => {
    const status = parseActionSePresence(COUNTRY_SELECTOR_FIXTURE, CHECKED_AT);

    assert.equal(status.chain, 'action');
    assert.equal(status.country, 'SE');
    assert.equal(status.currency, 'SEK');
    assert.equal(status.retailer_type, 'variety');
    assert.equal(status.status, 'no_se_presence_yet');
    assert.equal(status.qualifiesForConnector, false);
    assert.match(status.evidence, /does not list Sweden/);
    assert.deepEqual(buildActionSeRows(), []);
  });

  it('fails closed if Sweden appears and implementation must switch to real rows', () => {
    assert.throws(
      () => parseActionSePresence(`${COUNTRY_SELECTOR_FIXTURE}<a href="/sv-se/">Sverige</a>`, CHECKED_AT),
      /implement a store connector/
    );
  });

  it('fetches with connector headers and blocked-response handling', async () => {
    const headers: HeadersInit[] = [];
    const status = await fetchActionSePresence({
      fetchImpl: async (_input, init) => {
        headers.push(init?.headers ?? {});
        return new Response(COUNTRY_SELECTOR_FIXTURE, { status: 200 });
      },
      checkedAt: CHECKED_AT
    });

    assert.equal(status.status, 'no_se_presence_yet');
    assert.equal(JSON.stringify(headers[0]).includes('action-se-presence-check'), true);
    await assert.rejects(
      () => fetchActionSePresence({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
