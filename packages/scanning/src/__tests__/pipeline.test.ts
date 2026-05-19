import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { processScanUpload } from '../index.js';

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
