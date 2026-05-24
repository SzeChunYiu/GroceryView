type ApiEnvironment = {
  NODE_ENV: string;
  PORT?: string;
  CORS_ALLOWED_ORIGINS?: string[];
};

export function validateEnvironment(config: Record<string, unknown>): ApiEnvironment {
  const port = config.PORT;
  if (port !== undefined && (!/^\d+$/.test(String(port)) || Number(port) <= 0)) {
    throw new Error('PORT must be a positive integer.');
  }

  const rawCorsAllowedOrigins = config.CORS_ALLOWED_ORIGINS;
  if (rawCorsAllowedOrigins !== undefined && typeof rawCorsAllowedOrigins !== 'string') {
    throw new Error('CORS_ALLOWED_ORIGINS must be a comma-separated list of origins.');
  }

  const parsedCorsOrigins = rawCorsAllowedOrigins
    ? rawCorsAllowedOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
  : undefined;

  return {
    NODE_ENV: String(config.NODE_ENV ?? 'development'),
    PORT: port === undefined ? undefined : String(port),
    CORS_ALLOWED_ORIGINS: parsedCorsOrigins
  };
}
