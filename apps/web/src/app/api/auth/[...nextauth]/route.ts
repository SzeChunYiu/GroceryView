import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '';
const sessionMaxAge = 30 * 24 * 60 * 60;
const googleScopes = ['openid', 'email', 'profile'];

type JwtClaims = Record<string, unknown> & {
  exp?: number;
  iat?: number;
  sub?: string;
  userId?: string;
};

type AuthContext = { params: Promise<{ nextauth?: string[] }> | { nextauth?: string[] } };

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function signJwt(claims: JwtClaims, secret: string): string {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify(claims));
  const data = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function decodeJwt(token: string, secret: string): JwtClaims | null {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) return null;

    const data = `${encodedHeader}.${encodedPayload}`;
    const expected = createHmac('sha256', secret).update(data).digest('base64url');
    const actualSignature = Buffer.from(signature);
    const expectedSignature = Buffer.from(expected);
    if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return null;

    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8')) as { alg?: string };
    if (header.alg !== 'HS256') return null;

    const claims = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as JwtClaims;
    if (typeof claims.exp === 'number' && claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

function configuredBaseUrl(request: NextRequest): string {
  return process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? request.nextUrl.origin;
}

async function actionFrom(context: AuthContext): Promise<string[]> {
  const params = await context.params;
  return params.nextauth ?? [];
}

function sessionFromRequest(request: NextRequest) {
  const token = request.cookies.get('next-auth.session-token')?.value ?? request.cookies.get('__Secure-next-auth.session-token')?.value;
  if (!token || !authSecret) return null;
  return decodeJwt(token, authSecret);
}

function googleAuthorizeUrl(request: NextRequest): URL | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `${configuredBaseUrl(request)}/api/auth/callback/google`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', googleScopes.join(' '));
  url.searchParams.set('state', randomBytes(16).toString('base64url'));
  url.searchParams.set('prompt', 'select_account');
  return url;
}

function providersResponse(request: NextRequest) {
  return NextResponse.json({
    google: {
      id: 'google',
      name: 'Google',
      type: 'oauth',
      signinUrl: `${configuredBaseUrl(request)}/api/auth/signin/google`,
      callbackUrl: `${configuredBaseUrl(request)}/api/auth/callback/google`
    }
  });
}

export async function GET(request: NextRequest, context: AuthContext) {
  const [action, provider] = await actionFrom(context);

  if (action === 'providers') return providersResponse(request);
  if (action === 'csrf') return NextResponse.json({ csrfToken: randomBytes(16).toString('base64url') });
  if (action === 'session') {
    const claims = sessionFromRequest(request);
    return NextResponse.json({ user: claims ? { id: claims.userId ?? claims.sub, email: claims.email, name: claims.name } : null });
  }

  if (action === 'signin' && provider === 'google') {
    const authorizeUrl = googleAuthorizeUrl(request);
    if (!authorizeUrl) return NextResponse.json({ error: 'google_oauth_not_configured' }, { status: 503 });
    return NextResponse.redirect(authorizeUrl);
  }

  if (action === 'callback' && provider === 'google') {
    return NextResponse.json({ error: 'google_oauth_callback_requires_auth_service_exchange' }, { status: 501 });
  }

  return NextResponse.json({ ok: true, provider: 'google' });
}

export async function POST(request: NextRequest, context: AuthContext) {
  const [action, provider] = await actionFrom(context);
  if (action === 'signin' && provider === 'google') {
    const authorizeUrl = googleAuthorizeUrl(request);
    if (!authorizeUrl) return NextResponse.json({ error: 'google_oauth_not_configured' }, { status: 503 });
    return NextResponse.json({ url: authorizeUrl.toString() });
  }

  if (action === 'session' && authSecret) {
    const body = await request.json().catch(() => ({})) as JwtClaims;
    const issuedAt = Math.floor(Date.now() / 1000);
    return NextResponse.json({ token: signJwt({ ...body, iat: issuedAt, exp: issuedAt + sessionMaxAge }, authSecret) });
  }

  return GET(request, context);
}
