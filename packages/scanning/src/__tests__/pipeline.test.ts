import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildScanProviderReadinessReport, planScanReviewWorkItems, processScanUpload } from '../index.js';

describe('buildScanProviderReadinessReport', () => {
  it('fails closed when barcode or receipt OCR providers are missing credentials or health checks', () => {
    const report = buildScanProviderReadinessReport({
      requiredProviders: ['barcode', 'receiptOcr'],
      providers: [
        {
          kind: 'barcode',
          providerName: 'gs1-compatible-lookup',
          configured: true,
          credentialsPresent: true,
          healthStatus: 'pass'
        },
        {
          kind: 'receiptOcr',
          providerName: 'cloud-ocr',
          configured: false,
          credentialsPresent: false,
          healthStatus: 'not_run'
        }
      ]
    });

    assert.deepEqual(report, {
      status: 'blocked',
      blockers: [
        'scan_provider_not_configured:receiptOcr',
        'scan_provider_credentials_missing:receiptOcr',
        'scan_provider_health_not_run:receiptOcr'
      ],
      evidence: [
        'scan_provider_configured:barcode:gs1-compatible-lookup',
        'scan_provider_credentials_present:barcode',
        'scan_provider_health_pass:barcode'
      ],
      warnings: [],
      summary: 'Scan provider readiness is blocked.'
    });
  });

  it('passes only when all required scan providers are configured, credentialed, and healthy', () => {
    const report = buildScanProviderReadinessReport({
      requiredProviders: ['barcode', 'receiptOcr'],
      providers: [
        {
          kind: 'barcode',
          providerName: 'gs1-compatible-lookup',
          configured: true,
          credentialsPresent: true,
          healthStatus: 'pass'
        },
        {
          kind: 'receiptOcr',
          providerName: 'cloud-ocr',
          configured: true,
          credentialsPresent: true,
          healthStatus: 'pass'
        }
      ]
    });

    assert.deepEqual(report, {
      status: 'ready',
      blockers: [],
      evidence: [
        'scan_provider_configured:barcode:gs1-compatible-lookup',
        'scan_provider_credentials_present:barcode',
        'scan_provider_health_pass:barcode',
        'scan_provider_configured:receiptOcr:cloud-ocr',
        'scan_provider_credentials_present:receiptOcr',
        'scan_provider_health_pass:receiptOcr'
      ],
      warnings: [],
      summary: 'Scan providers are ready.'
    });
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
