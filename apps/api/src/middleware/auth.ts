import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { parseBearerToken, verifySessionToken, type SessionPayload } from '@groceryview/auth';

export type AuthenticatedRequest = {
  headers: {
    authorization?: string;
  };
  user?: SessionPayload;
};

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = parseBearerToken(request.headers.authorization ?? null);
    const authSecret = process.env.AUTH_SECRET;
    if (!token || !authSecret) throw new UnauthorizedException('Authentication required.');

    try {
      request.user = await verifySessionToken(token, authSecret);
      return true;
    } catch {
      throw new UnauthorizedException('Authentication required.');
    }
  }
}

export function authenticatedUserId(request: AuthenticatedRequest): string {
  if (!request.user?.userId) throw new UnauthorizedException('Authentication required.');
  return request.user.userId;
}
