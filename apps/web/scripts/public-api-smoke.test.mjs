import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

const webRoot = resolve(new URL('..', import.meta.url).pathname);
const apiHelper = readFileSync(resolve(webRoot, 'src/lib/public-api.ts'), 'utf8');
const readRoute = readFileSync(resolve(webRoot, 'src/app/api/public/v1/route.ts'), 'utf8');
const keyRoute = readFileSync(resolve(webRoot, 'src/app/api/public/keys/route.ts'), 'utf8');
const docsPage = readFileSync(resolve(webRoot, 'src/app/developers/api/page.tsx'), 'utf8');

describe('public price-nutrition API smoke contract', () => {
  it('documents and exposes every promised read resource', () => {
    for (const resource of ['products', 'current-prices', 'price-history', 'nutrition', 'allergens-labels', 'stores', 'comparisons']) {
      assert.match(apiHelper, new RegExp(`['\"]${resource}['\"]`));
      assert.match(docsPage, new RegExp(resource));
    }
  });

  it('requires issued keys and returns rate-limit and safety terms', () => {
    assert.match(readRoute, /public_api_key_required/);
    assert.match(readRoute, /X-RateLimit-Limit/);
    assert.match(keyRoute, /acceptedTerms/);
    assert.match(apiHelper, /not medical advice/);
  });
});
