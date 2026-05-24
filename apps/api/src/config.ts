export type ApiLlmConfig = {
  enabled: boolean;
  endpoint: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
};

export type ApiConfig = {
  llmExtractor: ApiLlmConfig;
};

const DEFAULT_LLM_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_LLM_MODEL = 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = 10_000;

function asBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'off', 'no'].includes(normalized)) return false;
  return fallback;
}

function asPositiveInt(value: string | undefined, fallback: number): number {
  if (!value?.trim()) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function validateUrl(value: string): string {
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('LLM endpoint URL must use http/https');
    }
    return parsed.toString();
  } catch {
    throw new Error(`Invalid LLM_EXTRACTOR_ENDPOINT: ${value}`);
  }
}

export function loadApiConfig(env: Record<string, string | undefined> = process.env): ApiConfig {
  const enabled = asBoolean(env.LLM_EXTRACTOR_ENABLED, true);
  const endpoint = validateUrl(env.LLM_EXTRACTOR_ENDPOINT ?? DEFAULT_LLM_ENDPOINT);
  const model = env.LLM_EXTRACTOR_MODEL?.trim() || DEFAULT_LLM_MODEL;
  const apiKey = env.LLM_EXTRACTOR_API_KEY?.trim() ?? '';
  const timeoutMs = asPositiveInt(env.LLM_EXTRACTOR_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);

  if (enabled && !apiKey) {
    throw new Error('LLM_EXTRACTOR_API_KEY is required when LLM extractor is enabled.');
  }

  return {
    llmExtractor: {
      enabled,
      endpoint,
      model,
      apiKey,
      timeoutMs
    }
  };
}

export function isLlmExtractorReady(config: ApiConfig): boolean {
  return config.llmExtractor.enabled && Boolean(config.llmExtractor.apiKey);
}
