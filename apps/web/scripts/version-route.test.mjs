import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

describe('version API route', () => {
  it('returns build metadata from environment variables with immutable caching', async () => {
    const route = await read('src/app/api/version/route.ts');

    assert.match(route, /export const dynamic = 'force-static'/);
    assert.match(route, /NEXT_PUBLIC_GIT_COMMIT/);
    assert.match(route, /VERCEL_GIT_COMMIT_SHA/);
    assert.match(route, /NEXT_PUBLIC_BUILT_AT/);
    assert.match(route, /BUILD_TIME/);
    assert.match(route, /NEXT_PUBLIC_APP_ENV/);
    assert.match(route, /Cache-Control/);
    assert.match(route, /immutable/);
    assert.match(route, /commit/);
    assert.match(route, /builtAt/);
    assert.match(route, /env/);
  });
});
