import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { z } from 'zod';

async function loadNotificationsRoute() {
  const source = await readFile(new URL('../src/app/api/notifications/route.ts', import.meta.url), 'utf8');
  const executable = source
    .replace("import { NextResponse } from 'next/server';", 'const NextResponse = { json: (body, init) => Response.json(body, init) };')
    .replace("import { z } from 'zod';", '')
    .replace(/error: z\.ZodError/g, 'error')
    .replace(/request: Request/g, 'request')
    .replace(/export const /g, 'const ')
    .replace('export async function GET(request)', 'async function GET(request)')
    .replace('export async function POST(request)', 'async function POST(request)');

  return Function('z', `${executable}; return { GET, POST };`)(z);
}

test('notifications route validates accepted params and returns structured issues', async () => {
  const { GET, POST } = await loadNotificationsRoute();

  const accepted = await GET(new Request('https://groceryview.test/api/notifications?userId=family-1&limit=5&status=unread'));
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), {
    notifications: [],
    params: { userId: 'family-1', limit: 5, status: 'unread' },
    source: 'notification-preferences-and-alert-events'
  });

  const rejected = await POST(new Request('https://groceryview.test/api/notifications?extra=1', {
    method: 'POST',
    body: JSON.stringify({ userId: '', type: 'unknown', message: '' })
  }));
  assert.equal(rejected.status, 400);
  const body = await rejected.json();
  assert.equal(body.error, 'invalid_notification_params');
  assert.ok(Array.isArray(body.issues));
  assert.ok(body.issues.some((issue) => issue.path === 'userId'));
  assert.ok(body.issues.some((issue) => issue.path === 'type'));
  assert.ok(body.issues.some((issue) => /Unrecognized key/.test(issue.message)));
});
