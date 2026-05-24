import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('my flyer API route', () => {
  it('validates algorithm/country/limit with Zod and caches per user for one hour', async () => {
    const [route, packageJson] = await Promise.all([
      read('src/app/api/my-flyer/route.ts'),
      read('package.json')
    ]);

    assert.match(packageJson, /"zod": "\^3\.25\.76"/);
    assert.match(route, /import \{ z \} from 'zod'/);
    assert.match(route, /myFlyerQuerySchema = z\.object/);
    assert.match(route, /algorithm: z\.enum\(\['best-deals', 'ending-soon', 'nearby-savings'\]\)/);
    assert.match(route, /country: z\.enum\(\['SE', 'NO', 'IS'\]\)/);
    assert.match(route, /limit: z\.coerce\.number\(\)\.int\(\)\.min\(1\)\.max\(50\)/);
    assert.match(route, /user_id: z\.string\(\)\.trim\(\)\.min\(1\)\.max\(120\)\.default\('guest'\)/);
    assert.match(route, /CACHE_TTL_MS = 60 \* 60 \* 1000/);
    assert.match(route, /private, max-age=3600/);
    assert.match(route, /responseCache = new Map/);
    assert.match(route, /cacheKey\(query\)/);
    assert.match(route, /\[query\.user_id, query\.country, query\.algorithm, query\.limit\]/);
  });

  it('returns verified personalized flyer rows and fail-closed country payloads', async () => {
    const route = await read('src/app/api/my-flyer/route.ts');

    assert.match(route, /digitalCatalogueOfferBoard/);
    assert.match(route, /categoryDealLeaders/);
    assert.match(route, /buildMyFlyerPayload/);
    assert.match(route, /query\.country !== 'SE'/);
    assert.match(route, /No \$\{query\.country\} flyer rows are emitted/);
    assert.match(route, /Best verified flyer deals/);
    assert.match(route, /Quick wins ending soon/);
    assert.match(route, /Nearby savings by store/);
    assert.match(route, /rankRows/);
    assert.match(route, /cache: 'hit'/);
    assert.match(route, /cache: 'miss'/);
    assert.match(route, /invalid_my_flyer_query/);
  });
});
