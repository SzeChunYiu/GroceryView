export type ScannerHistoryRow = {
  id: string;
  createdAt: string;
  kind: 'receipt' | 'barcode';
  status: string;
  correctionStatus: 'none' | 'pending_review' | 'corrected' | 'rejected';
  redactedSummary: string;
  itemCount?: number;
  storeName?: string;
  totalSek?: number;
  productSlug?: string;
  compareHref?: string;
  listHref?: string;
  reportHref?: string;
};

type ScannerHistoryPayload = {
  scans?: unknown;
  rows?: unknown;
  history?: unknown;
  items?: unknown;
};

function stringField(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function optionalStringField(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function numberField(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeRow(row: unknown, index: number): ScannerHistoryRow {
  const value = row && typeof row === 'object' ? row as Record<string, unknown> : {};
  const metadata = value.redactedMetadata && typeof value.redactedMetadata === 'object'
    ? value.redactedMetadata as Record<string, unknown>
    : {};
  const createdAt = stringField(value.createdAt ?? value.created_at ?? value.scannedAt ?? value.capturedAt, 'Timestamp redacted');
  const kind = stringField(value.kind ?? value.scanKind, 'receipt') === 'barcode' ? 'barcode' : 'receipt';
  const status = stringField(value.status, 'processed');
  const lowConfidenceRowCount = numberField(value.lowConfidenceRowCount) ?? (
    Array.isArray(value.lowConfidenceRows) ? value.lowConfidenceRows.length : undefined
  );
  const correctionStatus = optionalStringField(value.correctionStatus) ?? (lowConfidenceRowCount ? 'pending_review' : 'none');
  const productSlug = optionalStringField(metadata.productSlug ?? value.productSlug ?? value.product_slug ?? value.slug);
  const productParam = productSlug ? encodeURIComponent(productSlug) : undefined;

  return {
    id: stringField(value.id ?? value.scanId, `scan-${index}`),
    createdAt,
    kind,
    status,
    correctionStatus: ['pending_review', 'corrected', 'rejected'].includes(correctionStatus) ? correctionStatus as ScannerHistoryRow['correctionStatus'] : 'none',
    redactedSummary: stringField(value.redactedSummary ?? value.summary, 'Signed-in scan row available; raw receipt text and payload metadata stay redacted.'),
    itemCount: numberField(metadata.itemCount ?? value.itemCount ?? value.item_count),
    storeName: stringField(metadata.storeName ?? value.storeName ?? value.store_name, 'Store redacted'),
    totalSek: numberField(metadata.totalSek ?? value.totalSek ?? value.total_sek ?? value.totalAmount ?? value.total),
    productSlug,
    compareHref: optionalStringField(metadata.compareHref ?? value.compareHref ?? value.compare_href) ?? (productParam ? `/compare?product=${productParam}` : undefined),
    listHref: optionalStringField(metadata.listHref ?? value.listHref ?? value.list_href) ?? (productParam ? `/list?add=${productParam}` : undefined),
    reportHref: optionalStringField(metadata.reportHref ?? value.reportHref ?? value.report_href) ?? (productParam ? `/price-reports?product=${productParam}` : undefined),
  };
}

function payloadRows(payload: ScannerHistoryPayload) {
  if (Array.isArray(payload.scans)) return payload.scans;
  if (Array.isArray(payload.rows)) return payload.rows;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.history)) return payload.history;
  return [];
}

export async function fetchScannerHistory({
  accessToken,
  userId,
  signal,
}: {
  accessToken: string;
  userId: string;
  signal?: AbortSignal;
}) {
  const response = await fetch(`/api/scans/history?userId=${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
    signal,
  });

  if (!response.ok) throw new Error('Unable to load signed-in scanner history');

  const payload = await response.json() as ScannerHistoryPayload;
  return payloadRows(payload).map(normalizeRow);
}
