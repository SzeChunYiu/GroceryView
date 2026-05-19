export type ScanUpload = {
  kind: 'barcode' | 'receipt';
  payload: string;
  uploadedAt: string;
};

export type BarcodeLookup = {
  productId: string | null;
  barcode: string;
  confidence: number;
  needsHumanReview: boolean;
};

export type ReceiptOcrRow = {
  rawName: string;
  itemTotal: number;
  confidence: number;
};

export type ReceiptOcrResult = {
  rows: ReceiptOcrRow[];
  totalAmount: number;
  confidence: number;
};

export type ScanProviders = {
  barcode?: {
    lookup(barcode: string): Promise<BarcodeLookup>;
  };
  receiptOcr?: {
    parse(payload: string): Promise<ReceiptOcrResult>;
  };
};

export type ScanUploadTicketRequest = {
  scanId: string;
  kind: ScanUpload['kind'];
  contentType: string;
  byteLength: number;
  requestedAt: string;
};

export type ScanUploadTicket = {
  scanId: string;
  uploadUrl: string;
  payloadUri: string;
  expiresAt: string;
  maxBytes: number;
  headers: Record<string, string>;
};

export type ScanUploadStorage = {
  createUploadTicket(request: ScanUploadTicketRequest): Promise<ScanUploadTicket>;
};

export type ScanUploadTicketResult =
  | { status: 'ready'; ticket: ScanUploadTicket }
  | { status: 'failed_no_storage'; kind: ScanUpload['kind']; reason: string };

export type ScanProviderKind = keyof ScanProviders;
export type ScanProviderHealthStatus = 'pass' | 'fail' | 'not_run';

export type ScanProviderReadinessInput = {
  requiredProviders: ScanProviderKind[];
  providers: Array<{
    kind: ScanProviderKind;
    providerName: string;
    configured: boolean;
    credentialsPresent: boolean;
    healthStatus: ScanProviderHealthStatus;
  }>;
};

export type ScanProviderReadinessReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  evidence: string[];
  warnings: string[];
  summary: string;
};

export type ScanPipelineResult =
  | {
      status: 'matched';
      kind: 'barcode';
      productId: string | null;
      confidence: number;
      needsHumanReview: boolean;
    }
  | {
      status: 'parsed';
      kind: 'receipt';
      totalAmount: number;
      confidence: number;
      needsHumanReview: boolean;
      lowConfidenceRows: string[];
    }
  | {
      status: 'failed_no_provider';
      kind: ScanUpload['kind'];
      reason: string;
    };

export type MobileScanSessionItem = {
  scanId: string;
  upload: ScanUpload;
};

export type MobileScanSessionPlan = {
  status: 'ready' | 'needs_review' | 'blocked';
  runningTotal: number;
  barcodeMatches: Array<{
    scanId: string;
    productId: string | null;
    confidence: number;
    needsHumanReview: boolean;
  }>;
  receiptReviews: Array<{
    scanId: string;
    totalAmount: number;
    confidence: number;
    lowConfidenceRows: string[];
  }>;
  blockers: Array<{ scanId: string; reason: string }>;
  nextActions: Array<'continue_scanning' | 'review_matches' | 'configure_scan_provider' | 'compare_budget'>;
};

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export async function processScanUpload(input: { upload: ScanUpload; providers: ScanProviders }): Promise<ScanPipelineResult> {
  if (Number.isNaN(Date.parse(input.upload.uploadedAt))) throw new Error('uploadedAt must be an ISO date.');
  if (!input.upload.payload.trim()) throw new Error('payload is required.');

  if (input.upload.kind === 'barcode') {
    if (!input.providers.barcode) return { status: 'failed_no_provider', kind: 'barcode', reason: 'No barcode provider configured.' };
    const lookup = await input.providers.barcode.lookup(input.upload.payload);
    return {
      status: 'matched',
      kind: 'barcode',
      productId: lookup.productId,
      confidence: lookup.confidence,
      needsHumanReview: lookup.needsHumanReview || lookup.confidence < 0.8 || lookup.productId === null
    };
  }

  if (!input.providers.receiptOcr) return { status: 'failed_no_provider', kind: 'receipt', reason: 'No receipt OCR provider configured.' };
  const parsed = await input.providers.receiptOcr.parse(input.upload.payload);
  const lowConfidenceRows = parsed.rows.filter((row) => row.confidence < 0.75).map((row) => row.rawName);
  return {
    status: 'parsed',
    kind: 'receipt',
    totalAmount: parsed.totalAmount,
    confidence: parsed.confidence,
    needsHumanReview: parsed.confidence < 0.8 || lowConfidenceRows.length > 0,
    lowConfidenceRows
  };
}

export async function planMobileScanSession(input: {
  scans: MobileScanSessionItem[];
  providers: ScanProviders;
  barcodePriceLookup?: (productId: string) => number | null;
}): Promise<MobileScanSessionPlan> {
  const barcodeMatches: MobileScanSessionPlan['barcodeMatches'] = [];
  const receiptReviews: MobileScanSessionPlan['receiptReviews'] = [];
  const blockers: MobileScanSessionPlan['blockers'] = [];
  let runningTotal = 0;
  let needsReview = false;

  for (const item of input.scans) {
    const result = await processScanUpload({ upload: item.upload, providers: input.providers });

    if (result.status === 'failed_no_provider') {
      blockers.push({ scanId: item.scanId, reason: result.reason });
      continue;
    }

    if (result.kind === 'barcode') {
      barcodeMatches.push({
        scanId: item.scanId,
        productId: result.productId,
        confidence: result.confidence,
        needsHumanReview: result.needsHumanReview
      });
      if (result.needsHumanReview) needsReview = true;
      if (result.productId && input.barcodePriceLookup) {
        runningTotal = roundMoney(runningTotal + (input.barcodePriceLookup(result.productId) ?? 0));
      }
      continue;
    }

    receiptReviews.push({
      scanId: item.scanId,
      totalAmount: result.totalAmount,
      confidence: result.confidence,
      lowConfidenceRows: result.lowConfidenceRows
    });
    runningTotal = roundMoney(runningTotal + result.totalAmount);
    if (result.needsHumanReview) needsReview = true;
  }

  const nextActions: MobileScanSessionPlan['nextActions'] = [];
  if (blockers.length > 0) nextActions.push('configure_scan_provider');
  if (needsReview) nextActions.push('review_matches');
  if (runningTotal > 0) nextActions.push('compare_budget');
  if (blockers.length === 0) nextActions.push('continue_scanning');

  return {
    status: blockers.length > 0 ? 'blocked' : needsReview ? 'needs_review' : 'ready',
    runningTotal,
    barcodeMatches,
    receiptReviews,
    blockers,
    nextActions
  };
}
