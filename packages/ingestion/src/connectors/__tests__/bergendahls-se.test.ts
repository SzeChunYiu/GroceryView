import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BERGENDAHLS_SE_INVESTIGATION_NOTE, getBergendahlsSeConnectorStatus } from '../bergendahls-se.js';

describe('Bergendahls SE connector feasibility status', () => {
  it('returns a no-row not-feasible status for the unavailable wholesale price feed', () => {
    const status = getBergendahlsSeConnectorStatus('2026-05-25T19:30:00.000Z');

    assert.deepEqual(status, {
      country: 'SE',
      currency: 'SEK',
      chain: 'bergendahls',
      status: 'not_feasible_no_public_price_feed',
      rows: [],
      investigatedAt: '2026-05-25T19:30:00.000Z',
      evidenceUrls: status.evidenceUrls,
      note: BERGENDAHLS_SE_INVESTIGATION_NOTE
    });
    assert.match(status.note, /no public Bergendahls grocery price feed/);
    assert.equal(status.evidenceUrls.some((url) => url.includes('axfood.com')), true);
  });
});
