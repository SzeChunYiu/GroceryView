import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const workflow = await readFile(new URL('../../.github/workflows/security.yml', import.meta.url), 'utf8');
const auditScript = await readFile(new URL('../../scripts/security/check-npm-audit.mjs', import.meta.url), 'utf8');
const waivers = await readFile(new URL('../../.github/security/npm-audit-waivers.json', import.meta.url), 'utf8');

test('security workflow gates dependency, secret, and static analysis findings', () => {
  assert.match(workflow, /dependency-audit:/);
  assert.match(workflow, /node scripts\/security\/check-npm-audit\.mjs/);
  assert.match(workflow, /gitleaks\/gitleaks-action@v2/);
  assert.match(workflow, /github\/codeql-action\/init@v4/);
  assert.match(workflow, /github\/codeql-action\/analyze@v4/);
  assert.match(workflow, /GITHUB_STEP_SUMMARY/);
  assert.match(workflow, /actions\/upload-artifact@v4/);

  assert.match(auditScript, /severity === 'high' \|\| vulnerability\.severity === 'critical'/);
  assert.match(auditScript, /expiresAt/);
  assert.match(auditScript, /process\.exit\(1\)/);
  assert.deepEqual(JSON.parse(waivers), { waivers: [] });
});
