import type { AdminReportScaffoldLabel } from '@/lib/admin-backstage-scaffold';

export function scaffoldLabel(nextIntegration: string): AdminReportScaffoldLabel {
  return {
    mode: 'scaffold',
    source: 'local report helper',
    nextIntegration
  };
}
