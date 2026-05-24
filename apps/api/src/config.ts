import { env } from 'node:process';

export type ApiRateLimitConfig = {
  enabled: boolean;
  windowMs: number;
  limit: number;
  message: string;
};

const defaultWindowMs = 15 * 60 * 1000;
const defaultLimit = 100;
const defaultMessage = 'Too many requests, please try again later.';

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function parsePositiveInteger(value: string | undefined, fallback: number, variable: string): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${variable} must be a positive integer, received "${value}".`);
  }

  return parsed;
}

export function getRateLimitConfig(): ApiRateLimitConfig {
  const enabled = parseBoolean(env.API_RATE_LIMIT_ENABLED, env.NODE_ENV !== 'test');
  const windowMs = parsePositiveInteger(env.API_RATE_LIMIT_WINDOW_MS, defaultWindowMs, 'API_RATE_LIMIT_WINDOW_MS');
  const limit = parsePositiveInteger(env.API_RATE_LIMIT_LIMIT, defaultLimit, 'API_RATE_LIMIT_LIMIT');
  const message = env.API_RATE_LIMIT_MESSAGE?.trim() || defaultMessage;

  return {
    enabled,
    windowMs,
    limit,
    message
  };
}
