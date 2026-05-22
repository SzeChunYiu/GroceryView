import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const runbook = readFileSync(new URL('../../docs/ops/production-daily-ingestion-readiness.md', import.meta.url), 'utf8');

describe('production daily ingestion readiness runbook', () => {
  it('documents generated daily connectors instead of requiring a connector secret', () => {
    const requiredSecretsSection = runbook.slice(
      runbook.indexOf('## Required secrets'),
      runbook.indexOf('## Generate coverage targets from the live DB')
    );

    assert.doesNotMatch(requiredSecretsSection, /GROCERYVIEW_DAILY_CONNECTORS_JSON/);
    assert.match(runbook, /daily ingestion workflow generates `GROCERYVIEW_DAILY_CONNECTORS_JSON`/);
    assert.match(runbook, /npm run --silent ops:daily-connectors/);
    assert.match(runbook, /GROCERYVIEW_DAILY_CONNECTORS_JSON=\$\(npm run --silent ops:daily-connectors\)/);
    assert.doesNotMatch(runbook, /Use the emitted JSON as the `GROCERYVIEW_DAILY_CONNECTORS_JSON` secret\/value/);
  });
});
