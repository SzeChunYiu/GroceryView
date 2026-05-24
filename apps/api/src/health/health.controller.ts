import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { pingDatabase, type DatabasePingResult } from '@groceryview/db';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

type ScraperLastRunRow = {
  lastRunAt: Date | string | null;
};

async function readScraperLastRun(executor: PostgresQueryExecutorService): Promise<string | null> {
  try {
    const rows = await executor.query<ScraperLastRunRow>(
      'select max(finished_at) as "lastRunAt" from connector_runs'
    );
    const lastRunAt = rows[0]?.lastRunAt;
    return lastRunAt ? new Date(lastRunAt).toISOString() : null;
  } catch {
    return null;
  }
}

function healthStatus(database: DatabasePingResult) {
  return database.ok ? 'ok' : 'degraded';
}

@ApiTags('health')
@Controller(['health', 'api/health'])
export class HealthController {
  constructor(private readonly executor: PostgresQueryExecutorService) {}

  @Get()
  @ApiOkResponse({ description: 'Service health' })
  async health() {
    const database = await pingDatabase(this.executor);
    const scraperLastRunAt = database.ok ? await readScraperLastRun(this.executor) : null;

    return {
      status: healthStatus(database),
      database: {
        ok: database.ok,
        latencyMs: database.latencyMs,
        error: database.error
      },
      scraper: {
        lastRunAt: scraperLastRunAt
      },
      version: process.env.APP_VERSION ?? process.env.npm_package_version ?? '0.1.0'
    };
  }
}
