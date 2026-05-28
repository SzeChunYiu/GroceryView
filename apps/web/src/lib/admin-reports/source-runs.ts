import type { AdminReport } from './types';

export type SourceRunRow = {
  id: string;
  domain: string;
  source: string;
  status: string;
  accepted: number;
  rejected: number;
  deadLetters: number;
};

export function getSourceRunsReport(generatedAt = new Date().toISOString()): AdminReport<SourceRunRow> {
  return {
    title: 'Source runs',
    scaffold: true,
    sourceLabel: 'local report helper',
    nextIntegration: 'ingestion.source_runs table + scripts/ops/source-run-report.mjs',
    generatedAt,
    rows: [
      { id: 'run-openprices-daily', domain: 'grocery', source: 'openprices', status: 'succeeded', accepted: 12400, rejected: 18, deadLetters: 2 },
      { id: 'run-axfood-snapshot', domain: 'grocery', source: 'axfood', status: 'partial', accepted: 8200, rejected: 44, deadLetters: 5 }
    ]
  };
}
