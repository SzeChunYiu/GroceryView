import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('..', import.meta.url);

function read(relative) {
  return readFile(new URL(relative, root), 'utf8');
}

test('safe error taxonomy covers user and operator messages', async () => {
  const source = await read('src/lib/safe-errors.ts');
  const screenerError = await read('src/app/screener/error.tsx');
  const apiRoute = await read('src/app/api/errors/route.ts');

  for (const code of ['source_blocked', 'stale_data', 'no_coverage', 'parser_drift', 'auth_required', 'rate_limited', 'validation_failed']) {
    assert.match(source, new RegExp(code));
  }
  assert.match(source, /userMessage/);
  assert.match(source, /operatorErrorLog/);
  assert.match(screenerError, /safeErrorMessage/);
  assert.match(screenerError, /safeError.userMessage/);
  assert.match(apiRoute, /operatorErrorLog/);
  assert.match(apiRoute, /safeErrorMessage/);
});
