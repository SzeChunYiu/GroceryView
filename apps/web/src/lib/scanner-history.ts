export type ScannerHistoryRow = {
  id: string;
  createdAt: string;
  kind: string;
  status: string;
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
  const createdAt = stringField(value.createdAt ?? value.created_at ?? value.scannedAt, 'Timestamp redacted');
  const kind = stringField(value.kind ?? value.scanKind, 'receipt');
  const status = stringField(value.status, 'processed');
  const productSlug = optionalStringField(value.productSlug ?? value.product_slug ?? value.slug);
  const productParam = productSlug ? encodeURIComponent(productSlug) : undefined;

  return {
    id: stringField(value.id ?? value.scanId, `scan-${index}`),
    createdAt,
    kind,
    status,
    redactedSummary: stringField(value.redactedSummary ?? value.summary, 'Signed-in scan row available; private receipt details stay redacted.'),
    itemCount: numberField(value.itemCount ?? value.item_count),
    storeName: stringField(value.storeName ?? value.store_name, 'Store redacted'),
    totalSek: numberField(value.totalSek ?? value.total_sek ?? value.total),
    productSlug,
    compareHref: optionalStringField(value.compareHref ?? value.compare_href) ?? (productParam ? `/compare?product=${productParam}` : undefined),
    listHref: optionalStringField(value.listHref ?? value.list_href) ?? (productParam ? `/list?add=${productParam}` : undefined),
    reportHref: optionalStringField(value.reportHref ?? value.report_href) ?? (productParam ? `/price-reports?product=${productParam}` : undefined),
  };
}

function payloadRows(payload: ScannerHistoryPayload) {
  if (Array.isArray(payload.scans)) return payload.scans;
  if (Array.isArray(payload.rows)) return payload.rows;
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
