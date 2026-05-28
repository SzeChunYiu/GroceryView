import { createHash } from 'node:crypto';

export type SourceRunIdempotencyInput = {
  domain: string;
  sourceId: string;
  connectorId: string;
  schemaVersion: string;
  codeVersion: string;
  contentHash: string;
  observedAtBucket: string;
};

export type OpenPricesIdempotencyInput = {
  sourceType: string;
  sourceUrl: string;
  contentHash: string;
  parserVersion: string;
  observedAt: string;
};

export type ObservationIdempotencyInput = {
  productId: string;
  chainId: string;
  storeId: string | null;
  domain: string;
  retailerProductRef: string | null;
  priceType: string;
  observedAt: string;
  price: number;
  unitPrice?: number | null;
  currency: string;
  confidence?: number | null;
  provenance?: Record<string, unknown> | null;
};

function stableValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, stableValue(nested)])
    );
  }
  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value)) ?? 'undefined';
}

function sha256Hex(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

export function stableKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
}

export function normalizeObservedAt(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new Error('observedAt must be a parseable ISO date.');
  return new Date(parsed).toISOString();
}

export function buildConnectorRunKey(input: {
  chainId: string;
  sourceType: string;
  connectorId: string;
  requestedAt: string;
}): string {
  const datePart = normalizeObservedAt(input.requestedAt).slice(0, 10);
  return [
    stableKeyPart(input.chainId),
    stableKeyPart(input.sourceType),
    stableKeyPart(input.connectorId),
    datePart
  ].join(':');
}

export function buildSourceRunId(input: { runKey: string }): string {
  return `source-run:${input.runKey}`;
}

export function buildSourceRunInputHash(input: SourceRunIdempotencyInput): string {
  return `sha256:${sha256Hex({
    domain: stableKeyPart(input.domain),
    sourceId: stableKeyPart(input.sourceId),
    connectorId: stableKeyPart(input.connectorId),
    schemaVersion: input.schemaVersion.trim(),
    codeVersion: input.codeVersion.trim(),
    contentHash: input.contentHash.trim(),
    observedAtBucket: input.observedAtBucket.trim()
  })}`;
}

export function buildOpenPricesIdempotencyKey(input: OpenPricesIdempotencyInput): string {
  return `open-prices:sha256:${sha256Hex({
    sourceType: stableKeyPart(input.sourceType),
    sourceUrl: input.sourceUrl.trim(),
    contentHash: input.contentHash.trim(),
    parserVersion: input.parserVersion.trim(),
    observedAt: normalizeObservedAt(input.observedAt)
  })}`;
}

export function buildObservationIdempotencyKey(input: ObservationIdempotencyInput): string {
  return `observation:sha256:${sha256Hex({
    productId: input.productId,
    chainId: input.chainId,
    storeId: input.storeId,
    domain: stableKeyPart(input.domain),
    retailerProductRef: input.retailerProductRef,
    priceType: stableKeyPart(input.priceType),
    observedAt: normalizeObservedAt(input.observedAt),
    price: input.price,
    unitPrice: input.unitPrice ?? null,
    currency: input.currency.trim().toUpperCase(),
    confidence: input.confidence ?? null,
    provenance: input.provenance ?? null
  })}`;
}
