import { scaffoldLabel } from './types';

export function getDeadLettersReport() {
  return {
    label: scaffoldLabel('ingestion.dead_letter_queue + scripts/ops/quality-report.mjs'),
    queueHref: '/admin/sources/dead-letters',
    rows: [
      {
        id: 'dl-axfood-001',
        sourceRunId: 'run-axfood-snapshot',
        errorClass: 'schema_version_mismatch',
        severity: 'high',
        suggestedFix: 'Bump connector schema mapping and replay batch'
      },
      {
        id: 'dl-op-014',
        sourceRunId: 'run-openprices-daily',
        errorClass: 'missing_gtin',
        severity: 'medium',
        suggestedFix: 'Route to commodity alias review queue'
      }
    ]
  };
}
