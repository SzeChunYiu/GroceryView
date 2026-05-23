import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/production-readiness-audit.yml', import.meta.url), 'utf8');

describe('production readiness audit workflow', () => {
  it('runs a scheduled and manual fail-closed GitHub production secret and variable audit with evidence artifact', () => {
    assert.match(workflow, /name:\s*Production readiness audit/);
    assert.match(workflow, /workflow_dispatch:/);
    assert.match(workflow, /schedule:/);
    assert.match(workflow, /environment:\s*production/);
    assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/);
    assert.match(workflow, /npm ci/);
    assert.match(workflow, /npm run ops:check-production-secrets -- --repo \$\{\{ github\.repository \}\} --env production/);
    assert.match(workflow, /artifacts\/production-readiness-secret-audit\.json/);
    assert.match(workflow, /production-readiness-audit-evidence/);
    assert.match(workflow, /actions\/upload-artifact@v4/);
    assert.match(workflow, /if:\s*always\(\)/);
    assert.match(workflow, /exit "\$audit_status"/);
    assert.doesNotMatch(workflow, /continue-on-error:\s*true/);
  });
});
