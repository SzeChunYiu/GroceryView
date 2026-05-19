import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ruleset = JSON.parse(readFileSync(new URL('../../.github/repository-ruleset.json', import.meta.url), 'utf8'));

describe('repository ruleset policy', () => {
  it('requires pull requests and CI before main updates', () => {
    assert.equal(ruleset.name, 'main protection');
    assert.deepEqual(ruleset.targetBranches, ['main']);
    assert.equal(ruleset.rules.requirePullRequest, true);
    assert.equal(ruleset.enforcement, 'active');
    assert.deepEqual(ruleset.rules.requiredStatusChecks, ['Test, build, and typecheck', 'Validate release-safe candidate']);
    assert.equal(ruleset.rules.blockForcePushes, true);
    assert.equal(ruleset.appliedInGitHub, true);
  });
});
