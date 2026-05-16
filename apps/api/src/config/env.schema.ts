import { z } from 'zod';

const optionalUrl = z.string().url().optional().or(z.literal(''));
const optionalBooleanString = z.enum(['true', 'false']).optional();

export const EnvSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_ENABLED: optionalBooleanString.default('false'),
    DATABASE_URL: optionalUrl,
    REDIS_URL: optionalUrl.default('redis://localhost:6379'),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    DB_HOST: z.string().optional(),
    DB_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    DB_USER: z.string().optional(),
    DB_PASSWORD: z.string().optional(),
    DB_NAME: z.string().optional(),
    DB_SSL: optionalBooleanString.default('false'),
    DB_RETRY_ATTEMPTS: z.coerce.number().int().min(0).default(1),
    DB_RETRY_DELAY_MS: z.coerce.number().int().min(0).default(1000),
  })
  .passthrough();

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnvironment(config: Record<string, unknown>): EnvConfig {
  const parsed = EnvSchema.safeParse(config);

  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${z.prettifyError(parsed.error)}`,
    );
  }

  return parsed.data;
}

export function parseCorsOrigins(value: string | undefined): string[] {
  return (value ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
