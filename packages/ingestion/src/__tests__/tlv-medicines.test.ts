import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseTlvMedicinesCsv, TLV_MEDICINES_CRON, TLV_MEDICINES_REGISTRY_STATUS } from '../connectors/benchmarks/tlv-medicines.js';
import { benchmarkSourceRegistry } from '../connectors/benchmarks/registry.js';

describe('TLV medicines benchmark connector', () => {
  it('parses fixture rows without fabricating missing values', () => {
    const csv = 'period;pris;unit;ecoicop\n2026-01;123,45;SEK regulated_reference;06.1.1\n2026-02;;SEK regulated_reference;06.1.1\n';
    const rows = parseTlvMedicinesCsv(csv, '2026-05-25T00:00:00.000Z');
    assert.equal(rows.length, 1);
    assert.deepEqual(rows[0], {
      sourceId: 'TLV_MEDICINES',
      country: 'SE',
      vertical: 'pharmacy',
      ecoicopCode: '06.1.1',
      period: '2026-01',
      value: 123.45,
      unit: 'SEK regulated_reference',
      observedAt: '2026-05-25T00:00:00.000Z'
    });
    assert.equal(TLV_MEDICINES_CRON, '23 4 3 JAN,APR,JUL,OCT *');
    assert.equal(TLV_MEDICINES_REGISTRY_STATUS, 'ingestion_ready');
    assert.equal(benchmarkSourceRegistry.find((entry) => entry.sourceId === 'TLV_MEDICINES')?.status, 'ingestion_ready');
  });
});
