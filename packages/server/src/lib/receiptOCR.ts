import type { ReceiptItemRecord, ReceiptUploadRecord } from '@groceryview/db';
import type { ReceiptOcrRow } from '@groceryview/scanning';

export type ReceiptCanonicalProduct = {
  productId: string;
  canonicalName: string;
  aliases?: string[];
};

export type ReceiptPurchaseHistoryItem = {
  productId: string;
  name: string;
  quantity: number;
  totalAmount: number;
  rawName: string;
  matchConfidence: number;
};

export type ReceiptSpendHistoryInput = {
  userId: string;
  scanId: string;
  payloadUri: string;
  uploadedAt: string;
  rows: ReceiptOcrRow[];
  totalAmount: number;
  confidence: number;
  chain?: string;
  store?: string;
  purchasedAt?: string;
  canonicalProducts?: ReceiptCanonicalProduct[];
};

function slug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9åäö]+/gi, '-').replace(/^-|-$/g, '') || 'receipt-item';
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function canonicalMatch(row: ReceiptOcrRow, products: ReceiptCanonicalProduct[] = []) {
  const normalized = normalizeName(row.rawName);
  const match = products.find((product) => {
    const names = [product.canonicalName, ...(product.aliases ?? [])].map(normalizeName);
    return names.some((name) => name === normalized || normalized.includes(name) || name.includes(normalized));
  });

  if (match) {
    return {
      productId: match.productId,
      canonicalName: match.canonicalName,
      matchConfidence: Math.min(0.99, Math.max(row.confidence, 0.82))
    };
  }

  return {
    productId: `receipt:${slug(row.rawName)}`,
    canonicalName: row.rawName.trim(),
    matchConfidence: Math.min(row.confidence, 0.74)
  };
}

export function buildReceiptSpendHistory(input: ReceiptSpendHistoryInput) {
  const purchasedAt = input.purchasedAt ?? input.uploadedAt;
  const items: ReceiptItemRecord[] = input.rows.map((row, index) => {
    const match = canonicalMatch(row, input.canonicalProducts);
    return {
      id: `${input.scanId}-line-${index + 1}`,
      receiptId: input.scanId,
      rawName: row.rawName,
      productId: match.productId,
      canonicalName: match.canonicalName,
      quantity: 1,
      itemTotal: row.itemTotal,
      matchConfidence: match.matchConfidence
    };
  });
  const receiptUpload: ReceiptUploadRecord = {
    id: input.scanId,
    userId: input.userId,
    imageUri: input.payloadUri,
    purchasedAt,
    totalAmount: input.totalAmount,
    ocrConfidence: input.confidence,
    status: input.confidence >= 0.8 && items.every((item) => (item.matchConfidence ?? 0) >= 0.75) ? 'processed' : 'needs_review',
    createdAt: input.uploadedAt,
    updatedAt: input.uploadedAt,
    items
  };

  return {
    receiptUpload,
    receiptSummary: {
      chain: input.chain?.trim() || 'Chain not extracted',
      store: input.store?.trim() || 'Store not extracted',
      purchasedAt,
      totalAmount: input.totalAmount,
      ocrConfidence: input.confidence,
      itemCount: items.length,
      status: receiptUpload.status
    },
    purchaseHistory: items.map((item): ReceiptPurchaseHistoryItem => ({
      productId: item.productId ?? `receipt:${slug(item.rawName)}`,
      name: item.canonicalName ?? item.rawName,
      quantity: item.quantity,
      totalAmount: item.itemTotal,
      rawName: item.rawName,
      matchConfidence: item.matchConfidence ?? 0
    }))
  };
}
