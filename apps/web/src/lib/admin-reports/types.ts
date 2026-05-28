import type { AdminReportScaffoldLabel } from '@/lib/admin-backstage-scaffold';

export function scaffoldLabel(nextIntegration: string): AdminReportScaffoldLabel {
  return {
    mode: 'scaffold',
    status: 'scaffold',
    source: 'local report helper',
    nextIntegration
  };
}

export function generatedReportLabel(source: string, nextIntegration: string): AdminReportScaffoldLabel {
  return {
    mode: 'generated',
    status: 'generated',
    source,
    nextIntegration
  };
}
