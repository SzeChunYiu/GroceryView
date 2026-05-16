import type { DataSourceOptions } from 'typeorm';
import { z } from 'zod';

const envBoolean = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.toLowerCase().trim();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off', ''].includes(normalized)) {
    return false;
  }

  return value;
}, z.boolean());

export const groceryViewDatabaseEnvSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().default('groceryview'),
  DB_USER: z.string().default('groceryview'),
  DB_PASSWORD: z.string().default('groceryview'),
  DB_SSL: envBoolean.default(false),
  DB_LOGGING: envBoolean.default(false),
});

export type GroceryViewDatabaseEnv = z.infer<typeof groceryViewDatabaseEnvSchema>;

export interface GroceryViewDataSourceOptionsInput {
  /** Environment source to parse; defaults to process.env. */
  env?: NodeJS.ProcessEnv;
  /** TypeORM entities supplied by the consuming app/package. */
  entities?: DataSourceOptions['entities'];
  /** TypeORM migrations supplied by the consuming app/package, if needed. */
  migrations?: DataSourceOptions['migrations'];
  /** TypeORM subscribers supplied by the consuming app/package, if needed. */
  subscribers?: DataSourceOptions['subscribers'];
}

export function parseGroceryViewDatabaseEnv(env: NodeJS.ProcessEnv = process.env): GroceryViewDatabaseEnv {
  return groceryViewDatabaseEnvSchema.parse(env);
}

/**
 * Build safe PostgreSQL TypeORM options for GroceryView services.
 *
 * SQL files under infra/db/migrations remain the schema source of truth, so
 * synchronize is intentionally hard-coded to false and this package does not
 * define or generate migrations.
 */
export function createGroceryViewDataSourceOptions(
  input: GroceryViewDataSourceOptionsInput = {},
): DataSourceOptions {
  const parsed = parseGroceryViewDatabaseEnv(input.env ?? process.env);
  const common = {
    type: 'postgres' as const,
    entities: input.entities ?? [],
    migrations: input.migrations ?? [],
    subscribers: input.subscribers ?? [],
    synchronize: false,
    logging: parsed.DB_LOGGING,
    ssl: parsed.DB_SSL ? { rejectUnauthorized: false } : false,
  } satisfies Partial<DataSourceOptions>;

  if (parsed.DATABASE_URL) {
    return { ...common, url: parsed.DATABASE_URL } satisfies DataSourceOptions;
  }

  return {
    ...common,
    host: parsed.DB_HOST,
    port: parsed.DB_PORT,
    database: parsed.DB_NAME,
    username: parsed.DB_USER,
    password: parsed.DB_PASSWORD,
  } satisfies DataSourceOptions;
}
