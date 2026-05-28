import type { AdminReport } from './types';

export type DataQualityRow = {
  gate: string;
  status: string;
  blocking: boolean;
  detail: string;
};

export function getDataQualityReport(generatedAt = new Date().toISOString()): AdminReport<DataQualityRow> {
  return {
    title: 'Data quality gates',
    scaffold: true,
    sourceLabel: 'local report helper',
    nextIntegration: 'docs/data/quality-gates.md checks + scripts/ops/check-gold-publish-gate.mjs',
    generatedAt,
    rows: [
      { gate: 'freshness_sla', status: 'pass', blocking: false, detail: 'Snapshot within 24h for SE grocery connectors' },
      { gate: 'duplicate_gtin', status: 'warn', blocking: false, detail: '12 duplicate GTIN candidates queued for dedup review' },
      { gate: 'gold_publish', status: 'hold', blocking: true, detail: 'Publish blocked until quality-report passes with --strict' }
    ]
  };
}
