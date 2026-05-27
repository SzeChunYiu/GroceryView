import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHagstofaCpiIsRequestBody,
  fetchHagstofaCpiIsExternalIndexRows,
  HAGSTOFA_CPI_IS_CRON,
  HAGSTOFA_CPI_IS_ENDPOINT,
  HAGSTOFA_CPI_IS_REGISTRY_STATUS,
  parseHagstofaCpiIsJsonStat
} from '../connectors/hagstofa-cpi-is.js';

const fixture = {
  id: ['Month', 'Item', 'Subindex'],
  size: [2, 2, 3],
  dimension: {
    Month: { category: { index: { '2026M03': 0, '2026M04': 1 } } },
    Item: { category: { index: { index: 0, change_M: 1 }, unit: { index: { base: 'May 1988=100' } } } },
    Subindex: {
      category: {
        index: { CP01: 0, CP011: 1, CP012: 2 },
        label: {
          CP01: '01 Food and non-alcoholic beverages',
          CP011: '011 Food',
          CP012: '012 Non-alcoholic beverages'
        }
      }
    }
  },
  value: [
    712.3, 709.4, null,
    0.4, 0.3, 0.2,
    715.8, 713.2, 704.1,
    0.5, 0.5, 0.1
  ]
};

describe('Hagstofa CPI IS external index connector', () => {
  it('parses food CPI JSON-stat rows without monthly-change or null values', () => {
    const rows = parseHagstofaCpiIsJsonStat(fixture, '2026-05-25T00:00:00.000Z');

    assert.equal(rows.length, 5);
    assert.deepEqual(rows[0], {
      rowType: 'external_index',
      sourceId: 'HAGSTOFA_CPI_IS',
      country: 'IS',
      vertical: 'grocery',
      coicopCode: 'CP01',
      coicopLabel: '01 Food and non-alcoholic beverages',
      period: '2026-03',
      value: 712.3,
      unit: 'May 1988=100',
      observedAt: '2026-05-25T00:00:00.000Z',
      sourceUrl: HAGSTOFA_CPI_IS_ENDPOINT
    });
    assert.equal(rows.some((row) => row.coicopCode === 'CP012' && row.period === '2026-03'), false);
    assert.equal(rows.some((row) => row.value === 0.4), false);
    assert.equal(HAGSTOFA_CPI_IS_CRON, '23 6 30 * *');
    assert.equal(HAGSTOFA_CPI_IS_REGISTRY_STATUS, 'ingestion_ready');
  });

  it('posts a bounded JSON-stat2 request to Hagstofa PxWeb', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const rows = await fetchHagstofaCpiIsExternalIndexRows({
      endpoint: 'https://example.test/VIS01300.px',
      observedAt: '2026-05-25T00:00:00.000Z',
      months: 2,
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init });
        return new Response(JSON.stringify(fixture), { status: 200, headers: { 'content-type': 'application/json' } });
      }
    });

    assert.equal(rows.length, 5);
    assert.equal(requests[0]?.url, 'https://example.test/VIS01300.px');
    assert.equal(requests[0]?.init?.method, 'POST');
    assert.deepEqual(JSON.parse(String(requests[0]?.init?.body)), buildHagstofaCpiIsRequestBody(2));
    assert.equal(rows[0]?.sourceUrl, 'https://example.test/VIS01300.px');
  });
});
