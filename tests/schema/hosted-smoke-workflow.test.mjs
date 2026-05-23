import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/hosted-smoke.yml', import.meta.url), 'utf8');

describe('hosted smoke workflow', () => {
  it('runs production HTTP and PostgreSQL readiness smokes with fail-closed config', () => {
    assert.match(workflow, /workflow_dispatch:/);
    assert.match(workflow, /schedule:/);
    assert.match(workflow, /environment:\s*production/);
    assert.match(workflow, /GROCERYVIEW_API_BASE_URL/);
    assert.match(workflow, /METRICS_TOKEN/);
    assert.match(workflow, /GROCERYVIEW_PRODUCTION_URL/);
    assert.match(workflow, /GROCERYVIEW_TERMINAL_PRODUCT_ID/);
    assert.match(workflow, /GROCERYVIEW_SCANNER_USER_ID/);
    assert.match(workflow, /GROCERYVIEW_SCANNER_BEARER_TOKEN/);
    assert.match(workflow, /infra\/scripts\/smoke-hosted-http\.sh/);
    assert.match(workflow, /infra\/scripts\/smoke-hosted-readiness\.sh/);
    assert.match(workflow, /infra\/scripts\/smoke-hosted-scanner-upload\.mjs/);
    assert.match(readFileSync(new URL('../../infra/scripts/smoke-hosted-readiness.sh', import.meta.url), 'utf8'), /api\/readiness\/scanning/);
    assert.match(workflow, /HOSTED_HTTP_SMOKE_OUTPUT_PATH:\s*artifacts\/hosted-http-smoke\.json/);
    assert.match(workflow, /HOSTED_READINESS_SMOKE_OUTPUT_PATH:\s*artifacts\/hosted-readiness-smoke\.json/);
    assert.match(workflow, /HOSTED_SCANNER_UPLOAD_SMOKE_OUTPUT_PATH:\s*artifacts\/hosted-scanner-upload-smoke\.json/);
    assert.match(workflow, /actions\/upload-artifact@v4/);
  });
});
