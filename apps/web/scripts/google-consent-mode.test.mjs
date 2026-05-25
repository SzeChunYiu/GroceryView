import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

const webRoot = resolve(new URL('..', import.meta.url).pathname);
const consentManager = readFileSync(resolve(webRoot, 'src/components/consent-manager.tsx'), 'utf8');
const analytics = readFileSync(resolve(webRoot, 'src/lib/analytics.ts'), 'utf8');

describe('Google Consent Mode v2 wiring', () => {
  it('initializes denied defaults for all v2 storage signals before optional tags', () => {
    for (const signal of ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization']) {
      assert.match(consentManager, new RegExp(`${signal}: 'denied'`));
    }
    assert.match(consentManager, /gtag\('consent', 'default', deniedConsentMode\)/);
    assert.match(consentManager, /wait_for_update: 500/);
  });

  it('updates Google tag behavior from stored category consent only', () => {
    assert.match(consentManager, /gtag\('consent', 'update', consentModeFor\(consent\)\)/);
    assert.match(consentManager, /ads_data_redaction', !consent\.ads/);
    assert.match(consentManager, /allow_ad_personalization_signals', consent\.ads && consent\.personalisation/);
    assert.match(analytics, /!analyticsConsentGranted\(\)\) return/);
  });
});
