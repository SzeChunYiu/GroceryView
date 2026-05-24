import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (relative) => readFile(new URL(relative, root), 'utf8');

test('search telemetry gates denied-consent batches without console output', async () => {
  const telemetry = await read('src/lib/telemetry.ts');
  const consentManager = await read('src/components/consent-manager.tsx');

  assert.match(telemetry, /search_suggestion_clicked/);
  assert.match(telemetry, /search_suggestions_dismissed/);
  assert.match(telemetry, /search_first_result_time/);
  assert.match(telemetry, /search_stream_event/);
  assert.match(telemetry, /navigator\.sendBeacon/);
  assert.match(telemetry, /keepalive: true/);
  assert.match(telemetry, /const consentStorageKey = 'groceryview:consent:state'/);
  assert.match(telemetry, /function analyticsConsentGranted\(\)/);
  assert.match(telemetry, /stored\?\.policyVersion === consentPolicyVersion && stored\.categories\?\.analytics === true/);
  assert.match(telemetry, /typeof window === 'undefined' \|\| !analyticsConsentGranted\(\)\) return/);
  assert.doesNotMatch(telemetry, /console\./);

  assert.match(consentManager, /groceryviewConsent/);
  assert.match(consentManager, /publishConsentState\(\{ necessary: true, analytics: false, ads: false, personalisation: false \}\)/);
  assert.doesNotMatch(consentManager, /console\./);
});
