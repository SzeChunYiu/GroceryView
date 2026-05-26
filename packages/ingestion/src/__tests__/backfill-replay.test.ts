import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  planBackfillReplay,
  rawRecordToBackfillReplayPayload,
  summarizeBackfillReplayDiff,
  type BackfillReplayParser
} from '../backfill-replay.js';
import type { IngestRow } from '../contract.js';

const baseRow: IngestRow = {
  sourceType: 'official_api',
  observedAt: '2026-05-25T08:00:00.000Z',
  parserVersion: 'parser-v1',
  rawSnapshotRef: 'raw://willys/snapshot-1.json',
  sourceRunId: 'source-run-1',
  chainId: 'willys',
  storeId: 'willys-100',
  retailerProductId: 'sku-1',
  rawName: 'Arla Mellanmjolk 1 l',
  canonicalName: 'Arla Mellanmjolk 1 l',
  productId: 'arla-mellanmjolk-1l',
  categoryId: 'dairy',
  brand: 'Arla',
  packageSize: 1,
  packageUnit: 'l',
  price: 14.9,
  isAvailable: true,
  sourceUrl: 'https://example.test/sku-1'
};

describe('backfill replay planning', () => {
  it('reprocesses raw records with a pinned parser version and stable summaries', async () => {
    const payload = rawRecordToBackfillReplayPayload({
      id: 'raw-record-1',
      payload: [{ ...baseRow, parserVersion: 'parser-v2', price: 13.9 }],
      observedAt: baseRow.observedAt
    });

    const plan = await planBackfillReplay({
      parserVersion: 'parser-v2',
      snapshots: [payload],
      baselineRows: [baseRow]
    });

    assert.equal(plan.productionWriteMode, 'append_or_reuse_existing_observations');
    assert.equal(plan.snapshotCount, 1);
    assert.equal(plan.rowCount, 1);
    assert.equal(plan.snapshots[0]?.sourceRef, 'raw_records:raw-record-1');
    assert.match(plan.snapshots[0]?.fingerprint ?? '', /^sha256:/);
    assert.equal(plan.diff.changed, 1);
    assert.deepEqual(plan.diff.entries[0]?.changedFields, ['parserVersion', 'price']);
  });

  it('fails closed when a replay parser emits the wrong parser version', async () => {
    const parseSnapshot: BackfillReplayParser = () => [{ ...baseRow, parserVersion: 'parser-v1' }];

    await assert.rejects(
      planBackfillReplay({
        parserVersion: 'parser-v2',
        snapshots: [{ sourceRef: 'snapshot://wrong-version', body: [] }],
        parseSnapshot
      }),
      /parserVersion mismatch/
    );
  });

  it('reports duplicate production observation keys before writes', async () => {
    const duplicate = { ...baseRow, parserVersion: 'parser-v2' };
    const plan = await planBackfillReplay({
      parserVersion: 'parser-v2',
      snapshots: [
        { sourceRef: 'snapshot://a', body: [duplicate] },
        { sourceRef: 'snapshot://b', body: [duplicate] }
      ]
    });

    assert.equal(plan.duplicateObservationKeys.length, 1);
    assert.equal(plan.warnings.length, 1);
  });

  it('summarizes added and removed replay rows', () => {
    const diff = summarizeBackfillReplayDiff(
      [baseRow],
      [{ ...baseRow, retailerProductId: 'sku-2', productId: 'arla-filmjolk-1l' }]
    );

    assert.equal(diff.added, 1);
    assert.equal(diff.removed, 1);
    assert.equal(diff.changed, 0);
  });
});
