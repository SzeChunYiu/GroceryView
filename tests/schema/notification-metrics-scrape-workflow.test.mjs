import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../../.github/workflows/notification-metrics-scrape.yml', import.meta.url), 'utf8');

describe('notification metrics scrape workflow', () => {
  it('scrapes production notification metrics on a schedule with fail-closed config and artifacts', () => {
    assert.match(workflow, /workflow_dispatch:/);
    assert.match(workflow, /schedule:/);
    assert.match(workflow, /environment:\s*production/);
    assert.match(workflow, /GROCERYVIEW_API_BASE_URL/);
    assert.match(workflow, /METRICS_TOKEN/);
    assert.match(workflow, /\/api\/metrics\/notifications/);
    assert.match(workflow, /x-groceryview-metrics-token: \$METRICS_TOKEN/);
    assert.match(workflow, /groceryview_notification_worker_events_total/);
    assert.match(workflow, /notification-metrics\.prom/);
    assert.match(workflow, /actions\/upload-artifact@v4/);
  });
});
