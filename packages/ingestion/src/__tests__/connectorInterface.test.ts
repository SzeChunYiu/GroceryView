import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertConnectorConformance,
  validateConnectorConformance,
  type ConnectorNormalizedRow
} from '../connectors/connector-interface.js';

const CHECKED_AT = '2026-05-25T18:00:00.000Z';

function row(input: Partial<ConnectorNormalizedRow> & Pick<ConnectorNormalizedRow, 'id' | 'chainId' | 'countryCode' | 'currency' | 'productName' | 'sourceUrl'>): ConnectorNormalizedRow {
  const parserVersion = `${input.chainId}-contract-v1`;
  const retrievedAt = input.retrievedAt ?? '2026-05-25T17:30:00.000Z';
  const rawSnapshotRef = input.rawSnapshotRef ?? `raw://${input.chainId}/${input.id}.json`;
  return {
    sourceType: 'retailer_online_page',
    categoryId: 'contract-sample',
    price: null,
    unit: 'metadata',
    parserVersion,
    rawSnapshotRef,
    retrievedAt,
    lineage: {
      parserVersion,
      rawSnapshotRef,
      sourceUrl: input.sourceUrl,
      retrievedAt,
      evidenceText: 'connector contract fixture evidence'
    },
    ...input
  };
}

describe('connector interface conformance', () => {
  it('accepts Sweden, Norway, and Iceland connector rows with lineage, units, and freshness evidence', () => {
    const cases = [
      {
        connectorId: 'willys-se',
        countryCode: 'SE' as const,
        currency: 'SEK' as const,
        parserVersion: 'willys-se-contract-v1',
        rows: [row({
          id: 'willys-se-contract-row',
          chainId: 'willys-se',
          countryCode: 'SE',
          currency: 'SEK',
          productName: 'Willys Sweden connector contract row',
          sourceUrl: 'https://www.willys.se/'
        })]
      },
      {
        connectorId: 'best-no',
        countryCode: 'NO' as const,
        currency: 'NOK' as const,
        parserVersion: 'best-no-contract-v1',
        rows: [row({
          id: 'best-no-contract-row',
          chainId: 'best-no',
          countryCode: 'NO',
          currency: 'NOK',
          productName: 'Best Norway connector contract row',
          sourceUrl: 'https://beststasjon.no/'
        })]
      },
      {
        connectorId: 'bonus-is',
        countryCode: 'IS' as const,
        currency: 'ISK' as const,
        parserVersion: 'bonus-is-contract-v1',
        rows: [row({
          id: 'bonus-is-contract-row',
          chainId: 'bonus-is',
          countryCode: 'IS',
          currency: 'ISK',
          productName: 'Bonus Iceland connector contract row',
          sourceUrl: 'https://verslun.bonus.is/'
        })]
      }
    ];

    for (const conformanceCase of cases) {
      const report = assertConnectorConformance({
        ...conformanceCase,
        now: CHECKED_AT,
        maxFreshnessAgeHours: 2,
        errors: [{
          stage: 'fetch',
          message: 'HTTP 429 blocked response is captured as retryable connector evidence',
          sourceUrl: conformanceCase.rows[0]!.sourceUrl,
          retryable: true
        }]
      });
      assert.deepEqual(report.issues, []);
      assert.equal(report.rowCount, 1);
      assert.equal(report.errorCount, 1);
    }
  });

  it('rejects missing required fields, stale rows, invalid units, bad errors, and broken lineage', () => {
    const invalid = row({
      id: '',
      chainId: 'willys-se',
      countryCode: 'SE',
      currency: 'SEK',
      productName: 'Invalid connector row',
      sourceUrl: 'not-a-url',
      price: -1,
      unit: 'bad-unit' as ConnectorNormalizedRow['unit'],
      retrievedAt: '2026-05-20T00:00:00.000Z',
      lineage: {
        parserVersion: 'other-parser',
        rawSnapshotRef: 'raw://other',
        sourceUrl: 'https://example.test/',
        retrievedAt: '2026-05-20T00:00:00.000Z'
      }
    });

    const report = validateConnectorConformance({
      connectorId: 'willys-se',
      countryCode: 'SE',
      currency: 'SEK',
      parserVersion: 'willys-se-contract-v1',
      now: CHECKED_AT,
      maxFreshnessAgeHours: 24,
      rows: [invalid],
      errors: [{ stage: 'parse', message: '', sourceUrl: 'not-a-url' }]
    });

    assert.match(report.issues.join('\n'), /rows\[0\]\.id is required/);
    assert.match(report.issues.join('\n'), /sourceUrl must be an HTTP URL/);
    assert.match(report.issues.join('\n'), /unit must be one of/);
    assert.match(report.issues.join('\n'), /price must be null or a non-negative finite number/);
    assert.match(report.issues.join('\n'), /exceeds max freshness age/);
    assert.match(report.issues.join('\n'), /lineage\.parserVersion must match/);
    assert.match(report.issues.join('\n'), /errors\[0\]\.message is required/);
  });
});
