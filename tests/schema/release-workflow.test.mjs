import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/release-validation.yml', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const webPackageJson = JSON.parse(readFileSync(new URL('../../apps/web/package.json', import.meta.url), 'utf8'));
const packageLockExists = existsSync(new URL('../../package-lock.json', import.meta.url));
const pnpmLockExists = existsSync(new URL('../../pnpm-lock.yaml', import.meta.url));

describe('release validation workflow', () => {
  it('uses the repository package manager and only invokes existing root scripts', () => {
    assert.equal(packageLockExists, true, 'release validation should follow the committed npm lockfile');
    assert.equal(pnpmLockExists, false, 'pnpm workflow commands require a committed pnpm-lock.yaml');

    for (const command of ['npm ci', 'npm test', 'npm run build', 'npm run typecheck']) {
      assert.match(workflow, new RegExp(command.replaceAll(' ', '\\s+')));
    }

    assert.doesNotMatch(workflow, /pnpm\b/, 'workflow must not use pnpm without packageManager and pnpm lockfile');
    assert.doesNotMatch(workflow, /npm\s+run\s+lint|pnpm\s+lint/, 'workflow must not call lint until package.json defines a lint script');
    assert.equal(Object.hasOwn(packageJson.scripts, 'lint'), false);
  });

  it('runs the executable WCAG accessibility gate and uploads its report artifacts', () => {
    assert.match(webPackageJson.scripts['a11y:ci'], /playwright test/);
    assert.match(webPackageJson.scripts['a11y:ci'], /wcag-aa-gate\.spec\.ts/);
    assert.match(workflow, /WCAG 2\.2 AA accessibility gate/);
    assert.match(workflow, /npm\s+run\s+a11y:ci\s+-w\s+@groceryview\/web/);
    assert.match(workflow, /npx\s+playwright\s+install\s+--with-deps\s+chromium/);
    assert.match(workflow, /apps\/web\/e2e\/test-results\/a11y\/\*\.json/);
  });
});
