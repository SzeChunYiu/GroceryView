import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rootPackage = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const script = readFileSync(new URL('../../scripts/ops/run-db-retention.mjs', import.meta.url), 'utf8');

describe('database retention ops script', () => {
  it('exposes a root operator command for audited retention runs', () => {
    assert.equal(rootPackage.scripts['ops:run-db-retention'], 'node scripts/ops/run-db-retention.mjs');
  });

  it('defaults to dry-run and requires an explicit execute signal for deletes', () => {
    assert.match(script, /GROCERYVIEW_DB_RETENTION_DRY_RUN/);
    assert.match(script, /--execute/);
    assert.match(script, /dryRun \? 'planned' : 'applied'/);
    assert.match(script, /run_observation_retention\(\$1::integer, \$2::integer, \$3::boolean\)/);
    assert.match(script, /retention_runs where id = \$1::uuid/);
    assert.match(script, /observationsCandidateCount/);
    assert.match(script, /rawRecordsDeletedCount/);
  });
});
