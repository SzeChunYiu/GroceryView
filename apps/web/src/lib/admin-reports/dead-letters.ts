import type { AdminReport } from './types';

export type DeadLetterRow = {
  id: string;
  source: string;
  reason: string;
  observedAt: string;
  retryable: boolean;
};

export function getDeadLettersReport(generatedAt = new Date().toISOString()): AdminReport<DeadLetterRow> {
  return {
    title: 'Dead letters',
    scaffold: true,
    sourceLabel: 'local report helper',
    nextIntegration: 'ingestion.dead_letter_queue + scripts/ops/quality-report.mjs',
    generatedAt,
    rows: [
      { id: 'dl-axfood-001', source: 'axfood', reason: 'schema_version_mismatch', observedAt: generatedAt, retryable: true },
      { id: 'dl-op-014', source: 'openprices', reason: 'missing_gtin', observedAt: generatedAt, retryable: false }
    ]
  };
}
