import { Controller, Get, HttpCode, NotFoundException, Param, Post, Query, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  buildAdminUserListQuery,
  buildDisableAdminUserQuery,
  buildResendVerificationAdminUserQuery
} from '@groceryview/db';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';
import { adminRoutes } from '../routes/admin.js';

type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string | Date;
  disabled_at: string | Date | null;
  verification_sent_at: string | Date | null;
  active_alert_count?: number | string;
};

function toIso(value: string | Date | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toAdminUser(row: AdminUserRow) {
  const disabledAt = toIso(row.disabled_at);

  return {
    id: row.id,
    email: row.email,
    registeredAt: toIso(row.created_at),
    disabledAt,
    verificationSentAt: toIso(row.verification_sent_at),
    activeAlertCount: Number(row.active_alert_count ?? 0),
    status: disabledAt ? 'disabled' : 'active'
  };
}

@ApiTags('admin')
@Controller(adminRoutes.users)
export class AdminController {
  constructor(private readonly db: PostgresQueryExecutorService) {}

  @Get()
  @ApiOkResponse({ description: adminRoutes.usersDescription })
  async users(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    if (!this.db.isConfigured()) throw new ServiceUnavailableException('DATABASE_URL is required for admin user management.');

    const query = buildAdminUserListQuery(Number(limit ?? 50), Number(offset ?? 0));
    const rows = await this.db.query<AdminUserRow>(query.sql, query.values);

    return {
      users: rows.map(toAdminUser),
      limit: query.values[0],
      offset: query.values[1]
    };
  }

  @Post(adminRoutes.disableUser)
  @HttpCode(200)
  @ApiOkResponse({ description: adminRoutes.disableUserDescription })
  async disableUser(@Param('userId') userId: string) {
    if (!this.db.isConfigured()) throw new ServiceUnavailableException('DATABASE_URL is required for admin user management.');

    const query = buildDisableAdminUserQuery(userId);
    const [row] = await this.db.query<AdminUserRow>(query.sql, query.values);
    if (!row) throw new NotFoundException('User not found.');

    return { action: query.action, user: toAdminUser(row) };
  }

  @Post(adminRoutes.resendVerification)
  @HttpCode(200)
  @ApiOkResponse({ description: adminRoutes.resendVerificationDescription })
  async resendVerification(@Param('userId') userId: string) {
    if (!this.db.isConfigured()) throw new ServiceUnavailableException('DATABASE_URL is required for admin user management.');

    const query = buildResendVerificationAdminUserQuery(userId);
    const [row] = await this.db.query<AdminUserRow>(query.sql, query.values);
    if (!row) throw new NotFoundException('User not found.');

    return { action: query.action, user: toAdminUser(row) };
  }
}
