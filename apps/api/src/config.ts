import { type ApiEnvironment as BaseApiEnvironment, validateEnvironment as validateCoreEnvironment } from './config/env.schema.js';

export const MATSPAR_DEFAULT_QUERIES = [
  'makaroner',
  'mjolk',
  'kaffe',
  'ris',
  'pasta',
  'yoghurt',
  'brod',
  'ost',
  'agg',
  'smor',
  'potatis',
  'banan',
  'kyckling',
  'ketchup',
  'havregryn'
] as const;

export type ApiEnvironment = BaseApiEnvironment & {
  MATSPAR_ENABLED: boolean;
  MATSPAR_MAX_ROWS: number;
  MATSPAR_REQUEST_TIMEOUT_MS: number;
  MATSPAR_QUERIES: readonly string[];
  MATSPAR_USER_AGENT: string;
};

export function validateEnvironment(rawConfig: Record<string, unknown>): ApiEnvironment {
  const base = validateCoreEnvironment(rawConfig);
  const matsparConfig = parseMatsparConfig(rawConfig);
  return {
    ...base,
    MATSPAR_ENABLED: matsparConfig.enabled,
    MATSPAR_MAX_ROWS: matsparConfig.maxRows,
    MATSPAR_REQUEST_TIMEOUT_MS: matsparConfig.requestTimeoutMs,
    MATSPAR_QUERIES: matsparConfig.queries,
    MATSPAR_USER_AGENT: matsparConfig.userAgent
  };
}

export type MatsparConfig = ReturnType<typeof parseMatsparConfig>;

export function parseMatsparConfig(rawConfig: Record<string, unknown>) {
  return {
    enabled: parseBoolean(rawConfig.MATSPAR_ENABLED, true),
    maxRows: parsePositiveInt(rawConfig.MATSPAR_MAX_ROWS, 75),
    requestTimeoutMs: parsePositiveInt(rawConfig.MATSPAR_REQUEST_TIMEOUT_MS, 8_000),
    userAgent: typeof rawConfig.MATSPAR_USER_AGENT === 'string' && rawConfig.MATSPAR_USER_AGENT.trim().length > 0
      ? rawConfig.MATSPAR_USER_AGENT.trim()
      : 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)',
    queries: normalizeQueries(
      rawConfig.MATSPAR_QUERIES === undefined ? MATSPAR_DEFAULT_QUERIES : rawConfig.MATSPAR_QUERIES
    )
  };
}

function normalizeQueries(input: unknown): string[] {
  if (Array.isArray(input)) {
    return dedupeNonEmpty(input.flatMap((value) => (typeof value === 'string' ? value.split(',') : [])));
  }
  if (typeof input !== 'string') {
    return [...MATSPAR_DEFAULT_QUERIES];
  }
  return dedupeNonEmpty(input.split(','));
}

function dedupeNonEmpty(values: string[]): string[] {
  const normalized = values
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
  return [...new Set(normalized)];
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'y', 'on'].includes(value.trim().toLowerCase());
  }
  return fallback;
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : typeof value === 'number' ? value : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
