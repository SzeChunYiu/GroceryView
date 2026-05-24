import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/release-validation.yml', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const packageLockExists = existsSync(new URL('../../package-lock.json', import.meta.url));
const pnpmLockExists = existsSync(new URL('../../pnpm-lock.yaml', import.meta.url));

describe('release validation workflow', () => {
  it('uses the repository package manager and only invokes existing root scripts', () => {
    assert.equal(packageLockExists, true, 'release validation should follow the committed npm lockfile');
    assert.equal(pnpmLockExists, false, 'pnpm workflow commands require a committed pnpm-lock.yaml');

    for (const command of ['npm ci', 'npm test', 'npm run lint', 'npm run build', 'npm run typecheck']) {
      assert.match(workflow, new RegExp(command.replaceAll(' ', '\\s+')));
    }

    assert.doesNotMatch(workflow, /pnpm\b/, 'workflow must not use pnpm without packageManager and pnpm lockfile');
    assert.equal(Object.hasOwn(packageJson.scripts, 'lint'), true);
  });
});
