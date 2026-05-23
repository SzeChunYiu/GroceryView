import { Injectable, OnModuleDestroy } from '@nestjs/common';

export type QueryExecutor = {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

type PgLikeClient = {
  query(text: string, values: unknown[]): Promise<{ rows: unknown[] }>;
};

type PgPoolLike = PgLikeClient & {
  end(): Promise<void>;
};

type PgModuleLike = {
  Pool: new (config: { connectionString: string }) => PgPoolLike;
};

async function importPgModule(): Promise<PgModuleLike> {
  const loadModule = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
  const pgModule = await loadModule('pg') as Partial<PgModuleLike>;
  if (!pgModule.Pool) throw new Error('pg Pool export is not available.');
  return { Pool: pgModule.Pool };
}

@Injectable()
export class PostgresQueryExecutorService implements QueryExecutor, OnModuleDestroy {
  private executor: QueryExecutor | null | undefined;
  private pool: PgPoolLike | null = null;

  isConfigured(): boolean {
    return Boolean(process.env.DATABASE_URL);
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const executor = await this.getExecutor();
    if (!executor) throw new Error('DATABASE_URL is not configured.');
    return executor.query<T>(sql, params);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) await this.pool.end();
  }

  private async getExecutor(): Promise<QueryExecutor | null> {
    if (this.executor !== undefined) return this.executor;
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      this.executor = null;
      return null;
    }
    const pgModule = await importPgModule();
    this.pool = new pgModule.Pool({ connectionString: databaseUrl });
    this.executor = {
      query: async <T>(sql: string, params: unknown[] = []) => {
        const result = await this.pool!.query(sql, params);
        return result.rows as T[];
      }
    };
    return this.executor;
  }
}
