import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

export type RequestLogRecord = {
  event: 'http_request';
  service: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  requestId: string;
  timestamp: string;
};

export type StructuredLogWriter = (record: RequestLogRecord) => void;

export type RequestLoggingConfig = {
  enabled: boolean;
  serviceName: string;
  writer?: StructuredLogWriter;
};

type RequestLike = {
  method?: string;
  originalUrl?: string;
  path?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  statusCode?: number;
  setHeader(name: string, value: string): void;
  on(event: 'finish', listener: () => void): void;
};

type NextFunction = () => void;

function defaultStructuredLogWriter(record: RequestLogRecord): void {
  console.info(JSON.stringify(record));
}

function requestHeader(request: RequestLike, name: string): string | undefined {
  const value = request.headers?.[name] ?? request.headers?.[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}

function isSafeRequestId(value: string): boolean {
  return value.length > 0 && value.length <= 128 && /^[\w.:/-]+$/.test(value);
}

export function resolveRequestId(request: RequestLike): string {
  const headerValue = requestHeader(request, 'x-request-id')?.trim();
  return headerValue && isSafeRequestId(headerValue) ? headerValue : randomUUID();
}

function requestPath(request: RequestLike): string {
  const path = request.path ?? request.originalUrl ?? request.url ?? '/';
  return path.split('?')[0] || '/';
}

export function createRequestLoggingMiddleware(config: RequestLoggingConfig) {
  const writer = config.writer ?? defaultStructuredLogWriter;
  return (request: RequestLike, response: ResponseLike, next: NextFunction): void => {
    if (!config.enabled) {
      next();
      return;
    }

    const requestId = resolveRequestId(request);
    const startedAt = performance.now();
    response.setHeader('x-request-id', requestId);

    response.on('finish', () => {
      const durationMs = Math.max(0, Number((performance.now() - startedAt).toFixed(3)));
      const record: RequestLogRecord = {
        event: 'http_request',
        service: config.serviceName,
        method: (request.method ?? 'GET').toUpperCase(),
        path: requestPath(request),
        status: response.statusCode ?? 0,
        durationMs,
        requestId,
        timestamp: new Date().toISOString()
      };
      try {
        writer(record);
      } catch (error) {
        console.error(JSON.stringify({ event: 'http_request_log_write_failed', requestId, error: String(error) }));
      }
    });

    next();
  };
}
