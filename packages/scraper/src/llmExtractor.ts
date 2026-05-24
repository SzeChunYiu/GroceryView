import { postJson, HttpClientError } from './httpClient.js';

export type ProductFieldInput = {
  name?: unknown;
  price?: unknown;
  unit?: unknown;
};

export type StructuredProduct = {
  name: string;
  price: number;
  unit?: string | null;
};

export type LlmExtractorConfig = {
  endpoint: string;
  model: string;
  apiKey: string;
  timeoutMs?: number;
};

export type LlmExtractorInput = {
  sourceUrl: string;
  html: string;
  selectorData?: ProductFieldInput;
  llm?: LlmExtractorConfig;
  fetchImpl?: typeof fetch;
};

export type StructuredProductResult = StructuredProduct & {
  source: 'selector' | 'llm';
};

export type LlmChatPayload = {
  model: string;
  temperature: 0;
  response_format: {
    type: 'json_object';
  };
  messages: Array<{
    role: 'system' | 'user';
    content: string;
  }>;
};

type LlmChoice = {
  message?: {
    content?: string;
  };
};

type LlmChatResponse = {
  choices?: LlmChoice[];
};

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_HTML_BYTES = 35_000;

function isPositivePriceValue(value: unknown): value is number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return false;
  }

  return Number.isFinite(value) && value > 0;
}

function normalizeName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
}

function parsePrice(value: unknown): number | null {
  if (isPositivePriceValue(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, '');
  const firstMatch = normalized.match(/([0-9]+(?:[.,][0-9]+)?)/);
  if (!firstMatch) {
    return null;
  }

  const normalizedPrice = firstMatch[1].replace(',', '.');
  const price = Number.parseFloat(normalizedPrice);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function normalizeUnit(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
}

function asStructuredFromInput(input: ProductFieldInput): StructuredProduct | null {
  const name = normalizeName(input.name);
  const price = parsePrice(input.price);
  if (!name || price === null) {
    return null;
  }

  return {
    name,
    price,
    unit: normalizeUnit(input.unit)
  };
}

function normalizeSelectorData(input: ProductFieldInput = {}): ProductFieldInput {
  return {
    name: normalizeName(input.name),
    price: parsePrice(input.price),
    unit: normalizeUnit(input.unit)
  };
}

function mergeResult(partial: ProductFieldInput, fallback: StructuredProduct): StructuredProduct {
  const unit = normalizeUnit(partial.unit) ?? fallback.unit ?? null;
  const price = parsePrice(partial.price);
  const name = normalizeName(partial.name);

  return {
    name: name ?? fallback.name,
    price: price ?? fallback.price,
    unit
  };
}

function parseChatResult(raw: string): StructuredProduct {
  const data = JSON.parse(raw) as Record<string, unknown>;
  const normalized = asStructuredFromInput(data);
  if (!normalized) {
    throw new Error('LLM result was missing required name or price fields.');
  }
  return normalized;
}

function extractLlmContent(response: LlmChatResponse): string {
  const message = response.choices?.[0]?.message;
  if (!message || typeof message.content !== 'string') {
    throw new Error('LLM response did not return chat choice content.');
  }
  return message.content;
}

async function callLlmExtractor(input: {
  endpoint: string;
  apiKey: string;
  model: string;
  sourceUrl: string;
  html: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}): Promise<StructuredProduct> {
  const prompt = `Extract product data from the HTML snippet.\n\nProduct URL: ${input.sourceUrl}\n\nRaw HTML:\n${input.html.slice(0, MAX_HTML_BYTES)}`;

  const body: LlmChatPayload = {
    model: input.model,
    temperature: 0,
    response_format: {
      type: 'json_object'
    },
    messages: [
      {
        role: 'system',
        content:
          'You are a deterministic extraction model. Return strict JSON with fields: name (string), price (number), and unit (string or null).\nNever include markdown.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  try {
    const response = await postJson<LlmChatPayload, LlmChatResponse>({
      url: input.endpoint,
      body,
      headers: {
        Authorization: `Bearer ${input.apiKey}`
      },
      timeoutMs: input.timeoutMs,
      fetchImpl: input.fetchImpl
    });

    const content = extractLlmContent(response.data);
    return parseChatResult(content);
  } catch (error) {
    if (error instanceof HttpClientError) {
      throw new LlmExtractorError('Failed to call LLM extractor endpoint.', error);
    }
    if (error instanceof SyntaxError) {
      throw new Error('LLM response could not be parsed as JSON.');
    }
    throw error;
  }
}

export function isSelectorDataComplete(input: ProductFieldInput): input is StructuredProduct {
  return asStructuredFromInput(input) !== null;
}

export async function extractStructuredProduct(input: LlmExtractorInput): Promise<StructuredProductResult> {
  const selectorResult = asStructuredFromInput(input.selectorData ?? {});
  if (selectorResult) {
    return {
      ...selectorResult,
      source: 'selector'
    };
  }

  if (!input.llm) {
    throw new Error('No LLM extractor configured, and CSS-selector extraction was incomplete.');
  }

  const llmResult = await callLlmExtractor({
    endpoint: input.llm.endpoint,
    apiKey: input.llm.apiKey,
    model: input.llm.model,
    sourceUrl: input.sourceUrl,
    html: input.html,
    timeoutMs: input.llm.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    fetchImpl: input.fetchImpl
  });

  const merged = mergeResult(normalizeSelectorData(input.selectorData), llmResult);

  return {
    ...merged,
    source: 'llm'
  };
}

export class LlmExtractorError extends Error {
  constructor(message: string, public readonly cause?: Error | HttpClientError) {
    super(message);
    this.name = 'LlmExtractorError';
  }
}

export function isLlmExtractorError(error: unknown): error is LlmExtractorError {
  return error instanceof LlmExtractorError;
}
