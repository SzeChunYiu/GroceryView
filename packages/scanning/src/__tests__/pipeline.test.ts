import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildScanProviderReadinessReport, createOcrSpaceReceiptProvider, createOpenFoodFactsBarcodeProvider, planReceiptAliasGrowth, planScanReviewWorkItems, prepareScanUploadTicket, processScanUpload } from '../index.js';

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

describe('planReceiptAliasGrowth', () => {
  it('plans receipt-fed commodity alias candidates from chain label, kr, and weight evidence', () => {
    const plan = planReceiptAliasGrowth({
      receipts: [
        {
          scanId: 'receipt-commodity-1',
          chainLabel: 'Willys Odenplan',
          observedAt: '2026-05-22T10:00:00.000Z',
          rows: [
            { rawName: 'Banan 0,82 kg', itemTotal: 19.35, confidence: 0.86 },
            { rawName: 'Gurka 1 st', itemTotal: 12.9, confidence: 0.74 },
            { rawName: 'SMUDGED ROW', itemTotal: 8, confidence: 0.42 }
          ]
        }
      ]
    });

    assert.equal(plan.status, 'review_required');
    assert.deepEqual(plan.candidates.map((candidate) => ({
      id: candidate.id,
      normalizedAlias: candidate.normalizedAlias,
      chainLabel: candidate.chainLabel,
      comparableUnit: candidate.comparableUnit,
      quantity: candidate.quantity,
      unitPrice: candidate.unitPrice,
      priority: candidate.priority,
      reviewAction: candidate.reviewAction
    })), [
      {
        id: 'alias-receipt-commodity-1-banan',
        normalizedAlias: 'banan',
        chainLabel: 'Willys Odenplan',
        comparableUnit: 'kg',
        quantity: 0.82,
        unitPrice: 23.6,
        priority: 'medium',
        reviewAction: 'create_commodity_alias_candidate'
      },
      {
        id: 'alias-receipt-commodity-1-gurka',
        normalizedAlias: 'gurka',
        chainLabel: 'Willys Odenplan',
        comparableUnit: 'st',
        quantity: 1,
        unitPrice: 12.9,
        priority: 'high',
        reviewAction: 'create_commodity_alias_candidate'
      }
    ]);
    assert.deepEqual(plan.rejectedRows, [
      { scanId: 'receipt-commodity-1', rawName: 'SMUDGED ROW', reason: 'receipt_row_confidence_below_threshold' }
    ]);
    assert.match(plan.summary, /2 alias candidates/);
  });

  it('fails closed when receipt alias growth lacks chain or quantity evidence', () => {
    const plan = planReceiptAliasGrowth({
      receipts: [
        {
          scanId: 'receipt-commodity-2',
          chainLabel: '',
          observedAt: '2026-05-22T10:00:00.000Z',
          rows: [
            { rawName: 'Tomat', itemTotal: 18, confidence: 0.91 }
          ]
        }
      ]
    });

    assert.equal(plan.status, 'blocked');
    assert.deepEqual(plan.candidates, []);
    assert.deepEqual(plan.rejectedRows, [
      { scanId: 'receipt-commodity-2', rawName: 'Tomat', reason: 'chain_label_required' }
    ]);
  });
});

describe('createOpenFoodFactsBarcodeProvider', () => {
  it('fetches OpenFoodFacts product metadata with a declared user agent and normalizes a barcode match', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const provider = createOpenFoodFactsBarcodeProvider({
      userAgent: 'GroceryView/1.0 contact@groceryview.se',
      fetch: async (url, init = {}) => {
        calls.push({ url: String(url), init });
        return new Response(JSON.stringify({
          status: 1,
          code: '0735000123456',
          product: { product_name: 'Zoegas Skånerost 450g', brands: 'Zoegas' }
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
    });

    const result = await provider.lookup('0735000123456');

    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, 'https://world.openfoodfacts.org/api/v2/product/0735000123456.json?fields=code%2Cproduct_name%2Cbrands%2Cquantity%2Cstatus');
    assert.equal((calls[0]?.init.headers as Record<string, string>)['user-agent'], 'GroceryView/1.0 contact@groceryview.se');
    assert.deepEqual(result, {
      productId: 'openfoodfacts:0735000123456',
      barcode: '0735000123456',
      confidence: 0.86,
      needsHumanReview: false
    });
  });

  it('fails closed on missing user agent, invalid barcodes, HTTP failures, and missing products', async () => {
    assert.throws(() => createOpenFoodFactsBarcodeProvider({ userAgent: ' ' }), /OPENFOODFACTS_USER_AGENT is required/);

    const provider = createOpenFoodFactsBarcodeProvider({
      userAgent: 'GroceryView/1.0 contact@groceryview.se',
      fetch: async () => new Response(JSON.stringify({ status: 0 }), { status: 200 })
    });

    await assert.rejects(() => provider.lookup('not-a-barcode'), /barcode must contain 8 to 14 digits/);
    await assert.rejects(() => provider.lookup('0735000123456'), /OpenFoodFacts did not resolve barcode 0735000123456/);

    const failingProvider = createOpenFoodFactsBarcodeProvider({
      userAgent: 'GroceryView/1.0 contact@groceryview.se',
      fetch: async () => new Response('rate limited', { status: 429 })
    });

    await assert.rejects(() => failingProvider.lookup('0735000123456'), /OpenFoodFacts HTTP 429/);
  });
});

describe('createOcrSpaceReceiptProvider', () => {
  it('posts receipt payloads to OCR.space and normalizes parsed totals and row confidence', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const provider = createOcrSpaceReceiptProvider({
      apiKey: 'ocr-key',
      endpoint: 'https://api.ocr.space/parse/image',
      fetch: async (url: string | URL | Request, init?: RequestInit) => {
        calls.push({ url: String(url), init: init ?? {} });
        return new Response(JSON.stringify({
          IsErroredOnProcessing: false,
          ParsedResults: [
            {
              ParsedText: ['ZOEGAS 450G 49.90', 'MJOLK 1L 14.50', 'TOTAL 64.40'].join('\n'),
              TextOverlay: {
                Lines: [
                  { LineText: 'ZOEGAS 450G 49.90', Words: [{ WordText: 'ZOEGAS', Confidence: 96 }, { WordText: '49.90', Confidence: 91 }] },
                  { LineText: 'MJOLK 1L 14.50', Words: [{ WordText: 'MJOLK', Confidence: 88 }, { WordText: '14.50', Confidence: 84 }] }
                ]
              }
            }
          ]
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
    });

    const result = await provider.parse('private-upload://receipt-1');

    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, 'https://api.ocr.space/parse/image');
    assert.equal(calls[0]?.init.method, 'POST');
    assert.equal((calls[0]?.init.headers as Record<string, string>).apikey, 'ocr-key');
    assert.match(String(calls[0]?.init.body), /url=private-upload%3A%2F%2Freceipt-1/);
    assert.deepEqual(result, {
      rows: [
        { rawName: 'ZOEGAS 450G', itemTotal: 49.9, confidence: 0.91 },
        { rawName: 'MJOLK 1L', itemTotal: 14.5, confidence: 0.84 }
      ],
      totalAmount: 64.4,
      confidence: 0.88
    });
  });

  it('fails closed on missing credentials and provider errors', async () => {
    assert.throws(() => createOcrSpaceReceiptProvider({ apiKey: ' ' }), /OCR_SPACE_API_KEY is required/);

    const provider = createOcrSpaceReceiptProvider({
      apiKey: 'ocr-key',
      fetch: async () => new Response(JSON.stringify({ IsErroredOnProcessing: true, ErrorMessage: ['bad image'] }), { status: 200 })
    });

    await assert.rejects(() => provider.parse('private-upload://receipt-2'), /OCR.space failed: bad image/);
  });
});
