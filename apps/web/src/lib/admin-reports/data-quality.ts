import { generatedReportLabel } from './types';

export function getDataQualityReport() {
  return {
    label: generatedReportLabel('scripts/ops/quality-report.mjs + scripts/ops/check-gold-publish-gate.mjs', 'Set DATABASE_URL for live quality_checks and gold publish evidence.'),
    gates: [
      { id: 'freshness_sla', severity: 'critical' as const, label: 'Freshness SLA', status: 'pass' },
      { id: 'duplicate_gtin', severity: 'warning' as const, label: 'Duplicate GTIN rate', status: 'warn' },
      { id: 'gold_publish', severity: 'critical' as const, label: 'Gold publish gate', status: 'hold' }
    ],
    freshness: {
      label: 'Observation freshness',
      percentWithinSla: 94,
      windowHours: 24
    }
  };
}
