export type ScanHistoryCorrectionStatus = 'none' | 'pending' | 'accepted' | 'rejected';
export type ScanHistoryStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type ScanHistoryRedactedMetadata = {
  retailerName?: string;
  storeName?: string;
  receiptIssuedAt?: string;
  imageSha256Prefix?: string;
  redactedFields: Array<'rawImageUrl' | 'ocrText' | 'paymentCardLast4' | 'loyaltyId'>;
};

export type ScanHistoryRow = {
  id: string;
  scanId: string;
  uploadedAt: string;
  status: ScanHistoryStatus;
  correctionStatus: ScanHistoryCorrectionStatus;
  itemCount: number;
  matchedItemCount: number;
  total?: { amount: number; currency: 'SEK' };
  metadata: ScanHistoryRedactedMetadata;
};

export type ScanHistoryResponse = {
  generatedAt: string;
  rows: ScanHistoryRow[];
  nextCursor?: string;
};

export type PremiumScanHistoryEntitlementError = {
  code: 'premium_required' | 'premium_scan_history_unavailable';
  message: string;
  requiredEntitlement: 'premium_scan_history';
};

export const scanHistoryEndpoint = '/api/scans/history';

export type ScanHistoryFetchResult =
  | { ok: true; data: ScanHistoryResponse }
  | { ok: false; error: PremiumScanHistoryEntitlementError };

export async function fetchScanHistoryResult(fetcher: typeof fetch = fetch): Promise<ScanHistoryFetchResult> {
  const response = await fetcher(scanHistoryEndpoint, { headers: { accept: 'application/json' } });
  if (response.status === 403) {
    return { ok: false, error: await response.json() as PremiumScanHistoryEntitlementError };
  }
  if (!response.ok) throw new Error(`Scan history request failed with status ${response.status}`);
  return { ok: true, data: await response.json() as ScanHistoryResponse };
}

export async function fetchScanHistory(fetcher: typeof fetch = fetch): Promise<ScanHistoryResponse> {
  const result = await fetchScanHistoryResult(fetcher);
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
