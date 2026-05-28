import { scaffoldLabel } from './types';

export function getDataQualityReport() {
  return {
    label: scaffoldLabel('docs/data/quality-gates.md + scripts/ops/check-gold-publish-gate.mjs'),
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
