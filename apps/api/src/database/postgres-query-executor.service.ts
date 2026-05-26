import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { loadDatabaseConfig, toPgPoolOptions } from '../lib/db.js';
import { recordDatabaseCheckout } from './connection-usage.js';

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
  Pool: new (config: NonNullable<ReturnType<typeof toPgPoolOptions>>) => PgPoolLike;
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
    return Boolean(loadDatabaseConfig().connectionString);
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const executor = await this.getExecutor();
    if (!executor) throw new Error('DATABASE_URL is not configured.');
    return recordDatabaseCheckout(() => executor.query<T>(sql, params));
  }

  async onModuleDestroy(): Promise<void> {
    if (this.pool) await this.pool.end();
  }

  private async getExecutor(): Promise<QueryExecutor | null> {
    if (this.executor !== undefined) return this.executor;
    const poolOptions = toPgPoolOptions(loadDatabaseConfig());
    if (!poolOptions) {
      this.executor = null;
      return null;
    }
    const pgModule = await importPgModule();
    this.pool = new pgModule.Pool(poolOptions);
    this.executor = {
      query: async <T>(sql: string, params: unknown[] = []) => {
        const result = await this.pool!.query(sql, params);
        return result.rows as T[];
      }
    };
    return this.executor;
  }
}
