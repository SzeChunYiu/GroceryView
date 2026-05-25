import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatIngestRowZodIssues, ingestRowSchema, type IngestRow } from '../contract.js';
import { planIngestionBatch, type RetailerProductInput } from '../index.js';

const validRow: IngestRow = {
  sourceType: 'retailer_online_page',
  observedAt: '2026-05-25T12:00:00.000Z',
  parserVersion: 'contract-test-v1',
  rawSnapshotRef: 'raw://contract-test/snapshot.json',
  chainId: 'willys',
  retailerProductId: 'willys-123',
  rawName: 'Arla Mellanmjölk 1 l',
  canonicalName: 'Arla Mellanmjölk 1 l',
  productId: 'willys-arla-mellanmjolk-1l',
  categoryId: 'dairy-milk',
  brand: 'Arla',
  packageSize: 1,
  packageUnit: 'l',
  price: 14.9,
  regularPrice: 16.9,
  memberOnly: false,
  isAvailable: true,
  sourceUrl: 'https://example.test/products/arla-mellanmjolk-1l'
};

describe('ingest row contract', () => {
  it('accepts the normalized connector row shape used at the ingestion boundary', () => {
    const parsed = ingestRowSchema.safeParse(validRow);
    assert.equal(parsed.success, true);
  });

  it('uses the parsed IngestRow shape at the ingestion boundary', () => {
    const parsedRow = ingestRowSchema.parse({ ...validRow, originCountry: 'se' }) as RetailerProductInput;
    const plan = planIngestionBatch([parsedRow]);

    assert.equal(plan.rejected.length, 0);
    assert.equal(plan.accepted[0]?.product.originCountry, 'SE');
  });

  it('formats Zod issues and rejects malformed rows before ingestion', () => {
    const invalidRow = {
      ...validRow,
      price: -1,
      parserVersion: '',
      unexpected: 'field'
    } as unknown as RetailerProductInput;

    const parsed = ingestRowSchema.safeParse(invalidRow);
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      const formatted = formatIngestRowZodIssues(parsed.error.issues);
      assert.match(formatted, /price/);
      assert.match(formatted, /parserVersion/);
      assert.match(formatted, /unexpected/);
    }

    const originalError = console.error;
    const logged: unknown[] = [];
    console.error = (...args: unknown[]) => {
      logged.push(args);
    };

    try {
      const plan = planIngestionBatch([invalidRow]);
      assert.equal(plan.accepted.length, 0);
      assert.equal(plan.rejected.length, 1);
      assert.match(plan.rejected[0]?.reason ?? '', /Ingest row contract violation/);
      assert.equal(logged.length, 1);
    } finally {
      console.error = originalError;
    }
  });
});
