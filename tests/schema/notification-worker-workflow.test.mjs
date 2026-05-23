import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/notification-worker.yml', import.meta.url), 'utf8');

describe('notification worker workflow', () => {
  it('runs the protected notification worker endpoint on a schedule with required production secrets', () => {
    assert.match(workflow, /schedule:/);
    assert.match(workflow, /cron:\s*['"]\d+\s+\*\/2\s+\*\s+\*\s+\*['"]/);
    assert.match(workflow, /workflow_dispatch:/);
    assert.match(workflow, /timeout-minutes:\s*10/);
    assert.match(workflow, /environment:\s*production/);

    for (const requiredSecret of ['GROCERYVIEW_API_BASE_URL', 'METRICS_TOKEN']) {
      assert.match(workflow, new RegExp(`missing production config: ${requiredSecret}`));
    }

    assert.match(workflow, /\/api\/workers\/notifications\/run/);
    assert.match(workflow, /authorization: Bearer \$\{\{ secrets\.METRICS_TOKEN \}\}/);
    assert.match(workflow, /body\.report\?\.status !== 'healthy'/);
    assert.match(workflow, /body\.summary\?\.deadLettered/);
    assert.match(workflow, /body\.summary\?\.retryScheduled/);
  });
});
