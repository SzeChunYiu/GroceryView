import { Body, Controller, ForbiddenException, Get, Headers, Param, Post, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

const adminUsers = [
  { id: 'ops-admin', email: 'ops@groceryview.example', role: 'admin', status: 'active' },
  { id: 'support-1', email: 'support@groceryview.example', role: 'ops', status: 'active' }
];

type IngestionAlertSummaryRow = {
  kind: 'zero_rows' | 'price_swing' | 'missing_chain' | 'dup_ean';
  alert_count: string | number;
  connector_count: string | number;
  latest_detected_at: Date | string;
};

type IngestionAlertRecentRow = {
  id: string;
  kind: 'zero_rows' | 'price_swing' | 'missing_chain' | 'dup_ean';
  connector: string;
  detected_at: Date | string;
  payload: Record<string, unknown>;
};

function requireAdminRole(roleHeader: string | undefined) {
  if (!roleHeader) throw new UnauthorizedException('Authentication required.');
  const roles = roleHeader.split(',').map((role) => role.trim().toLowerCase());
  if (!roles.some((role) => role === 'admin' || role === 'ops')) throw new ForbiddenException('Admin or ops role required.');
}

@Controller('admin')
export class AdminController {
  constructor(private readonly postgres: PostgresQueryExecutorService) {}

  @Get('users')
  listUsers(@Headers('x-groceryview-role') roleHeader?: string) {
    requireAdminRole(roleHeader);
    return { users: adminUsers, guardrail: 'Admin user management requires an authenticated admin or ops role.' };
  }

  @Post('users/:userId/disable')
  disableUser(@Param('userId') userId: string, @Headers('x-groceryview-role') roleHeader?: string) {
    requireAdminRole(roleHeader);
    return { userId, status: 'disabled', action: 'disable' };
  }

  @Post('users/:userId/resend')
  resendInvite(@Param('userId') userId: string, @Body() body: { email?: string }, @Headers('x-groceryview-role') roleHeader?: string) {
    requireAdminRole(roleHeader);
    return { userId, email: body.email, status: 'queued', action: 'resend' };
  }

  @Get('coverage')
  async coverage(@Headers('x-groceryview-role') roleHeader?: string) {
    requireAdminRole(roleHeader);
    if (!this.postgres.isConfigured()) throw new ServiceUnavailableException('DATABASE_URL is required for admin coverage.');

    const [summary, recent] = await Promise.all([
      this.postgres.query<IngestionAlertSummaryRow>(`
        select
          kind,
          count(*) as alert_count,
          count(distinct connector) as connector_count,
          max(detected_at) as latest_detected_at
        from ingestion_alert
        where resolved_at is null
        group by kind
        order by latest_detected_at desc
      `),
      this.postgres.query<IngestionAlertRecentRow>(`
        select id::text, kind, connector, detected_at, payload
        from ingestion_alert
        where resolved_at is null
        order by detected_at desc
        limit 50
      `)
    ]);

    return {
      unresolved: summary.map((row) => ({
        kind: row.kind,
        alertCount: Number(row.alert_count),
        connectorCount: Number(row.connector_count),
        latestDetectedAt: toIso(row.latest_detected_at)
      })),
      recent: recent.map((row) => ({
        id: row.id,
        kind: row.kind,
        connector: row.connector,
        detectedAt: toIso(row.detected_at),
        payload: row.payload
      })),
      guardrail: 'Coverage anomalies are read from ingestion_alert and exclude rows with resolved_at set.'
    };
  }
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}
