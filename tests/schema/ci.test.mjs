import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8');

describe('CI workflow', () => {
  it('runs install, test, build, and typecheck on pull requests and main pushes', () => {
    assert.match(workflow, /pull_request:/);
    assert.match(workflow, /push:/);
    assert.match(workflow, /branches:\s*\[main\]/);
    for (const command of ['npm ci', 'npm test', 'npm run build', 'npm run typecheck']) {
      assert.match(workflow, new RegExp(command.replaceAll(' ', '\\s+')));
    }
  });
});
