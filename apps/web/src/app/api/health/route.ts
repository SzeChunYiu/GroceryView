import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const healthCheckTimeoutMs = 200;
const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.npm_package_version ?? '0.1.0';

type PgPoolLike = {
  query(text: string, values?: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number; connectionTimeoutMillis: number }) => PgPoolLike;
};

async function importPgModule(): Promise<PgModuleLike> {
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = await loadModule('pg') as Partial<PgModuleLike>;
  if (!pgModule.Pool) throw new Error('pg Pool export is not available.');
  return { Pool: pgModule.Pool };
}

function timeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('health_db_ping_timeout')), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function pingDatabase(): Promise<'ok' | 'down'> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return 'down';

  let pool: PgPoolLike | null = null;
  try {
    const pg = await importPgModule();
    pool = new pg.Pool({ connectionString: databaseUrl, max: 1, connectionTimeoutMillis: healthCheckTimeoutMs });
    await timeout(pool.query('select 1', []), healthCheckTimeoutMs);
    return 'ok';
  } catch (error) {
    console.error('Health DB ping failed', error instanceof Error ? { name: error.name, message: error.message } : { name: 'unknown' });
    return 'down';
  } finally {
    if (pool) await pool.end().catch(() => undefined);
  }
}

export async function GET() {
  const db = await pingDatabase();
  return NextResponse.json({
    status: 'ok',
    version: appVersion,
    time: new Date().toISOString(),
    db
  });
}
