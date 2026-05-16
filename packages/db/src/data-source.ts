import type { DataSourceOptions } from 'typeorm';
import { z } from 'zod';
import { groceryViewEntities } from './entities';

const envBoolean = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) {
    return true;
  }

  if (['0', 'false', 'no', 'off', ''].includes(value.toLowerCase())) {
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

export function parseGroceryViewDatabaseEnv(env: NodeJS.ProcessEnv = process.env): GroceryViewDatabaseEnv {
  return groceryViewDatabaseEnvSchema.parse(env);
}

export function createGroceryViewDataSourceOptions(env: NodeJS.ProcessEnv = process.env): DataSourceOptions {
  const parsed = parseGroceryViewDatabaseEnv(env);
  const common = {
    type: 'postgres' as const,
    entities: [...groceryViewEntities],
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
