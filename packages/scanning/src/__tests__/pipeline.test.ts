import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { planScanReviewWorkItems, processScanUpload } from '../index.js';
import { planScanUploadBatch, processScanUpload } from '../index.js';

describe('planScanUploadBatch', () => {
  it('accepts unique valid uploads and rejects duplicate scan payloads', () => {
    const plan = planScanUploadBatch({
      knownFingerprints: ['barcode:0735000000001'],
      uploads: [
        { kind: 'barcode', payload: '0735000000002', uploadedAt: '2026-05-19T10:00:00.000Z' },
        { kind: 'barcode', payload: '0735000000002', uploadedAt: '2026-05-19T10:01:00.000Z' },
        { kind: 'barcode', payload: '0735000000001', uploadedAt: '2026-05-19T10:02:00.000Z' },
        { kind: 'receipt', payload: 'file://receipt.jpg', uploadedAt: '2026-05-19T10:03:00.000Z' }
      ]
    });

    assert.deepEqual(
      plan.accepted.map((item) => ({ kind: item.kind, fingerprint: item.fingerprint, status: item.status })),
      [
        { kind: 'barcode', fingerprint: 'barcode:0735000000002', status: 'accepted' },
        { kind: 'receipt', fingerprint: 'receipt:file://receipt.jpg', status: 'accepted' }
      ]
    );
    assert.deepEqual(
      plan.rejected.map((item) => ({ fingerprint: item.fingerprint, reason: item.reason })),
      [
        { fingerprint: 'barcode:0735000000002', reason: 'duplicate_payload' },
        { fingerprint: 'barcode:0735000000001', reason: 'duplicate_payload' }
      ]
    );
  });

  it('rejects empty payloads and invalid upload timestamps before provider work', () => {
    const plan = planScanUploadBatch({
      uploads: [
        { kind: 'receipt', payload: ' ', uploadedAt: '2026-05-19T10:00:00.000Z' },
        { kind: 'barcode', payload: '0735000000002', uploadedAt: 'not-a-date' }
      ]
    });

    assert.equal(plan.accepted.length, 0);
    assert.deepEqual(
      plan.rejected.map((item) => item.reason),
      ['empty_payload', 'invalid_uploaded_at']
    );
  });
});

describe('processScanUpload', () => {
  it('routes barcode scans through barcode provider and returns lookup confidence', async () => {
    const result = await processScanUpload({
      upload: { kind: 'barcode', payload: '0735000123456', uploadedAt: '2026-05-19T10:00:00.000Z' },
      providers: {
        barcode: {
          lookup: async (barcode) => ({ productId: 'coffee', barcode, confidence: 0.93, needsHumanReview: false })
        }
      }
    });

    assert.deepEqual(result, {
      status: 'matched',
      kind: 'barcode',
      productId: 'coffee',
      confidence: 0.93,
      needsHumanReview: false
    });
  });

  it('routes receipt uploads through OCR provider and flags low-confidence rows for review', async () => {
    const result = await processScanUpload({
      upload: { kind: 'receipt', payload: 'file://receipt.jpg', uploadedAt: '2026-05-19T10:00:00.000Z' },
      providers: {
        receiptOcr: {
          parse: async () => ({
            rows: [
              { rawName: 'ZOEGAS 450G', itemTotal: 49.9, confidence: 0.91 },
              { rawName: 'SMUDGED ITEM', itemTotal: 12.5, confidence: 0.41 }
            ],
            totalAmount: 62.4,
            confidence: 0.66
          })
        }
      }
    });

    assert.deepEqual(result, {
      status: 'parsed',
      kind: 'receipt',
      totalAmount: 62.4,
      confidence: 0.66,
      needsHumanReview: true,
      lowConfidenceRows: ['SMUDGED ITEM']
    });
  });

  it('fails closed when the required scan provider is missing', async () => {
    const result = await processScanUpload({
      upload: { kind: 'receipt', payload: 'file://receipt.jpg', uploadedAt: '2026-05-19T10:00:00.000Z' },
      providers: {}
    });

    assert.deepEqual(result, {
      status: 'failed_no_provider',
      kind: 'receipt',
      reason: 'No receipt OCR provider configured.'
    });
  });
});

describe('prepareScanUploadTicket', () => {
  it('creates provider-backed upload tickets for private scan payload storage', async () => {
    const result = await prepareScanUploadTicket({
      request: {
        scanId: 'receipt-1',
        kind: 'receipt',
        contentType: 'image/jpeg',
        byteLength: 123456,
        requestedAt: '2026-05-20T08:00:00.000Z'
      },
      storage: {
        createUploadTicket: async (request) => ({
          scanId: request.scanId,
          uploadUrl: 'https://uploads.example/receipt-1?signature=redacted',
          payloadUri: 'private-upload://receipt-1',
          expiresAt: '2026-05-20T08:10:00.000Z',
          maxBytes: 5_000_000,
          headers: { 'content-type': request.contentType }
        })
      }
    });

    assert.deepEqual(result, {
      status: 'ready',
      ticket: {
        scanId: 'receipt-1',
        uploadUrl: 'https://uploads.example/receipt-1?signature=redacted',
        payloadUri: 'private-upload://receipt-1',
        expiresAt: '2026-05-20T08:10:00.000Z',
        maxBytes: 5_000_000,
        headers: { 'content-type': 'image/jpeg' }
      }
    });
  });

  it('fails closed when upload storage is missing or requests are unsafe', async () => {
    assert.deepEqual(
      await prepareScanUploadTicket({
        request: {
          scanId: 'receipt-2',
          kind: 'receipt',
          contentType: 'image/png',
          byteLength: 42,
          requestedAt: '2026-05-20T08:00:00.000Z'
        },
        storage: undefined
      }),
      {
        status: 'failed_no_storage',
        kind: 'receipt',
        reason: 'No scan upload storage provider configured.'
      }
    );

    await assert.rejects(
      () =>
        prepareScanUploadTicket({
          request: {
            scanId: 'receipt-3',
            kind: 'receipt',
            contentType: 'text/plain',
            byteLength: 42,
            requestedAt: '2026-05-20T08:00:00.000Z'
          },
          storage: {
            createUploadTicket: async () => {
              throw new Error('should not call storage for unsafe content type');
            }
          }
        }),
      /contentType must be an allowed scan upload type/
    );
  });
});

describe('planScanReviewWorkItems', () => {
  it('prioritizes unresolved barcode scans and low-confidence receipt rows for review', () => {
    const items = planScanReviewWorkItems([
      {
        scanId: 'barcode-1',
        result: {
          status: 'matched',
          kind: 'barcode',
          productId: null,
          confidence: 0.72,
          needsHumanReview: true
        }
      },
      {
        scanId: 'receipt-1',
        result: {
          status: 'parsed',
          kind: 'receipt',
          totalAmount: 62.4,
          confidence: 0.66,
          needsHumanReview: true,
          lowConfidenceRows: ['SMUDGED ITEM']
        }
      },
      {
        scanId: 'barcode-2',
        result: {
          status: 'matched',
          kind: 'barcode',
          productId: 'coffee',
          confidence: 0.93,
          needsHumanReview: false
        }
      }
    ]);

    assert.deepEqual(items, [
      {
        id: 'scan-review-barcode-1',
        scanId: 'barcode-1',
        kind: 'barcode',
        priority: 'high',
        reason: 'Barcode lookup did not resolve to a product.',
        evidence: ['confidence:0.72', 'product_match:missing']
      },
      {
        id: 'scan-review-receipt-1',
        scanId: 'receipt-1',
        kind: 'receipt',
        priority: 'high',
        reason: 'Receipt has 1 low-confidence rows.',
        evidence: ['confidence:0.66', 'total:62.4', 'low_confidence_row:SMUDGED ITEM']
      }
    ]);
  });

  it('keeps medium-priority review work for uncertain matched scans without row-level evidence', () => {
    const items = planScanReviewWorkItems([
      {
        scanId: 'barcode-3',
        result: {
          status: 'matched',
          kind: 'barcode',
          productId: 'coffee',
          confidence: 0.64,
          needsHumanReview: true
        }
      },
      {
        scanId: 'receipt-2',
        result: {
          status: 'parsed',
          kind: 'receipt',
          totalAmount: 105,
          confidence: 0.78,
          needsHumanReview: true,
          lowConfidenceRows: []
        }
      }
    ]);

    assert.deepEqual(items.map((item) => ({ id: item.id, priority: item.priority, reason: item.reason })), [
      { id: 'scan-review-barcode-3', priority: 'medium', reason: 'Barcode lookup needs review at confidence 0.64.' },
      { id: 'scan-review-receipt-2', priority: 'medium', reason: 'Receipt OCR needs review at confidence 0.78.' }
    ]);
  });

  it('rejects malformed scan review inputs', () => {
    assert.throws(
      () =>
        planScanReviewWorkItems([
          {
            scanId: ' ',
            result: {
              status: 'matched',
              kind: 'barcode',
              productId: 'coffee',
              confidence: 0.8,
              needsHumanReview: true
            }
          }
        ]),
      /scanId is required/
    );

    assert.throws(
      () =>
        planScanReviewWorkItems([
          {
            scanId: 'barcode-4',
            result: {
              status: 'matched',
              kind: 'barcode',
              productId: 'coffee',
              confidence: 1.2,
              needsHumanReview: true
            }
          }
        ]),
      /barcode confidence must be a number between 0 and 1/
    );
  });
});
