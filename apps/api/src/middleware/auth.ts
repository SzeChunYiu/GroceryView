import { createHmac, timingSafeEqual } from 'crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { parseBearerToken, verifySessionToken, type SessionPayload } from '@groceryview/auth';

export type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  user?: SessionPayload;
};

type JwtClaims = {
  exp?: number;
  sub?: string;
  userId?: string;
};

function verifyGoogleOAuthSessionToken(token: string, secret: string): SessionPayload | null {
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

    const userId = claims.userId ?? claims.sub;
    return userId ? ({ userId } as SessionPayload) : null;
  } catch {
    return null;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = parseBearerToken(request.headers.authorization ?? null);
    const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    if (!token || !authSecret) throw new UnauthorizedException('Authentication required.');

    try {
      request.user = await verifySessionToken(token, authSecret);
      return true;
    } catch {
      const oauthSession = verifyGoogleOAuthSessionToken(token, authSecret);
      if (oauthSession) {
        request.user = oauthSession;
        return true;
      }
      throw new UnauthorizedException('Authentication required.');
    }
  }
}

export function authenticatedUserId(request: AuthenticatedRequest): string {
  if (!request.user?.userId) throw new UnauthorizedException('Authentication required.');
  return request.user.userId;
}
