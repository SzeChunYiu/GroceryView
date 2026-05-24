export type ApiDatabaseConfig = {
  connectionString: string | undefined;
  directConnectionString: string | undefined;
  poolMode: 'pgbouncer' | 'direct' | 'prisma-accelerate';
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  statementTimeoutMillis: number;
};

// PgBouncer is the default deployment mode: point PGBOUNCER_DATABASE_URL
// or DATABASE_POOL_URL at the pooler, keep DIRECT_DATABASE_URL for one-off
// migrations, and tune DATABASE_POOL_MAX below PgBouncer's DEFAULT_POOL_SIZE.
function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePoolMode(value: string | undefined): ApiDatabaseConfig['poolMode'] {
  if (value === 'direct' || value === 'prisma-accelerate') return value;
  return 'pgbouncer';
}

export function loadDatabaseConfig(env: NodeJS.ProcessEnv = process.env): ApiDatabaseConfig {
  const poolMode = parsePoolMode(env.DATABASE_POOL_MODE);
  const pooledConnectionString = env.PGBOUNCER_DATABASE_URL || env.DATABASE_POOL_URL || env.DATABASE_URL;
  const directConnectionString = env.DIRECT_DATABASE_URL || env.DATABASE_URL;

  return {
    connectionString: poolMode === 'direct' ? directConnectionString : pooledConnectionString,
    directConnectionString,
    poolMode,
    maxConnections: parsePositiveInteger(env.DATABASE_POOL_MAX, poolMode === 'pgbouncer' ? 10 : 20),
    idleTimeoutMillis: parsePositiveInteger(env.DATABASE_POOL_IDLE_TIMEOUT_MS, 30_000),
    connectionTimeoutMillis: parsePositiveInteger(env.DATABASE_POOL_CONNECT_TIMEOUT_MS, 5_000),
    statementTimeoutMillis: parsePositiveInteger(env.DATABASE_STATEMENT_TIMEOUT_MS, 30_000)
  };
}

export function toPgPoolOptions(config: ApiDatabaseConfig) {
  if (!config.connectionString) return null;
  return {
    connectionString: config.connectionString,
    connectionTimeoutMillis: config.connectionTimeoutMillis,
    idleTimeoutMillis: config.idleTimeoutMillis,
    max: config.maxConnections,
    statement_timeout: config.statementTimeoutMillis
  };
}
