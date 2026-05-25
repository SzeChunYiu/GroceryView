import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { authenticateBearerHeader, type SessionPayload } from '../lib/jwt.js';
import { alertsRoutes } from '../routes/alerts.js';
import { listsRoutes } from '../routes/lists.js';
import { settingsRoutes } from '../routes/settings.js';

export type AuthenticatedRequest = {
  headers: {
    authorization?: string | string[];
  };
  method?: string;
  originalUrl?: string;
  url?: string;
  user?: SessionPayload;
};

type AuthMiddlewareResponse = {
  end?: (body?: string) => void;
  json?: (body: unknown) => void;
  setHeader?: (name: string, value: string) => void;
  status?: (statusCode: number) => AuthMiddlewareResponse;
  statusCode?: number;
};

type AuthMiddlewareNext = () => void;

export const jwtProtectedApiRoutes = [
  `/${listsRoutes.lists}`,
  `/${alertsRoutes.alerts}`,
  `/${settingsRoutes.settings}`
] as const;

function firstAuthorizationHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function requestPath(request: AuthenticatedRequest) {
  const rawUrl = request.originalUrl ?? request.url ?? '';
  try {
    return new URL(rawUrl, 'http://groceryview.local').pathname.replace(/\/+$/, '') || '/';
  } catch {
    return rawUrl.split('?')[0]?.replace(/\/+$/, '') || '/';
  }
}

function pathRequiresJwt(pathname: string, protectedRoutes: readonly string[]) {
  return protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function rejectUnauthorized(response: AuthMiddlewareResponse) {
  const body = { error: 'authentication_required' };
  if (response.status && response.json) {
    response.status(401).json(body);
    return;
  }

  response.statusCode = 401;
  response.setHeader?.('content-type', 'application/json');
  response.end?.(JSON.stringify(body));
}

export function createJwtAuthMiddleware(protectedRoutes: readonly string[] = jwtProtectedApiRoutes) {
  return async (request: AuthenticatedRequest, response: AuthMiddlewareResponse, next: AuthMiddlewareNext) => {
    if ((request.method ?? '').toUpperCase() === 'OPTIONS') {
      next();
      return;
    }

    if (!pathRequiresJwt(requestPath(request), protectedRoutes)) {
      next();
      return;
    }

    const user = await authenticateBearerHeader(firstAuthorizationHeader(request.headers.authorization));
    if (!user) {
      rejectUnauthorized(response);
      return;
    }

    request.user = user;
    next();
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await authenticateBearerHeader(firstAuthorizationHeader(request.headers.authorization));
    if (!user) throw new UnauthorizedException('Authentication required.');

    request.user = user;
    return true;
  }
}

export function authenticatedUserId(request: AuthenticatedRequest): string {
  if (!request.user?.userId) throw new UnauthorizedException('Authentication required.');
  return request.user.userId;
}
