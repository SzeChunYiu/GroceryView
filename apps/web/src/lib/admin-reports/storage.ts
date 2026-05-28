import { generatedReportLabel } from './types';

export function getStorageReport() {
  return {
    label: generatedReportLabel('scripts/ops/db-size-report.mjs + scripts/ops/db-index-health.mjs', 'Set DATABASE_URL for live DB health, index health, partition, and retention evidence.'),
    rows: [
      { name: 'price_observations', sizeGb: 42.5, indexGb: 8.1, retentionNote: '400d rolling partitions' },
      { name: 'ingestion_raw', sizeGb: 18.2, indexGb: 2.4, retentionNote: '90d bronze retention' },
      { name: 'product_images', sizeGb: 6.4, indexGb: 0.8, retentionNote: 'CDN cache + metadata only' }
    ]
  };
}
