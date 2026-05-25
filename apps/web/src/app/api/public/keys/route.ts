import { NextResponse } from 'next/server';
import { issuePublicApiKey, publicApiDisclaimers, publicApiRateLimit, publicApiSmokeExamples, publicApiVersion } from '@/lib/public-api';

export const runtime = 'nodejs';

function invalidKeyRequest(message: string) {
  return NextResponse.json({ error: 'invalid_public_api_key_request', message }, { status: 400 });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return invalidKeyRequest('Send JSON with contact, purpose, and acceptedTerms=true.');
  }

  const body = payload as { contact?: unknown; purpose?: unknown; acceptedTerms?: unknown };
  const contact = typeof body.contact === 'string' ? body.contact.trim() : '';
  const purpose = typeof body.purpose === 'string' ? body.purpose.trim() : '';

  if (contact.length < 5 || !contact.includes('@')) return invalidKeyRequest('contact must be a valid email-like address.');
  if (purpose.length < 8) return invalidKeyRequest('purpose must describe the public data use.');
  if (body.acceptedTerms !== true) return invalidKeyRequest('acceptedTerms must be true.');

  return NextResponse.json({
    apiKey: issuePublicApiKey(contact, purpose),
    version: publicApiVersion,
    rateLimit: publicApiRateLimit,
    terms: publicApiDisclaimers,
    docs: '/developers/api',
    smoke: publicApiSmokeExamples()
  });
}
