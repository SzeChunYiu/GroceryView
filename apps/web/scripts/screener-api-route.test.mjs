import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('screener API route validation', () => {
  it('covers one happy and one rejected Zod-validated input', async () => {
    const route = await read('src/app/api/screener/route.ts');

    assert.match(route, /screenerParamsSchema = z\.object/);
    assert.match(route, /happy: \{ category: 'fruit', min_discount: '20', sort: 'biggest-drop' \}/);
    assert.match(route, /rejected: \{ category: 'fruit', min_discount: 'too-high', sort: 'random' \}/);
    assert.match(route, /screenerParamsSchema\.safeParse\(input\)/);
    assert.match(route, /status: 400/);
    assert.match(route, /\{ error: 'invalid_screener_params', issues: parsed\.error\.issues \}/);
  });
});
