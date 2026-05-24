export type HealthcheckQueryExecutor = {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

export type DatabasePingResult = {
  ok: boolean;
  latencyMs: number;
  error?: string;
};

export async function pingDatabase(executor: HealthcheckQueryExecutor): Promise<DatabasePingResult> {
  const startedAt = performance.now();

  try {
    await executor.query('select 1 as ok');
    return { ok: true, latencyMs: Math.round(performance.now() - startedAt) };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : 'Unknown database ping failure'
    };
  }
}
