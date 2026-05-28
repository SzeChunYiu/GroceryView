import { generatedReportLabel } from './types';

export type SourceRunRow = {
  id: string;
  domain: string;
  source: string;
  status: string;
  accepted: number;
  rejected: number;
  deadLetters: number;
};

export type SourceRunDetail = {
  qualityStatus: string;
  publishDecision: string;
  rawRecords: number;
  deadLetters: number;
  deadLetterNote: string;
};

const RUNS: SourceRunRow[] = [
  { id: 'run-openprices-daily', domain: 'grocery', source: 'openprices', status: 'succeeded', accepted: 12400, rejected: 18, deadLetters: 2 },
  { id: 'run-axfood-snapshot', domain: 'grocery', source: 'axfood', status: 'partial', accepted: 8200, rejected: 44, deadLetters: 5 }
];

const DETAILS: Record<string, SourceRunDetail> = {
  'run-openprices-daily': {
    qualityStatus: 'pass',
    publishDecision: 'published',
    rawRecords: 12418,
    deadLetters: 2,
    deadLetterNote: 'GTIN normalization retries queued'
  },
  'run-axfood-snapshot': {
    qualityStatus: 'warn',
    publishDecision: 'held',
    rawRecords: 8244,
    deadLetters: 5,
    deadLetterNote: 'Category slug drift requires operator review'
  }
};

export function getSourceRunsReport() {
  return {
    label: generatedReportLabel('scripts/ops/source-run-report.mjs', 'Set DATABASE_URL for live source_runs, raw_records, and lineage_events evidence.'),
    rows: RUNS
  };
}

export function getSourceRunDetail(id: string): SourceRunDetail | null {
  return DETAILS[id] ?? null;
}
