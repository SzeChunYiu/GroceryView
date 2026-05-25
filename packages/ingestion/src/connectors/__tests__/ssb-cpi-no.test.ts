import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  SSB_CPI_NO_ENDPOINT,
  buildSsbCpiNoRequestBody,
  fetchSsbCpiNoExternalIndexRows,
  parseSsbCpiNoExternalIndexRows
} from '../ssb-cpi-no.js';

const OBSERVED_AT = '2026-05-25T15:30:00.000Z';

const JSON_STAT_FIXTURE = {
  id: ['Konsumgrp', 'ContentsCode', 'Tid'],
  size: [3, 1, 2],
  dimension: {
    Konsumgrp: {
      category: {
        index: { '01': 0, '01.1': 1, '07.2.2.1': 2 },
        label: {
          '01': 'Matvarer og alkoholfrie drikkevarer',
          '01.1': 'Matvarer',
          '07.2.2.1': 'Bensin'
        }
      }
    },
    ContentsCode: {
      category: {
        index: { KpiIndMnd: 0 },
        unit: { KpiIndMnd: { base: '2015=100' } }
      }
    },
    Tid: {
      category: {
        index: { '2026M03': 0, '2026M04': 1 }
      }
    }
  },
  value: [128.4, 129.1, 131.7, 132.2, 170.1, 171.2]
} as const;

describe('SSB CPI Norway external-index connector', () => {
  it('builds a JSON-stat2 request for Norwegian food CPI rows', () => {
    assert.deepEqual(buildSsbCpiNoRequestBody(12, ['01']), {
      query: [
        { code: 'Konsumgrp', selection: { filter: 'item', values: ['01'] } },
        { code: 'ContentsCode', selection: { filter: 'item', values: ['KpiIndMnd'] } },
        { code: 'Tid', selection: { filter: 'top', values: ['12'] } }
      ],
      response: { format: 'JSON-stat2' }
    });
  });

  it('parses only grocery ECOICOP rows into external_index shape', () => {
    const rows = parseSsbCpiNoExternalIndexRows(JSON_STAT_FIXTURE, OBSERVED_AT);

    assert.equal(rows.length, 4);
    assert.deepEqual(rows[0], {
      rowType: 'external_index',
      sourceId: 'SSB_CPI_NO',
      country: 'NO',
      authority: 'SSB',
      indexFamily: 'consumer_price_index',
      vertical: 'grocery',
      ecoicopCode: '01',
      label: 'Matvarer og alkoholfrie drikkevarer',
      period: '2026-03',
      value: 128.4,
      unit: '2015=100',
      sourceUrl: SSB_CPI_NO_ENDPOINT,
      observedAt: OBSERVED_AT,
      provenance: rows[0]?.provenance
    });
    assert.equal(rows.some((row) => row.ecoicopCode === '07.2.2.1'), false);
  });

  it('fetches via POST with headers and blocked-response handling', async () => {
    const requests: Array<{ input: RequestInfo | URL; init: RequestInit | undefined }> = [];
    const rows = await fetchSsbCpiNoExternalIndexRows({
      observedAt: OBSERVED_AT,
      months: 2,
      ecoicopCodes: ['01'],
      fetchImpl: async (input, init) => {
        requests.push({ input, init });
        return Response.json(JSON_STAT_FIXTURE);
      }
    });

    assert.equal(rows.length, 4);
    assert.equal(requests[0]?.init?.method, 'POST');
    assert.equal(JSON.stringify(requests[0]?.init?.headers).includes('ssb-cpi-no-connector'), true);
    assert.equal(String(requests[0]?.init?.body).includes('"values":["01"]'), true);
    await assert.rejects(
      () => fetchSsbCpiNoExternalIndexRows({ fetchImpl: async () => new Response('blocked', { status: 403 }) }),
      /blocked with HTTP 403/
    );
  });
});
