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

export function buildScanProviderReadinessReport(input: ScanProviderReadinessInput): ScanProviderReadinessReport {
  const blockers: string[] = [];
  const evidence: string[] = [];
  const providersByKind = new Map(input.providers.map((provider) => [provider.kind, provider]));

  for (const kind of input.requiredProviders) {
    const provider = providersByKind.get(kind);
    if (!provider?.configured) {
      blockers.push(`scan_provider_not_configured:${kind}`);
    } else {
      evidence.push(`scan_provider_configured:${kind}:${provider.providerName}`);
    }

    if (!provider?.credentialsPresent) {
      blockers.push(`scan_provider_credentials_missing:${kind}`);
    } else {
      evidence.push(`scan_provider_credentials_present:${kind}`);
    }

    if (provider?.healthStatus === 'pass') {
      evidence.push(`scan_provider_health_pass:${kind}`);
    } else if (provider?.healthStatus === 'fail') {
      blockers.push(`scan_provider_health_failed:${kind}`);
    } else {
      blockers.push(`scan_provider_health_not_run:${kind}`);
    }
  }

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    evidence,
    warnings: [],
    summary: blockers.length === 0 ? 'Scan providers are ready.' : 'Scan provider readiness is blocked.'
  };
}

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

const allowedScanUploadContentTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

function validateScanUploadTicketRequest(request: ScanUploadTicketRequest): void {
  if (!request.scanId.trim()) throw new Error('scanId is required.');
  if (request.kind !== 'barcode' && request.kind !== 'receipt') throw new Error('kind must be barcode or receipt.');
  if (!allowedScanUploadContentTypes.has(request.contentType)) throw new Error('contentType must be an allowed scan upload type.');
  if (!Number.isInteger(request.byteLength) || request.byteLength <= 0) throw new Error('byteLength must be a positive integer.');
  if (Number.isNaN(Date.parse(request.requestedAt))) throw new Error('requestedAt must be an ISO date.');
}

function validateScanUploadTicket(ticket: ScanUploadTicket): void {
  if (!ticket.scanId.trim()) throw new Error('upload ticket scanId is required.');
  if (!ticket.uploadUrl.trim()) throw new Error('upload ticket uploadUrl is required.');
  if (!ticket.payloadUri.trim()) throw new Error('upload ticket payloadUri is required.');
  if (Number.isNaN(Date.parse(ticket.expiresAt))) throw new Error('upload ticket expiresAt must be an ISO date.');
  if (!Number.isInteger(ticket.maxBytes) || ticket.maxBytes <= 0) throw new Error('upload ticket maxBytes must be a positive integer.');
}

export async function prepareScanUploadTicket(input: {
  request: ScanUploadTicketRequest;
  storage?: ScanUploadStorage | undefined;
}): Promise<ScanUploadTicketResult> {
  validateScanUploadTicketRequest(input.request);

  if (!input.storage) {
    return {
      status: 'failed_no_storage',
      kind: input.request.kind,
      reason: 'No scan upload storage provider configured.'
    };
  }

  const ticket = await input.storage.createUploadTicket(input.request);
  validateScanUploadTicket(ticket);
  return { status: 'ready', ticket };
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


export type ReceiptAliasGrowthRow = ReceiptOcrRow & {
  quantityText?: string;
};

export type ReceiptAliasGrowthReceipt = {
  scanId: string;
  chainLabel: string;
  observedAt: string;
  rows: ReceiptAliasGrowthRow[];
};

export type ReceiptAliasGrowthRejectedRow = {
  scanId: string;
  rawName: string;
  reason:
    | 'chain_label_required'
    | 'observed_at_required'
    | 'receipt_row_confidence_below_threshold'
    | 'item_total_required'
    | 'quantity_or_weight_required'
    | 'alias_required';
};

export type ReceiptAliasGrowthCandidate = {
  id: string;
  scanId: string;
  chainLabel: string;
  rawName: string;
  normalizedAlias: string;
  itemTotal: number;
  quantity: number;
  comparableUnit: 'kg' | 'l' | 'st';
  unitPrice: number;
  confidence: number;
  priority: ScanReviewPriority;
  observedAt: string;
  reviewAction: 'create_commodity_alias_candidate';
  evidence: string[];
};

export type ReceiptAliasGrowthPlan = {
  status: 'review_required' | 'blocked';
  candidates: ReceiptAliasGrowthCandidate[];
  rejectedRows: ReceiptAliasGrowthRejectedRow[];
  guardrails: string[];
  summary: string;
};

const receiptQuantityPattern = /(\d+(?:[,.]\d+)?)\s*(kg|g|l|ml|st)\b/i;

function roundScanMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseReceiptQuantity(rawName: string, quantityText?: string): { quantity: number; comparableUnit: 'kg' | 'l' | 'st'; evidenceValue: string } | null {
  const source = [quantityText, rawName].filter(Boolean).join(' ');
  const match = source.match(receiptQuantityPattern);
  if (!match) return null;
  const parsedValue = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) return null;
  const unit = match[2].toLowerCase();
  if (unit === 'kg') return { quantity: parsedValue, comparableUnit: 'kg', evidenceValue: `${parsedValue} kg` };
  if (unit === 'g') return { quantity: roundScanMoney(parsedValue / 1000), comparableUnit: 'kg', evidenceValue: `${roundScanMoney(parsedValue / 1000)} kg` };
  if (unit === 'l') return { quantity: parsedValue, comparableUnit: 'l', evidenceValue: `${parsedValue} l` };
  if (unit === 'ml') return { quantity: roundScanMoney(parsedValue / 1000), comparableUnit: 'l', evidenceValue: `${roundScanMoney(parsedValue / 1000)} l` };
  return { quantity: parsedValue, comparableUnit: 'st', evidenceValue: `${parsedValue} st` };
}

function normalizeReceiptAlias(rawName: string): string {
  return rawName
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(receiptQuantityPattern, ' ')
    .replace(/\b(sek|kr|pris|jmf|jämförpris)\b/gi, ' ')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .toLowerCase();
}

function aliasCandidateId(scanId: string, normalizedAlias: string): string {
  const slug = normalizedAlias.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'unknown';
  return `alias-${scanId}-${slug}`;
}

function rejectReceiptAliasRow(rejectedRows: ReceiptAliasGrowthRejectedRow[], scanId: string, rawName: string, reason: ReceiptAliasGrowthRejectedRow['reason']): void {
  rejectedRows.push({ scanId, rawName, reason });
}

export function planReceiptAliasGrowth(input: { receipts: ReceiptAliasGrowthReceipt[]; minimumConfidence?: number }): ReceiptAliasGrowthPlan {
  const minimumConfidence = input.minimumConfidence ?? 0.55;
  const candidates: ReceiptAliasGrowthCandidate[] = [];
  const rejectedRows: ReceiptAliasGrowthRejectedRow[] = [];

  for (const receipt of input.receipts) {
    if (!receipt.scanId.trim()) throw new Error('scanId is required.');
    const chainLabel = receipt.chainLabel.trim();
    const observedAtIsValid = !Number.isNaN(Date.parse(receipt.observedAt));

    for (const row of receipt.rows) {
      const rawName = row.rawName.trim();
      if (!chainLabel) {
        rejectReceiptAliasRow(rejectedRows, receipt.scanId, rawName, 'chain_label_required');
        continue;
      }
      if (!observedAtIsValid) {
        rejectReceiptAliasRow(rejectedRows, receipt.scanId, rawName, 'observed_at_required');
        continue;
      }
      validateScanConfidence(row.confidence, 'receipt row confidence');
      if (row.confidence < minimumConfidence) {
        rejectReceiptAliasRow(rejectedRows, receipt.scanId, rawName, 'receipt_row_confidence_below_threshold');
        continue;
      }
      if (!Number.isFinite(row.itemTotal) || row.itemTotal <= 0) {
        rejectReceiptAliasRow(rejectedRows, receipt.scanId, rawName, 'item_total_required');
        continue;
      }
      const quantity = parseReceiptQuantity(rawName, row.quantityText);
      if (!quantity) {
        rejectReceiptAliasRow(rejectedRows, receipt.scanId, rawName, 'quantity_or_weight_required');
        continue;
      }
      const normalizedAlias = normalizeReceiptAlias(rawName);
      if (!normalizedAlias) {
        rejectReceiptAliasRow(rejectedRows, receipt.scanId, rawName, 'alias_required');
        continue;
      }

      candidates.push({
        id: aliasCandidateId(receipt.scanId, normalizedAlias),
        scanId: receipt.scanId,
        chainLabel,
        rawName,
        normalizedAlias,
        itemTotal: roundScanMoney(row.itemTotal),
        quantity: quantity.quantity,
        comparableUnit: quantity.comparableUnit,
        unitPrice: roundScanMoney(row.itemTotal / quantity.quantity),
        confidence: row.confidence,
        priority: row.confidence < 0.8 ? 'high' : 'medium',
        observedAt: receipt.observedAt,
        reviewAction: 'create_commodity_alias_candidate',
        evidence: [
          `chain_label:${chainLabel}`,
          `item_total_sek:${roundScanMoney(row.itemTotal)}`,
          `quantity:${quantity.evidenceValue}`,
          `source:receipt_ocr`
        ]
      });
    }
  }

  candidates.sort((left, right) =>
    left.normalizedAlias.localeCompare(right.normalizedAlias) ||
    left.id.localeCompare(right.id)
  );

  return {
    status: candidates.length > 0 ? 'review_required' : 'blocked',
    candidates,
    rejectedRows,
    guardrails: [
      'Receipt-fed aliases are review candidates only; they do not update product_aliases or commodity mappings automatically.',
      'Every candidate requires chain label + kr + weight evidence before human review.',
      'Private receipt images stay out of this plan; only normalized OCR metadata is used.'
    ],
    summary: `${candidates.length} alias candidates require human review; ${rejectedRows.length} receipt rows were rejected.`
  };
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

export type OcrSpaceReceiptProviderOptions = {
  apiKey: string;
  endpoint?: string;
  fetch?: typeof fetch;
};

type OcrSpaceWord = { WordText?: string; Confidence?: number };
type OcrSpaceLine = { LineText?: string; Words?: OcrSpaceWord[] };
type OcrSpaceResult = {
  ParsedText?: string;
  TextOverlay?: { Lines?: OcrSpaceLine[] };
};
type OcrSpaceResponse = {
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ParsedResults?: OcrSpaceResult[];
};

function requiredOcrSpaceApiKey(apiKey: string): string {
  const normalized = apiKey.trim();
  if (!normalized) throw new Error('OCR_SPACE_API_KEY is required.');
  return normalized;
}

function parseReceiptMoney(value: string): number | null {
  const normalized = value.replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null;
}

function confidenceFromLine(line: OcrSpaceLine): number {
  const confidences = (line.Words ?? [])
    .map((word) => typeof word.Confidence === 'number' ? word.Confidence : null)
    .filter((confidence): confidence is number => confidence !== null);
  if (confidences.length === 0) return 0.5;
  const lowest = Math.min(...confidences);
  return Math.round(Math.max(0, Math.min(1, lowest / 100)) * 100) / 100;
}

function parseReceiptRowsFromOcrSpace(result: OcrSpaceResult): ReceiptOcrRow[] {
  const lines = result.TextOverlay?.Lines?.length
    ? result.TextOverlay.Lines.map((line) => ({ text: line.LineText ?? '', confidence: confidenceFromLine(line) }))
    : (result.ParsedText ?? '').split(/\r?\n/).map((line) => ({ text: line, confidence: 0.5 }));

  const rows: ReceiptOcrRow[] = [];
  for (const line of lines) {
    const trimmed = line.text.trim();
    if (!trimmed || /^total\b/i.test(trimmed)) continue;
    const match = trimmed.match(/^(.*?)(\d+(?:[,.]\d{2}))\s*$/);
    if (!match) continue;
    const itemTotal = parseReceiptMoney(match[2]!);
    const rawName = match[1]!.trim().replace(/\s+/g, ' ');
    if (!rawName || itemTotal === null) continue;
    rows.push({ rawName, itemTotal, confidence: line.confidence });
  }
  return rows;
}

function parseReceiptTotalFromText(text: string, fallback: number): number {
  const totalLine = text.split(/\r?\n/).find((line) => /^\s*total\b/i.test(line));
  const match = totalLine?.match(/(\d+(?:[,.]\d{2}))\s*$/);
  const total = match ? parseReceiptMoney(match[1]!) : null;
  return total ?? fallback;
}

function normalizeOcrSpaceError(response: OcrSpaceResponse): string {
  const message = Array.isArray(response.ErrorMessage) ? response.ErrorMessage.join('; ') : response.ErrorMessage;
  return message?.trim() || 'unknown OCR.space error';
}

export function createOcrSpaceReceiptProvider(options: OcrSpaceReceiptProviderOptions): NonNullable<ScanProviders['receiptOcr']> {
  const apiKey = requiredOcrSpaceApiKey(options.apiKey);
  const endpoint = options.endpoint ?? 'https://api.ocr.space/parse/image';
  const fetcher = options.fetch ?? fetch;
  return {
    async parse(payload: string): Promise<ReceiptOcrResult> {
      if (!payload.trim()) throw new Error('receipt OCR payload is required.');
      const body = new URLSearchParams({ url: payload, isOverlayRequired: 'true', scale: 'true', OCREngine: '2' });
      const response = await fetcher(endpoint, { method: 'POST', headers: { apikey: apiKey, 'content-type': 'application/x-www-form-urlencoded' }, body });
      if (!response.ok) throw new Error(`OCR.space HTTP ${response.status}`);
      const parsed = await response.json() as OcrSpaceResponse;
      if (parsed.IsErroredOnProcessing) throw new Error(`OCR.space failed: ${normalizeOcrSpaceError(parsed)}`);
      const firstResult = parsed.ParsedResults?.[0];
      if (!firstResult) throw new Error('OCR.space returned no parsed receipt text.');
      const rows = parseReceiptRowsFromOcrSpace(firstResult);
      const rowTotal = Math.round(rows.reduce((sum, row) => sum + row.itemTotal, 0) * 100) / 100;
      const totalAmount = parseReceiptTotalFromText(firstResult.ParsedText ?? '', rowTotal);
      const confidence = rows.length > 0 ? Math.round((rows.reduce((sum, row) => sum + row.confidence, 0) / rows.length) * 100) / 100 : 0;
      return { rows, totalAmount, confidence };
    }
  };
}
