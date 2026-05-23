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
    assert.match(workflow, /ops:check-production-secrets -- --repo "\$GITHUB_REPOSITORY" --env production/);
    assert.match(workflow, /GH_TOKEN:\s*\$\{\{ secrets\.GITHUB_TOKEN \}\}/);
  });

  it('deploys the verified build to the selected Vercel production project', () => {
    assert.match(workflow, /branches:\s*\[\s*main\s*\]/);
    assert.match(workflow, /ops:check-production-secrets -- --repo "\$GITHUB_REPOSITORY" --env production/);
    assert.match(workflow, /GH_TOKEN:\s*\$\{\{ secrets\.GITHUB_TOKEN \}\}/);
    assert.match(workflow, /VERCEL_TOKEN:\s*\$\{\{ secrets\.VERCEL_TOKEN \}\}/);
    assert.match(workflow, /VERCEL_ORG_ID:\s*\$\{\{ secrets\.VERCEL_ORG_ID \}\}/);
    assert.match(workflow, /VERCEL_PROJECT_ID:\s*\$\{\{ secrets\.VERCEL_PROJECT_ID \}\}/);
    assert.match(workflow, /npx\s+--yes\s+vercel@latest\s+pull\s+--yes\s+--environment=production\s+--token\s+"\$VERCEL_TOKEN"/);
    assert.match(workflow, /npx\s+--yes\s+vercel@latest\s+build\s+--prod\s+--token\s+"\$VERCEL_TOKEN"/);
    assert.match(workflow, /npx\s+--yes\s+vercel@latest\s+deploy\s+--prebuilt\s+--prod\s+--token\s+"\$VERCEL_TOKEN"/);
    assert.doesNotMatch(workflow, /Provider-specific deploy command intentionally not wired/);
  });
});
