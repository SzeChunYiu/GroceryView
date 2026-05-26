import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const partitioning = readFileSync(new URL('../../infra/db/migrations/013_observations_partitioning.sql', import.meta.url), 'utf8');
const maintenance = readFileSync(new URL('../../infra/db/migrations/027_observations_partition_maintenance.sql', import.meta.url), 'utf8');

test('observations_v2 is monthly partitioned and has scheduled maintenance hooks', () => {
  assert.match(partitioning, /create table if not exists observations_v2[\s\S]*partition by range \(observed_at\)/i);
  assert.match(partitioning, /ensure_observations_monthly_partition/);
  assert.match(partitioning, /create_observations_partitions/);
  assert.match(partitioning, /drop_observations_partitions_before/);
  assert.match(partitioning, /observations_partition_lane_sync/);

  assert.match(maintenance, /run_observations_partition_maintenance/);
  assert.match(maintenance, /cron\.schedule/);
  assert.match(maintenance, /observations_partition_maintenance_runs/);
  assert.match(maintenance, /explain_observations_v2_date_pruning/);
  assert.match(maintenance, /explain \(costs off\) select id from observations_v2 where observed_at >=/i);
});
