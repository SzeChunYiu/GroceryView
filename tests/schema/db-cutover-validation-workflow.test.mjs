import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/db-cutover-validation.yml', import.meta.url), 'utf8');

describe('production DB cutover validation workflow', () => {
  it('runs a manual fail-closed replacement DB validation with redacted evidence', () => {
    assert.match(workflow, /name:\s*Production DB cutover validation/);
    assert.match(workflow, /workflow_dispatch:/);
    assert.match(workflow, /concurrency:/);
    assert.match(workflow, /cancel-in-progress:\s*false/);
    assert.match(workflow, /timeout-minutes:\s*20/);

    for (const command of [
      'npm ci',
      'node --test tests/schema/db-cutover-validation-script.test.mjs',
      'npm run --silent ops:validate-db-cutover'
    ]) {
      assert.match(workflow, new RegExp(command.replaceAll(' ', '\\s+').replaceAll('/', '\\/')));
    }

    assert.match(workflow, /DATABASE_URL:\s*\$\{\{ secrets\.DATABASE_URL \}\}/);
    assert.match(workflow, /REPLACEMENT_DATABASE_URL:\s*\$\{\{ secrets\.REPLACEMENT_DATABASE_URL \}\}/);
    assert.match(workflow, /CANDIDATE_DATABASE_URL:\s*\$\{\{ secrets\.CANDIDATE_DATABASE_URL \}\}/);
    assert.match(workflow, /GROCERYVIEW_CUTOVER_DB_CONNECTIVITY_RETRY_ATTEMPTS/);
    assert.match(workflow, /GROCERYVIEW_CUTOVER_DB_CONNECTIVITY_RETRY_BASE_DELAY_MS/);
    assert.match(workflow, /GROCERYVIEW_CUTOVER_DB_CONNECTIVITY_RETRY_MAX_DELAY_MS/);
    assert.match(workflow, /\/tmp\/db-cutover-validation\.json/);
    assert.match(workflow, /db_cutover_validation_diagnostic_missing/);
    assert.match(workflow, /cutover_status=\$\?/);
    assert.match(workflow, /body\.status !== 'ready'/);
    assert.match(workflow, /name:\s*Upload DB cutover validation evidence\n\s+if:\s*always\(\)/);
    assert.match(workflow, /name:\s*groceryview-db-cutover-validation/);
    assert.match(workflow, /if-no-files-found:\s*error/);
    assert.doesNotMatch(workflow, /continue-on-error:\s*true/);
  });
});
