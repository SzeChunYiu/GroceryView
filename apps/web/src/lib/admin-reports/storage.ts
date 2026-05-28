import { scaffoldLabel } from './types';

export function getStorageReport() {
  return {
    label: scaffoldLabel('scripts/ops/db-size-report.mjs + object storage inventory'),
    rows: [
      { name: 'price_observations', sizeGb: 42.5, indexGb: 8.1, retentionNote: '400d rolling partitions' },
      { name: 'ingestion_raw', sizeGb: 18.2, indexGb: 2.4, retentionNote: '90d bronze retention' },
      { name: 'product_images', sizeGb: 6.4, indexGb: 0.8, retentionNote: 'CDN cache + metadata only' }
    ]
  };
}
