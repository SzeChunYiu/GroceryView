import type { AdminReport } from './types';

export type StorageRow = {
  object: string;
  sizeGb: number;
  growth7dPct: number;
  retentionDays: number;
};

export function getStorageReport(generatedAt = new Date().toISOString()): AdminReport<StorageRow> {
  return {
    title: 'Storage footprint',
    scaffold: true,
    sourceLabel: 'local report helper',
    nextIntegration: 'scripts/ops/db-size-report.mjs + object storage inventory',
    generatedAt,
    rows: [
      { object: 'price_observations', sizeGb: 42.5, growth7dPct: 2.1, retentionDays: 400 },
      { object: 'ingestion_raw', sizeGb: 18.2, growth7dPct: 4.8, retentionDays: 90 },
      { object: 'product_images', sizeGb: 6.4, growth7dPct: 0.9, retentionDays: 365 }
    ]
  };
}
