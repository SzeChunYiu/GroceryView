import { createHash } from 'node:crypto';
import type { IngestRow } from './contract.js';
import { normalizeIngestPayload } from './pipeline.js';
import type { RawIngestPayload } from './pipeline.js';

export type BackfillReplayParser = (snapshot: RawIngestPayload, parserVersion: string) => IngestRow[] | Promise<IngestRow[]>;

export type RawRecordReplaySource = {
  id: string;
  recordType?: string;
  externalRef?: string | null;
  observedAt?: string | Date | null;
  payload: unknown;
  provenance?: Record<string, unknown> | string | null;
};

export type BackfillReplayInput = {
  parserVersion: string;
  snapshots: readonly RawIngestPayload[];
  parseSnapshot?: BackfillReplayParser;
  baselineRows?: readonly IngestRow[];
};

export type BackfillReplaySnapshotSummary = {
  sourceRef: string;
  rowCount: number;
  fingerprint: string;
};

export type BackfillReplayRowSummary = {
  key: string;
  fingerprint: string;
  productId: string;
  chainId: string;
  storeId: string | null;
  retailerProductId: string | null;
  observedAt: string;
  parserVersion: string;
  rawSnapshotRef: string;
};

export type BackfillReplayDiffEntry = {
  key: string;
  before?: BackfillReplayRowSummary;
  after?: BackfillReplayRowSummary;
  changedFields: string[];
};

export type BackfillReplayDiffReport = {
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
  entries: BackfillReplayDiffEntry[];
};

export type BackfillReplayDuplicateObservation = {
  observationKey: string;
  rowKeys: string[];
};

export type BackfillReplayPlan = {
  parserVersion: string;
  snapshotCount: number;
  rowCount: number;
  snapshots: BackfillReplaySnapshotSummary[];
  rows: BackfillReplayRowSummary[];
  duplicateObservationKeys: BackfillReplayDuplicateObservation[];
  diff: BackfillReplayDiffReport;
  productionWriteMode: 'append_or_reuse_existing_observations';
  warnings: string[];
};

const SOURCE_CONFIDENCE: Record<IngestRow['sourceType'], number> = {
  official_api: 0.95,
  retailer_online_page: 0.85,
  receipt_scan: 0.8,
  shelf_photo: 0.75,
  flyer_campaign: 0.7,
  manual_user_report: 0.5,
  estimated: 0.25
};

function normalizeDate(value: string): string {
  return new Date(value).toISOString();
}

function stableValue(value: unknown): unknown {
  if (value instanceof Uint8Array) return Array.from(value);
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

function sha256(value: unknown): string {
  return `sha256:${createHash('sha256').update(stableStringify(value)).digest('hex')}`;
}

function replayPriceType(row: IngestRow): string {
  const hasPromotion = row.regularPrice !== undefined && row.regularPrice > row.price;
  if (row.sourceType === 'estimated') return 'estimated';
  if (row.sourceType === 'receipt_scan') return 'receipt';
  if (row.sourceType === 'shelf_photo') return 'shelf';
  if (row.sourceType === 'manual_user_report') return 'community';
  if (row.sourceType === 'flyer_campaign') return row.memberOnly ? 'member' : 'promotion';
  if (row.sourceType === 'official_api' || row.sourceType === 'retailer_online_page') return hasPromotion && row.memberOnly ? 'member' : 'online';
  return 'estimated';
}

function replayRowKey(row: IngestRow): string {
  return [
    row.productId,
    row.chainId,
    row.storeId ?? '',
    row.retailerProductId ?? '',
    normalizeDate(row.observedAt),
    row.rawSnapshotRef
  ].join('|');
}

function replayObservationKey(row: IngestRow): string {
  return sha256({
    productId: row.productId,
    chainId: row.chainId,
    storeId: row.storeId ?? null,
    domain: 'grocery',
    retailerProductRef: row.retailerProductId ?? null,
    priceType: replayPriceType(row),
    observedAt: normalizeDate(row.observedAt),
    price: row.price,
    regularPrice: row.regularPrice ?? null,
    currency: 'SEK',
    packageSize: row.packageSize,
    packageUnit: row.packageUnit,
    isAvailable: row.isAvailable ?? true,
    confidence: SOURCE_CONFIDENCE[row.sourceType],
    provenance: {
      sourceType: row.sourceType,
      sourceUrl: row.sourceUrl,
      observedAt: row.observedAt,
      parserVersion: row.parserVersion,
      rawSnapshotRef: row.rawSnapshotRef,
      sourceRunId: row.sourceRunId
    }
  });
}

function rowSummary(row: IngestRow): BackfillReplayRowSummary {
  return {
    key: replayRowKey(row),
    fingerprint: sha256(row),
    productId: row.productId,
    chainId: row.chainId,
    storeId: row.storeId ?? null,
    retailerProductId: row.retailerProductId ?? null,
    observedAt: normalizeDate(row.observedAt),
    parserVersion: row.parserVersion,
    rawSnapshotRef: row.rawSnapshotRef
  };
}

function changedFields(before: IngestRow, after: IngestRow): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys]
    .filter((key) => stableStringify(before[key as keyof IngestRow]) !== stableStringify(after[key as keyof IngestRow]))
    .sort();
}

export function rawRecordToBackfillReplayPayload(record: RawRecordReplaySource): RawIngestPayload {
  return {
    sourceRef: `raw_records:${record.id}`,
    body: record.payload,
    retrievedAt: record.observedAt instanceof Date ? record.observedAt.toISOString() : record.observedAt ?? undefined,
    contentType: 'application/json'
  };
}

export function summarizeBackfillReplayDiff(
  baselineRows: readonly IngestRow[] = [],
  replayRows: readonly IngestRow[] = []
): BackfillReplayDiffReport {
  const baselineByKey = new Map(baselineRows.map((row) => [replayRowKey(row), row]));
  const replayByKey = new Map(replayRows.map((row) => [replayRowKey(row), row]));
  const keys = [...new Set([...baselineByKey.keys(), ...replayByKey.keys()])].sort();
  const entries: BackfillReplayDiffEntry[] = [];
  let unchanged = 0;

  for (const key of keys) {
    const before = baselineByKey.get(key);
    const after = replayByKey.get(key);
    if (before && after) {
      const fields = changedFields(before, after);
      if (fields.length === 0) {
        unchanged += 1;
        continue;
      }
      entries.push({ key, before: rowSummary(before), after: rowSummary(after), changedFields: fields });
      continue;
    }
    entries.push({
      key,
      before: before ? rowSummary(before) : undefined,
      after: after ? rowSummary(after) : undefined,
      changedFields: before ? ['removed'] : ['added']
    });
  }

  return {
    added: entries.filter((entry) => !entry.before && entry.after).length,
    removed: entries.filter((entry) => entry.before && !entry.after).length,
    changed: entries.filter((entry) => entry.before && entry.after).length,
    unchanged,
    entries
  };
}

export async function planBackfillReplay(input: BackfillReplayInput): Promise<BackfillReplayPlan> {
  const parserVersion = input.parserVersion.trim();
  if (!parserVersion) throw new Error('parserVersion is required for deterministic backfill replay.');

  const parseSnapshot = input.parseSnapshot ?? ((snapshot: RawIngestPayload) => normalizeIngestPayload(snapshot));
  const snapshots: BackfillReplaySnapshotSummary[] = [];
  const replayRows: IngestRow[] = [];
  const warnings: string[] = [];

  for (const snapshot of input.snapshots) {
    const parsed = await parseSnapshot(snapshot, parserVersion);
    const sourceRows = parsed.map((row) => {
      if (row.parserVersion !== parserVersion) {
        throw new Error(`Replay parserVersion mismatch for ${snapshot.sourceRef}: expected ${parserVersion}, received ${row.parserVersion}`);
      }
      return row;
    }).sort((left, right) => replayRowKey(left).localeCompare(replayRowKey(right)));

    snapshots.push({
      sourceRef: snapshot.sourceRef,
      rowCount: sourceRows.length,
      fingerprint: sha256(sourceRows)
    });
    replayRows.push(...sourceRows);
  }

  replayRows.sort((left, right) => replayRowKey(left).localeCompare(replayRowKey(right)));

  const duplicateObservationKeyMap = new Map<string, string[]>();
  for (const row of replayRows) {
    const key = replayObservationKey(row);
    const rowKeys = duplicateObservationKeyMap.get(key) ?? [];
    rowKeys.push(replayRowKey(row));
    duplicateObservationKeyMap.set(key, rowKeys);
  }
  const duplicateObservationKeys = [...duplicateObservationKeyMap.entries()]
    .filter(([, rowKeys]) => rowKeys.length > 1)
    .map(([observationKey, rowKeys]) => ({ observationKey, rowKeys }))
    .sort((left, right) => left.observationKey.localeCompare(right.observationKey));

  if (duplicateObservationKeys.length > 0) {
    warnings.push(`${duplicateObservationKeys.length} duplicate observation key(s) would be reused by production upsert idempotency.`);
  }

  return {
    parserVersion,
    snapshotCount: input.snapshots.length,
    rowCount: replayRows.length,
    snapshots,
    rows: replayRows.map(rowSummary),
    duplicateObservationKeys,
    diff: summarizeBackfillReplayDiff(input.baselineRows, replayRows),
    productionWriteMode: 'append_or_reuse_existing_observations',
    warnings
  };
}
