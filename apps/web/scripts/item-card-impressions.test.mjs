import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const analyticsSource = new URL('../src/lib/analytics.ts', import.meta.url);

function extractFunction(source, functionName) {
  const marker = `export function ${functionName}`;
  const start = source.indexOf(marker);
  if (start < 0) return '';

  const bodyStart = source.indexOf('{', start);
  if (bodyStart < 0) return '';

  let depth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    const char = source[i];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  return '';
}

test('hasAnalyticsConsent reads consent state from localStorage and only changes after persisted consent', async () => {
  const source = await readFile(analyticsSource, 'utf8');

  assert.match(source, /const CONSENT_STORAGE_KEY = 'groceryview:consent:state'/);
  assert.match(source, /function readConsentState/);
  assert.match(source, /localStorage\.getItem\(CONSENT_STORAGE_KEY\)/);
  assert.match(source, /JSON\.parse\(/);

  const hasAnalyticsConsentFunction = extractFunction(source, 'hasAnalyticsConsent');
  assert.ok(hasAnalyticsConsentFunction.length > 0);
  assert.match(hasAnalyticsConsentFunction, /return hasAnalyticsFlag\(readConsentState\(\)\)/);

  const hasAnalyticsFlagFunction = extractFunction(source, 'hasAnalyticsFlag');
  assert.ok(hasAnalyticsFlagFunction.length > 0);
  assert.match(hasAnalyticsFlagFunction, /payload\.categories/);
  assert.match(hasAnalyticsFlagFunction, /payload\.analytics === true/);
});

