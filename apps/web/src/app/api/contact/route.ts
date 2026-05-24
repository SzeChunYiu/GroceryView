import { randomUUID } from 'node:crypto';
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, isAbsolute, join } from 'node:path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const defaultContactSubmissionsPath = 'data/contact-submissions.jsonl';

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  message: string;
  receivedAt: string;
};

type ContactStorageAdapter = {
  append(submission: ContactSubmission): Promise<void>;
};

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function configuredContactSubmissionsPath() {
  const configuredPath = process.env.CONTACT_SUBMISSIONS_PATH?.trim() || defaultContactSubmissionsPath;
  return isAbsolute(configuredPath) ? configuredPath : join(process.cwd(), configuredPath);
}

function createJsonlContactStorageAdapter(filePath = configuredContactSubmissionsPath()): ContactStorageAdapter {
  return {
    async append(submission) {
      await mkdir(dirname(filePath), { recursive: true });
      await appendFile(filePath, `${JSON.stringify(submission)}\n`, { encoding: 'utf8', flag: 'a' });
    }
  };
}

async function persistContactSubmission(submission: ContactSubmission, adapter = createJsonlContactStorageAdapter()) {
  await adapter.append(submission);
}

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: 'invalid contact request' }, { status: 400 });
  }

  const name = normalizeText(payload.name);
  const email = normalizeText(payload.email);
  const message = normalizeText(payload.message);

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'name, email, and message are required' }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'email must be valid' }, { status: 400 });
  }

  try {
    await persistContactSubmission({
      id: randomUUID(),
      name,
      email,
      message,
      receivedAt: new Date().toISOString()
    });
  } catch {
    return NextResponse.json({ error: 'contact submission could not be persisted' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 202 });
}
