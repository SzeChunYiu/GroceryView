// @ts-ignore pg may resolve to its ESM entry (pg/esm/index.mjs) with no .d.ts under
// apps/web depending on build order; @ts-ignore (not @ts-expect-error) so it neither
// errors when pg is untyped (TS7016) nor when it resolves cleanly (unused-directive).
import pg from 'pg';

const { Pool } = pg;

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
