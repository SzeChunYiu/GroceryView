import { NextResponse } from 'next/server';
import pg from 'pg';
import packageJson from '../../../../package.json';

const { Pool } = pg;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type HealthDbStatus = 'ok' | 'down';

export async function pingDatabase(timeoutMs = 200): Promise<HealthDbStatus> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return 'down';

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: timeoutMs,
    idleTimeoutMillis: timeoutMs,
    max: 1,
    query_timeout: timeoutMs,
    statement_timeout: timeoutMs
  });

  let timeout: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      pool.query('select 1'),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('db_ping_timeout')), timeoutMs);
      })
    ]);
    return 'ok';
  } catch {
    return 'down';
  } finally {
    if (timeout) clearTimeout(timeout);
    await pool.end().catch(() => undefined);
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: packageJson.version,
    time: new Date().toISOString(),
    db: await pingDatabase()
  });
}
