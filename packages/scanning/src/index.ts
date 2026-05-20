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

export type ScanReviewPriority = 'high' | 'medium' | 'low';

export type ScanReviewWorkItem = {
  id: string;
  scanId: string;
  kind: ScanUpload['kind'];
  priority: ScanReviewPriority;
  reason: string;
  evidence: string[];
};

export type ScanReviewWorkItemInput = {
  scanId: string;
  result: ScanPipelineResult;
};

const scanReviewPriorityRank: Record<ScanReviewPriority, number> = { high: 0, medium: 1, low: 2 };

function priorityForScanConfidence(confidence: number): ScanReviewPriority {
  if (confidence < 0.5) return 'high';
  if (confidence < 0.8) return 'medium';
  return 'low';
}

function validateScanConfidence(confidence: number, label: string): void {
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error(`${label} must be a number between 0 and 1.`);
  }
}

export function planScanReviewWorkItems(scans: ScanReviewWorkItemInput[]): ScanReviewWorkItem[] {
  const items: ScanReviewWorkItem[] = [];

  for (const scan of scans) {
    if (!scan.scanId.trim()) throw new Error('scanId is required.');

    if (scan.result.status === 'matched') {
      validateScanConfidence(scan.result.confidence, 'barcode confidence');
      if (!scan.result.needsHumanReview) continue;

      const evidence = [`confidence:${scan.result.confidence}`];
      if (scan.result.productId === null) evidence.push('product_match:missing');

      items.push({
        id: `scan-review-${scan.scanId}`,
        scanId: scan.scanId,
        kind: 'barcode',
        priority: scan.result.productId === null ? 'high' : priorityForScanConfidence(scan.result.confidence),
        reason:
          scan.result.productId === null
            ? 'Barcode lookup did not resolve to a product.'
            : `Barcode lookup needs review at confidence ${scan.result.confidence}.`,
        evidence
      });
      continue;
    }

    if (scan.result.status === 'parsed') {
      validateScanConfidence(scan.result.confidence, 'receipt confidence');
      if (!scan.result.needsHumanReview) continue;

      items.push({
        id: `scan-review-${scan.scanId}`,
        scanId: scan.scanId,
        kind: 'receipt',
        priority: scan.result.lowConfidenceRows.length > 0 ? 'high' : priorityForScanConfidence(scan.result.confidence),
        reason:
          scan.result.lowConfidenceRows.length > 0
            ? `Receipt has ${scan.result.lowConfidenceRows.length} low-confidence rows.`
            : `Receipt OCR needs review at confidence ${scan.result.confidence}.`,
        evidence: [`confidence:${scan.result.confidence}`, `total:${scan.result.totalAmount}`, ...scan.result.lowConfidenceRows.map((row) => `low_confidence_row:${row}`)]
      });
    }
  }

  return items.sort((left, right) => scanReviewPriorityRank[left.priority] - scanReviewPriorityRank[right.priority] || left.id.localeCompare(right.id));
}

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
