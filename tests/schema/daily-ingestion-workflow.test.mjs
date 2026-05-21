import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/daily-ingestion.yml', import.meta.url), 'utf8');

describe('daily ingestion workflow', () => {
  it('runs on a daily schedule and fails closed on missing deployed ingestion evidence', () => {
    assert.match(workflow, /schedule:/);
    assert.match(workflow, /cron:\s*['"]\d+\s+\d+\s+\*\s+\*\s+\*['"]/);
    assert.match(workflow, /workflow_dispatch:/);

    for (const command of [
      'npm ci',
      'npm run test -w @groceryview/ingestion',
      'npm run test -w @groceryview/db',
      '/api/readiness/postgres',
      '/api/readiness/source-runs'
    ]) {
      assert.match(workflow, new RegExp(command.replaceAll(' ', '\\s+').replaceAll('/', '\\/')));
    }

    for (const chain of ['ica', 'willys', 'coop', 'hemkop', 'lidl', 'city_gross']) {
      assert.match(workflow, new RegExp(`source_run_missing_fresh_chain:${chain}`));
    }

    assert.doesNotMatch(workflow, /continue-on-error:\s*true/);
  });
});
