import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export type AdminRole = 'admin' | 'super-admin';

const ROLE_HEADER = 'x-admin-role';
const ROLE_METADATA_KEY = 'admin-required-role';

export function requiredAdminRole(role: AdminRole) {
  return Reflect.metadata(ROLE_METADATA_KEY, role);
}

function parseRole(raw?: string | string[] | null): AdminRole | null {
  const role = Array.isArray(raw) ? raw[0] : raw ?? null;
  if (role === 'admin' || role === 'super-admin') return role;
  return null;
}

function isSuperAdmin(role: AdminRole | null): role is 'super-admin' {
  return role === 'super-admin';
}

@Injectable()
export class AdminAuthMiddleware implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminRole>(ROLE_METADATA_KEY, [
      context.getHandler(),
      context.getClass()
    ]) ?? 'admin';

    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[]> }>();
    const role = parseRole(request.headers[ROLE_HEADER]);

    if (!role) {
      throw new ForbiddenException('Missing admin role header');
    }

    if (required === 'super-admin' && !isSuperAdmin(role)) {
      throw new ForbiddenException('Super-admin role is required for this endpoint');
    }

    if (required === 'admin' && role !== 'admin' && role !== 'super-admin') {
      throw new ForbiddenException('Admin role is required for this endpoint');
    }

    return true;
  }
}
