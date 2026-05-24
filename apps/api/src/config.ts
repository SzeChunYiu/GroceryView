export type ApiEnvironment = {
  NODE_ENV: string;
  PORT?: string;
  SCRAPER_DRY_RUN?: boolean;
  ANALYTICS_CONSENT_TOKEN_SECRET?: string;
};

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

export function validateEnvironment(config: Record<string, unknown>): ApiEnvironment {
  const port = config.PORT;
  if (port !== undefined && (typeof port !== 'string' || !/^\d+$/.test(port) || Number(port) <= 0)) {
    throw new Error('PORT must be a positive integer.');
  }

  return {
    NODE_ENV: String(config.NODE_ENV ?? 'development'),
    PORT: port === undefined ? undefined : String(port),
    ANALYTICS_CONSENT_TOKEN_SECRET:
      typeof config.ANALYTICS_CONSENT_TOKEN_SECRET === 'string' ? config.ANALYTICS_CONSENT_TOKEN_SECRET.trim() || undefined : undefined,
    SCRAPER_DRY_RUN: parseBoolean(config.SCRAPER_DRY_RUN)
  };
}
