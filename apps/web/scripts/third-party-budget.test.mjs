import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { describe, it } from 'node:test';

const webRoot = resolve(new URL('..', import.meta.url).pathname);
const repoRoot = resolve(webRoot, '../..');
const thirdPartyLoading = await readFile(resolve(webRoot, 'src/lib/third-party-loading.ts'), 'utf8');
const consentSafeFrame = await readFile(resolve(webRoot, 'src/components/consent-safe-third-party-frame.tsx'), 'utf8');
const storeMap = await readFile(resolve(webRoot, 'src/components/StoreMap.tsx'), 'utf8');

async function sourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'ingested' || entry.name === '.next' || entry.name === 'node_modules') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nestedFiles = await sourceFiles(path);
      files.push(...nestedFiles);
    } else if (/\.(tsx?|jsx?|mjs)$/.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

describe('third-party loading budget', () => {
  it('inventories analytics, ads, maps, charts, tag managers, and widgets', () => {
    for (const category of ['analytics', 'ads', 'maps', 'charts', 'tag-manager', 'widget']) {
      assert.match(thirdPartyLoading, new RegExp(`category: '${category}'`));
    }
    assert.match(thirdPartyLoading, /THIRD_PARTY_TOTAL_JS_BUDGET_BYTES = 70_000/);
    assert.match(thirdPartyLoading, /THIRD_PARTY_LONG_TASK_BUDGET_MS = 50/);
    assert.match(thirdPartyLoading, /maxInitialJsBytes/);
    assert.match(thirdPartyLoading, /maxLongTaskMs/);
    assert.match(thirdPartyLoading, /canLoadConsentSafeThirdPartyScript/);
    assert.match(thirdPartyLoading, /loadConsentSafeThirdPartyScript/);
    assert.match(thirdPartyLoading, /document\.createElement\('script'\)/);
  });

  it('gates Google Maps embeds on consent, visibility, and shopper interaction', () => {
    assert.match(storeMap, /ConsentSafeThirdPartyFrame/);
    assert.match(storeMap, /vendorId="google-maps-embed"/);
    assert.match(storeMap, /consentCategory="personalisation"/);
    assert.match(consentSafeFrame, /IntersectionObserver/);
    assert.match(consentSafeFrame, /groceryview:consent-updated/);
    assert.match(consentSafeFrame, /hasConsent && hasInteraction && isVisible/);
    assert.match(consentSafeFrame, /src=\{src\}/);
  });

  it('keeps raw third-party scripts out of source files', async () => {
    const files = await sourceFiles(resolve(webRoot, 'src'));
    const violations = [];
    for (const file of files) {
      const text = await readFile(file, 'utf8');
      const isLoader = relative(repoRoot, file) === 'apps/web/src/lib/third-party-loading.ts';
      if (!isLoader && (/<Script[\s>]/.test(text) || /<script[^>]+src=["']https?:\/\//i.test(text) || /createElement\(["']script["']\)/.test(text))) {
        violations.push(relative(repoRoot, file));
      }
    }
    assert.deepEqual(violations, []);
  });
});
