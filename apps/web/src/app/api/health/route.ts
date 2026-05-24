import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DB_PING_TIMEOUT_MS = 175;

type PgPoolLike = {
  query(text: string, values?: unknown[]): Promise<unknown>;
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string; max: number; connectionTimeoutMillis: number; idleTimeoutMillis: number }) => PgPoolLike;
};

function versionLabel() {
  return process.env.NEXT_PUBLIC_GIT_COMMIT ?? process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT ?? 'unknown';
}

async function importPgModule(): Promise<PgModuleLike> {
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = await loadModule('pg') as Partial<PgModuleLike>;
  if (!pgModule.Pool) throw new Error('pg Pool export is not available.');
  return { Pool: pgModule.Pool };
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('health_db_ping_timeout')), timeoutMs);
    })
  ]);
}

async function databaseStatus(): Promise<'ok' | 'down'> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return 'down';

  let pool: PgPoolLike | null = null;
  try {
    const pg = await importPgModule();
    pool = new pg.Pool({
      connectionString: databaseUrl,
      max: 1,
      connectionTimeoutMillis: DB_PING_TIMEOUT_MS,
      idleTimeoutMillis: DB_PING_TIMEOUT_MS
    });
    await withTimeout(pool.query('select 1'), DB_PING_TIMEOUT_MS);
    return 'ok';
  } catch {
    return 'down';
  } finally {
    if (pool) {
      await pool.end().catch(() => undefined);
    }
  }
}

export async function GET() {
  const db = await databaseStatus();
  return NextResponse.json({
    status: 'ok',
    version: versionLabel(),
    time: new Date().toISOString(),
    db
  });
}
