export type ApiEnvironment = {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL?: string;
  REDIS_URL?: string;
};

export function validateEnv(config: Record<string, unknown>): ApiEnvironment {
  const portValue = Number(config.PORT ?? 3000);
  if (!Number.isInteger(portValue) || portValue < 1 || portValue > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return {
    NODE_ENV: String(config.NODE_ENV ?? 'development'),
    PORT: portValue,
    DATABASE_URL: optionalString(config.DATABASE_URL),
    REDIS_URL: optionalString(config.REDIS_URL)
  };
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new Error('Environment value must be a string.');
  return value;
}
