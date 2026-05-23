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
    assert.match(workflow, /ops:check-production-secrets -- --from-env/);
    assert.doesNotMatch(workflow, /gh secret list/);
  });

  it('deploys the verified build to the selected Vercel production project', () => {
    assert.match(workflow, /branches:\s*\[\s*main\s*\]/);
    for (const secret of [
      'DATABASE_URL',
      'GROCERYVIEW_SERVER_URL',
      'GROCERYVIEW_API_BASE_URL',
      'EXPO_TOKEN',
      'VERCEL_TOKEN',
      'VERCEL_ORG_ID',
      'VERCEL_PROJECT_ID',
      'METRICS_TOKEN',
      'AUTH_SECRET',
      'PUBLIC_WEB_URL',
      'NOTIFICATION_WEBHOOK_SECRET',
      'BILLING_WEBHOOK_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_PRICE_PREMIUM_MONTHLY',
      'STRIPE_PRICE_PREMIUM_YEARLY',
      'GROCERYVIEW_SCANNER_BEARER_TOKEN',
      'CATALOG_COVERAGE_TARGETS_JSON'
    ]) {
      assert.match(workflow, new RegExp(`${secret}:\\s*\\$\\{\\{ secrets\\.${secret} \\}\\}`));
    }
    assert.match(workflow, /VERCEL_TOKEN:\s*\$\{\{ secrets\.VERCEL_TOKEN \}\}/);
    assert.match(workflow, /VERCEL_ORG_ID:\s*\$\{\{ secrets\.VERCEL_ORG_ID \}\}/);
    assert.match(workflow, /VERCEL_PROJECT_ID:\s*\$\{\{ secrets\.VERCEL_PROJECT_ID \}\}/);
    assert.match(workflow, /npx\s+--yes\s+vercel@latest\s+pull\s+--yes\s+--environment=production\s+--token\s+"\$VERCEL_TOKEN"/);
    assert.match(workflow, /npx\s+--yes\s+vercel@latest\s+build\s+--prod\s+--token\s+"\$VERCEL_TOKEN"/);
    assert.match(workflow, /npx\s+--yes\s+vercel@latest\s+deploy\s+--prebuilt\s+--prod\s+--token\s+"\$VERCEL_TOKEN"/);
    assert.match(workflow, /infra\/scripts\/smoke-hosted-http\.sh/);
    assert.match(workflow, /infra\/scripts\/smoke-hosted-readiness\.sh/);
    assert.match(workflow, /infra\/scripts\/smoke-hosted-scanner-upload\.mjs/);
    assert.match(workflow, /HOSTED_HTTP_SMOKE_OUTPUT_PATH:\s*artifacts\/deploy-hosted-http-smoke\.json/);
    assert.match(workflow, /HOSTED_READINESS_SMOKE_OUTPUT_PATH:\s*artifacts\/deploy-hosted-readiness-smoke\.json/);
    assert.match(workflow, /HOSTED_SCANNER_UPLOAD_SMOKE_OUTPUT_PATH:\s*artifacts\/deploy-hosted-scanner-upload-smoke\.json/);
    assert.match(workflow, /actions\/upload-artifact@v4/);
    assert.doesNotMatch(workflow, /Provider-specific deploy command intentionally not wired/);
  });
});
