import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8');

describe('deploy workflow', () => {
  it('is manually triggered and verifies before deployment steps', () => {
    assert.match(workflow, /workflow_dispatch:/);
    for (const command of ['npm ci', 'npm test', 'npm run build', 'npm run typecheck']) {
      assert.match(workflow, new RegExp(command.replaceAll(' ', '\\s+')));
    }
    assert.match(workflow, /deploy\/groceryview\.manifest\.json/);
    assert.match(workflow, /environment:\s*production/);
  });
});
