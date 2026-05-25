import { appendFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ContactPayload = {
  email?: unknown;
  message?: unknown;
  name?: unknown;
};

function invalidContactRequest(message: string) {
  return NextResponse.json({ error: 'invalid_contact_request', message }, { status: 400 });
}

function normalizePayload(payload: ContactPayload) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const message = typeof payload.message === 'string' ? payload.message.trim() : '';

  if (name.length < 2) return { error: 'name must be at least 2 characters.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'email must be a valid email address.' };
  if (message.length < 10) return { error: 'message must be at least 10 characters.' };

  return { value: { email, message, name } };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return invalidContactRequest('Send JSON with name, email, and message.');
  }

  const normalized = normalizePayload(payload as ContactPayload);
  if ('error' in normalized) return invalidContactRequest(normalized.error);

  try {
    await appendFile('/tmp/contact.jsonl', `${JSON.stringify({ ...normalized.value, receivedAt: new Date().toISOString() })}\n`, 'utf8');
  } catch (error) {
    return NextResponse.json(
      {
        error: 'contact_log_failed',
        message: error instanceof Error ? error.message : 'Unable to write contact message.'
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
