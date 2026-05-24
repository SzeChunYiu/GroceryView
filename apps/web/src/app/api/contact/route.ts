import { appendFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const contactLogPath = '/tmp/contact.jsonl';

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ContactPayload;
    const name = normalizeText(payload.name);
    const email = normalizeText(payload.email);
    const message = normalizeText(payload.message);

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'name, email, and message are required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'email must be valid' }, { status: 400 });
    }

    await appendFile(
      contactLogPath,
      `${JSON.stringify({ name, email, message, receivedAt: new Date().toISOString() })}\n`,
      'utf8'
    );

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return NextResponse.json({ error: 'invalid contact request' }, { status: 400 });
  }
}
