import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildConnectorRunKey,
  buildObservationIdempotencyKey,
  buildOpenPricesIdempotencyKey,
  buildSourceRunId,
  buildSourceRunInputHash,
  stableKeyPart
} from '../idempotency.js';

describe('idempotency helpers', () => {
  it('builds stable connector run keys and source run ids', () => {
    const runKey = buildConnectorRunKey({
      chainId: 'Willys',
      sourceType: 'official_api',
      connectorId: 'Willys API v1',
      requestedAt: '2026-05-19T18:00:00.000Z'
    });

    assert.equal(runKey, 'willys:official-api:willys-api-v1:2026-05-19');
    assert.equal(buildSourceRunId({ runKey }), 'source-run:willys:official-api:willys-api-v1:2026-05-19');
    assert.equal(stableKeyPart('  ICA Store Promotions '), 'ica-store-promotions');
  });

  it('hashes source run inputs deterministically', () => {
    const input = {
      domain: 'grocery',
      sourceId: 'willys-products-all-stores',
      connectorId: 'willys-products-native-v1',
      schemaVersion: 'ingest-row-v1',
      codeVersion: '0.1.0',
      contentHash: 'sha256:abc123',
      observedAtBucket: '2026-05-28'
    };

    const first = buildSourceRunInputHash(input);
    const second = buildSourceRunInputHash({ ...input });
    const changed = buildSourceRunInputHash({ ...input, contentHash: 'sha256:def456' });

    assert.match(first, /^sha256:[a-f0-9]{64}$/);
    assert.equal(first, second);
    assert.notEqual(first, changed);
  });

  it('hashes open prices idempotency keys from canonical fields', () => {
    const input = {
      sourceType: 'official_api',
      sourceUrl: 'https://example.test/open-prices/export.json',
      contentHash: 'sha256:payload',
      parserVersion: 'open-prices-v1',
      observedAt: '2026-05-28T08:00:00.000Z'
    };

    const first = buildOpenPricesIdempotencyKey(input);
    const second = buildOpenPricesIdempotencyKey({
      ...input,
      observedAt: '2026-05-28T08:00:00Z'
    });

    assert.match(first, /^open-prices:sha256:[a-f0-9]{64}$/);
    assert.equal(first, second);
  });

  it('hashes observation idempotency keys for connector replay guards', () => {
    const input = {
      productId: 'arla-mellanmjolk-1l',
      chainId: 'willys',
      storeId: 'willys-100',
      domain: 'grocery',
      retailerProductRef: 'sku-1',
      priceType: 'online',
      observedAt: '2026-05-28T08:00:00.000Z',
      price: 14.9,
      unitPrice: 14.9,
      currency: 'sek',
      confidence: 0.95,
      provenance: {
        parserVersion: 'willys-products-native-v1',
        sourceRunId: 'source-run:willys:official-api:willys-api-v1:2026-05-28'
      }
    };

    const first = buildObservationIdempotencyKey(input);
    const second = buildObservationIdempotencyKey({ ...input });
    const changed = buildObservationIdempotencyKey({ ...input, price: 15.9 });

    assert.match(first, /^observation:sha256:[a-f0-9]{64}$/);
    assert.equal(first, second);
    assert.notEqual(first, changed);
  });
});
