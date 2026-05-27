import { type RequestLoggingConfig } from './middleware/logger.js';
import { loadDatabaseConfig, type ApiDatabaseConfig } from './lib/db.js';

export type ApiCorsConfig = {
  allowedOrigins: string[];
  credentials: boolean;
};

export type RetailerScrapeScheduleConfig = {
  cadence: 'daily' | 'weekly';
  cron: string;
  id: string;
};

export type ScrapeSchedulerConfig = {
  enabled: boolean;
  retailers: RetailerScrapeScheduleConfig[];
};

export type ApiConfig = {
  cors: ApiCorsConfig;
  database: ApiDatabaseConfig;
  requestLogging: RequestLoggingConfig;
  scrapeScheduler: ScrapeSchedulerConfig;
};


const defaultCorsAllowedOrigins = [
  'https://groceryview.se',
  'https://www.groceryview.se',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const requiredProductionApiEnv = [
  'AUTH_SECRET',
  'GROCERYVIEW_PRODUCTION_URL',
  'PUBLIC_WEB_URL'
] as const;

function parseStringList(value: string | undefined): string[] {
  return (value ?? '')
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeOrigin(value: string): string | undefined {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return undefined;
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
}

function uniqueOrigins(values: string[]): string[] {
  return [...new Set(values.map(normalizeOrigin).filter((value): value is string => Boolean(value)))];
}

function loadCorsConfig(env: NodeJS.ProcessEnv): ApiCorsConfig {
  return {
    allowedOrigins: uniqueOrigins([
      ...defaultCorsAllowedOrigins,
      ...parseStringList(env.PUBLIC_WEB_URL),
      ...parseStringList(env.GROCERYVIEW_PRODUCTION_URL),
      ...parseStringList(env.API_CORS_ALLOWED_ORIGINS)
    ]),
    credentials: true
  };
}

function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function loadScrapeSchedulerConfig(env: NodeJS.ProcessEnv): ScrapeSchedulerConfig {
  return {
    enabled: parseBooleanFlag(env.SCRAPER_SCHEDULER_ENABLED, true),
    retailers: [
      { id: 'ica', cadence: 'daily', cron: env.SCRAPER_CRON_ICA?.trim() || '15 2 * * *' },
      { id: 'willys', cadence: 'daily', cron: env.SCRAPER_CRON_WILLYS?.trim() || '30 2 * * *' },
      { id: 'coop', cadence: 'daily', cron: env.SCRAPER_CRON_COOP?.trim() || '45 2 * * *' },
      { id: 'hemkop', cadence: 'daily', cron: env.SCRAPER_CRON_HEMKOP?.trim() || '0 3 * * *' },
      { id: 'specials', cadence: 'weekly', cron: env.SCRAPER_CRON_SPECIALS?.trim() || '0 4 * * 1' }
    ]
  };
}

function missingRequiredProductionEnv(env: NodeJS.ProcessEnv, keys: readonly string[]): string[] {
  if (env.NODE_ENV !== 'production') return [];
  return keys.filter((key) => !env[key]?.trim());
}

export function validateApiStartupEnv(env: NodeJS.ProcessEnv = process.env): void {
  const missing = missingRequiredProductionEnv(env, requiredProductionApiEnv);
  if (env.NODE_ENV === 'production' && !(env.PGBOUNCER_DATABASE_URL || env.DATABASE_POOL_URL || env.DATABASE_URL)?.trim()) {
    missing.push('PGBOUNCER_DATABASE_URL or DATABASE_POOL_URL or DATABASE_URL');
  }
  if (missing.length > 0) {
    throw new Error(`Missing required API environment variables: ${missing.join(', ')}`);
  }
}

export function loadApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  validateApiStartupEnv(env);
  return {
    cors: loadCorsConfig(env),
    database: loadDatabaseConfig(env),
    requestLogging: {
      enabled: parseBooleanFlag(env.REQUEST_LOGGING_ENABLED, true),
      serviceName: env.API_SERVICE_NAME?.trim() || 'groceryview-api'
    },
    scrapeScheduler: loadScrapeSchedulerConfig(env)
  };
}
