export type ReceiptOcrCanonicalProduct = {
  productId: string;
  name: string;
  aliases?: string[];
};

export type ReceiptOcrInput = {
  userId: string;
  receiptId?: string;
  ocrText: string;
  uploadedAt: string;
  products?: ReceiptOcrCanonicalProduct[];
};

export type ReceiptOcrLineItem = {
  rawName: string;
  quantity?: number;
  unit?: string;
  itemTotal: number;
  canonicalProductId: string | null;
  matchConfidence: number;
};

export type PurchaseHistoryEntry = {
  userId: string;
  receiptId: string;
  productId: string;
  rawName: string;
  purchasedAt: string;
  chain: string;
  store: string;
  quantity: number;
  unit: string;
  paidPrice: number;
  source: 'receipt_ocr';
};

export type ReceiptOcrParseResult = {
  receiptId: string;
  userId: string;
  chain: string;
  store: string;
  purchasedAt: string;
  lineItems: ReceiptOcrLineItem[];
  totalAmount: number;
  matchedCount: number;
  purchaseHistoryAppend: {
    table: 'user.purchase_history';
    entries: PurchaseHistoryEntry[];
  };
  guardrails: string[];
};

const defaultProducts: ReceiptOcrCanonicalProduct[] = [
  { productId: 'coffee', name: 'Zoégas Coffee 450g', aliases: ['zoegas', 'zoégas', 'kaffe', 'coffee'] },
  { productId: 'milk', name: 'Milk 1 l', aliases: ['mjolk', 'mjölk', 'milk'] },
  { productId: 'butter', name: 'Butter 500g', aliases: ['smor', 'smör', 'butter'] },
  { productId: 'cheese', name: 'Cheese 500g', aliases: ['ost', 'cheese'] },
  { productId: 'banana', name: 'Banana 1kg', aliases: ['banan', 'banana'] }
];

const knownChains = ['willys', 'hemköp', 'hemkop', 'ica', 'coop', 'lidl', 'mathem'];

export function parseReceiptOcr(input: ReceiptOcrInput): ReceiptOcrParseResult {
  if (!input.userId.trim()) throw new Error('userId is required.');
  if (!input.ocrText.trim()) throw new Error('ocrText is required.');
  if (!Number.isFinite(Date.parse(input.uploadedAt))) throw new Error('uploadedAt must be an ISO timestamp.');

  const receiptId = input.receiptId?.trim() || `receipt-${Date.parse(input.uploadedAt)}`;
  const lines = input.ocrText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const chain = detectChain(lines);
  const store = detectStore(lines, chain);
  const purchasedAt = detectPurchasedAt(lines) ?? input.uploadedAt;
  const lineItems = lines
    .map((line) => parseReceiptLine(line, input.products ?? defaultProducts))
    .filter((line): line is ReceiptOcrLineItem => line !== null);
  const totalAmount = detectTotal(lines) ?? roundMoney(lineItems.reduce((sum, line) => sum + line.itemTotal, 0));
  const entries = lineItems
    .filter((line): line is ReceiptOcrLineItem & { canonicalProductId: string } => line.canonicalProductId !== null)
    .map((line) => ({
      userId: input.userId,
      receiptId,
      productId: line.canonicalProductId,
      rawName: line.rawName,
      purchasedAt,
      chain,
      store,
      quantity: line.quantity ?? 1,
      unit: line.unit ?? 'st',
      paidPrice: line.itemTotal,
      source: 'receipt_ocr' as const
    }));

  return {
    receiptId,
    userId: input.userId,
    chain,
    store,
    purchasedAt,
    lineItems,
    totalAmount,
    matchedCount: entries.length,
    purchaseHistoryAppend: {
      table: 'user.purchase_history',
      entries
    },
    guardrails: [
      'Only matched OCR receipt lines append to user.purchase_history.',
      'Unmatched or low-confidence rows remain visible for review instead of updating canonical products.',
      'The original receipt image stays private; purchase history stores normalized line metadata only.'
    ]
  };
}

export function appendReceiptOcrToPurchaseHistory(existing: PurchaseHistoryEntry[], receipt: ReceiptOcrParseResult): PurchaseHistoryEntry[] {
  const seen = new Set(existing.map((entry) => `${entry.receiptId}:${entry.productId}:${entry.rawName}`));
  const next = [...existing];
  for (const entry of receipt.purchaseHistoryAppend.entries) {
    const key = `${entry.receiptId}:${entry.productId}:${entry.rawName}`;
    if (!seen.has(key)) {
      seen.add(key);
      next.push(entry);
    }
  }
  return next;
}

function parseReceiptLine(line: string, products: ReceiptOcrCanonicalProduct[]): ReceiptOcrLineItem | null {
  if (/\b(summa|total|moms|kort|visa|mastercard|org\.?nr|kvitto|datum)\b/i.test(line)) return null;
  const match = line.match(/^(.+?)\s+(-?\d+[,.]\d{2})\s*(?:kr|sek)?$/i);
  if (!match) return null;
  const rawName = match[1]!.replace(/\s+(?:kr|sek)$/i, '').trim();
  const itemTotal = parseMoney(match[2]!);
  if (itemTotal <= 0 || rawName.length < 2) return null;
  const quantity = rawName.match(/\b(\d+(?:[,.]\d+)?)\s*(kg|g|l|ml|st)\b/i);
  const productMatch = matchProduct(rawName, products);
  return {
    rawName,
    ...(quantity ? { quantity: Number(quantity[1]!.replace(',', '.')), unit: quantity[2]!.toLowerCase() } : {}),
    itemTotal,
    canonicalProductId: productMatch.productId,
    matchConfidence: productMatch.confidence
  };
}

function matchProduct(rawName: string, products: ReceiptOcrCanonicalProduct[]): { productId: string | null; confidence: number } {
  const normalized = normalize(rawName);
  let best: { productId: string | null; confidence: number } = { productId: null, confidence: 0 };
  for (const product of products) {
    const terms = [product.name, ...(product.aliases ?? [])].map(normalize).filter(Boolean);
    for (const term of terms) {
      const confidence = normalized.includes(term) || term.includes(normalized) ? Math.min(0.98, 0.72 + term.length / 50) : sharedTokenConfidence(normalized, term);
      if (confidence > best.confidence) best = { productId: product.productId, confidence: roundConfidence(confidence) };
    }
  }
  return best.confidence >= 0.72 ? best : { productId: null, confidence: roundConfidence(best.confidence) };
}

function detectChain(lines: string[]): string {
  const joined = normalize(lines.slice(0, 8).join(' '));
  const chain = knownChains.find((candidate) => joined.includes(normalize(candidate)));
  return chain ? (chain === 'hemkop' ? 'hemköp' : chain) : 'unknown';
}

function detectStore(lines: string[], chain: string): string {
  const storeLine = lines.find((line) => /\b(butik|store|odenplan|sveavägen|sveavagen|city|centrum)\b/i.test(line));
  return storeLine ?? chain;
}

function detectPurchasedAt(lines: string[]): string | null {
  for (const line of lines) {
    const iso = line.match(/\b(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2})(?::\d{2})?)?\b/);
    if (iso) return `${iso[1]}T${iso[2] ?? '00:00'}:00.000Z`;
    const nordic = line.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{2}:\d{2}))?\b/);
    if (nordic) return `${nordic[3]}-${nordic[2]!.padStart(2, '0')}-${nordic[1]!.padStart(2, '0')}T${nordic[4] ?? '00:00'}:00.000Z`;
  }
  return null;
}

function detectTotal(lines: string[]): number | null {
  for (const line of [...lines].reverse()) {
    const total = line.match(/\b(?:summa|total)\b.*?(\d+[,.]\d{2})/i);
    if (total) return parseMoney(total[1]!);
  }
  return null;
}

function parseMoney(value: string): number {
  return roundMoney(Number(value.replace(',', '.')));
}

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Invalid receipt amount.');
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundConfidence(value: number): number {
  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sharedTokenConfidence(left: string, right: string): number {
  const leftTokens = new Set(left.split(' ').filter((token) => token.length >= 3));
  const rightTokens = right.split(' ').filter((token) => token.length >= 3);
  if (leftTokens.size === 0 || rightTokens.length === 0) return 0;
  const shared = rightTokens.filter((token) => leftTokens.has(token)).length;
  return shared / Math.max(leftTokens.size, rightTokens.length);
}
