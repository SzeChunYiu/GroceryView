import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  nomaMedicineRowsToBenchmarkObservations,
  parseNomaMedicinesWorksheetRows
} from '../connectors/benchmarks/noma-medicines.js';
import { nomaMedicineWorksheetFixture } from '../connectors/benchmarks/__fixtures__/noma-medicines.js';

describe('NoMA medicines benchmark connector', () => {
  it('emits only cited regulated reference values from the fixture worksheet', () => {
    const rows = parseNomaMedicinesWorksheetRows(nomaMedicineWorksheetFixture, {
      observedAt: '2026-05-24T00:00:00.000Z',
      sourceUrl: 'https://www.dmp.no/contentassets/fed1be54a81f4ec99a2329ca0fd0964c/package-prices-2026-05-04.xlsx'
    });

    assert.equal(rows.length, 3);
    assert.deepEqual(rows.map((row) => row.priceKind), ['ppp', 'prp', 'stepped_price']);
    assert.equal(rows[0]?.period, '2026-05-04');
    assert.equal(rows[0]?.value, 86.56);

    const observations = nomaMedicineRowsToBenchmarkObservations(rows);
    assert.deepEqual(observations[0], {
      source_id: 'NOMA_MEDICINES',
      country: 'NO',
      vertical: 'pharmacy',
      ecoicop_code: 'NOMA:A10BA02:123456:ppp',
      period: '2026-05-04',
      value: 86.56,
      unit: 'NOK regulated_reference_ppp',
      observed_at: '2026-05-24T00:00:00.000Z'
    });
  });
});
