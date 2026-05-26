import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('..', import.meta.url);

function read(relative) {
  return readFile(new URL(relative, root), 'utf8');
}

test('global error boundary reports client errors and shows retry UI', async () => {
  const source = await read('src/app/global-error.tsx');
  const route = await read('src/app/api/errors/route.ts');

  assert.match(source, /export default function GlobalError/);
  assert.match(source, /fetch\('\/api\/errors'/);
  assert.match(source, /message: error\.message \|\| 'Unknown client error'/);
  assert.match(source, /stack: error\.stack/);
  assert.match(source, /route: errorRoute\(\)/);
  assert.match(source, /keepalive: true/);
  assert.match(source, /Something went wrong/);
  assert.match(source, /onClick=\{reset\}/);

  assert.match(route, /export async function POST\(request: Request\)/);
  assert.match(route, /invalid_error_report_payload/);
  assert.match(route, /error_message_required/);
  assert.match(route, /MAX_STACK_LENGTH = 4_000/);
  assert.match(route, /Client global error reported/);
  assert.match(route, /status: 'accepted'/);
});
