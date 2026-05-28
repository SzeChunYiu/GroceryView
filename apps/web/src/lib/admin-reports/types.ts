export type AdminReportRow = Record<string, string | number | boolean | null | undefined>;

export type AdminReport<T extends AdminReportRow = AdminReportRow> = Readonly<{
  title: string;
  scaffold: true;
  sourceLabel: string;
  nextIntegration: string;
  generatedAt: string;
  rows: readonly T[];
}>;

export const ADMIN_SCAFFOLD_BANNER = {
  eyebrow: 'Backstage scaffold',
  source: 'Source: local report helper',
} as const;
