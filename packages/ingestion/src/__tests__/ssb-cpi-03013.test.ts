import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSsbCpi03013RequestBody,
  fetchSsbCpi03013BenchmarkObservations,
  parseSsbCpi03013JsonStat,
  SSB_CPI_03013_CRON,
  SSB_CPI_03013_REGISTRY_STATUS
} from '../connectors/benchmarks/ssb-cpi-03013.js';
import { benchmarkSourceRegistry } from '../connectors/benchmarks/registry.js';

const fixture = {
  id: ['Konsumgrp', 'ContentsCode', 'Tid'],
  size: [3, 1, 2],
  dimension: {
    Konsumgrp: { category: { index: { '01': 0, '06.1.1': 1, '07.2.2.1': 2 }, label: { '01': 'Matvarer og alkoholfrie drikkevarer', '06.1.1': 'Legemidler', '07.2.2.1': 'Diesel' } } },
    ContentsCode: { category: { index: { KpiIndMnd: 0 }, unit: { KpiIndMnd: { base: 'indeks' } } } },
    Tid: { category: { index: { '2025M11': 0, '2025M12': 1 }, label: { '2025M11': '2025M11', '2025M12': '2025M12' } } }
  },
  value: [141.6, null, 132.2, 133, 159.6, 160.6]
};

describe('SSB CPI 03013 benchmark connector', () => {
  it('parses JSON-stat CPI rows without fabricating missing values', () => {
    const rows = parseSsbCpi03013JsonStat(fixture, '2026-05-25T00:00:00.000Z');
    assert.equal(rows.length, 5);
    assert.deepEqual(rows[0], {
      sourceId: 'SSB_CPI_03013',
      country: 'NO',
      vertical: 'grocery',
      ecoicopCode: '01',
      period: '2025-11',
      value: 141.6,
      unit: 'indeks',
      observedAt: '2026-05-25T00:00:00.000Z'
    });
    assert.equal(rows.some((row) => row.ecoicopCode === '01' && row.period === '2025-12'), false);
    assert.equal(rows.find((row) => row.ecoicopCode === '06.1.1')?.vertical, 'pharmacy');
    assert.equal(rows.find((row) => row.ecoicopCode === '07.2.2.1')?.vertical, 'fuel');
    assert.equal(SSB_CPI_03013_CRON, '17 5 12 * *');
    assert.equal(SSB_CPI_03013_REGISTRY_STATUS, 'ingestion_ready');
    assert.equal(benchmarkSourceRegistry.find((entry) => entry.sourceId === 'SSB_CPI_03013')?.status, 'ingestion_ready');
  });

  it('posts the bounded JSON-stat request to SSB', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const rows = await fetchSsbCpi03013BenchmarkObservations({
      endpoint: 'https://example.test/03013',
      observedAt: '2026-05-25T00:00:00.000Z',
      months: 2,
      fetchImpl: async (url, init) => {
        requests.push({ url: String(url), init });
        return new Response(JSON.stringify(fixture), { status: 200, headers: { 'content-type': 'application/json' } });
      }
    });

    assert.equal(rows.length, 5);
    assert.equal(requests[0]?.url, 'https://example.test/03013');
    assert.equal(requests[0]?.init?.method, 'POST');
    assert.deepEqual(JSON.parse(String(requests[0]?.init?.body)), buildSsbCpi03013RequestBody(2));
  });
});
