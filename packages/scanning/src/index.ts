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
