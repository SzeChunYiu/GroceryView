type Span = {
  setStatus?(status: { code: number; message?: string }): void;
  recordException?(error: Error): void;
  end(): void;
};

type Tracer = {
  startActiveSpan<T>(name: string, options: { attributes: Record<string, string | number | boolean | undefined> }, callback: (span: Span) => T): T;
};

type OpenTelemetryApi = {
  trace: { getTracer(name: string): Tracer };
};

const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;
let traceApi: Promise<OpenTelemetryApi | null> | null = null;

export const apiRouteTraceSpans = {
  screener: 'api.screener.list',
  products: 'api.products.search',
  prices: 'api.prices.lookup'
} as const;

export async function configureOpenTelemetry() {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return null;

  try {
    const [{ NodeSDK }, { OTLPTraceExporter }] = await Promise.all([
      dynamicImport('@opentelemetry/sdk-node') as Promise<{ NodeSDK: new (config: unknown) => { start(): Promise<void> | void } }>,
      dynamicImport('@opentelemetry/exporter-trace-otlp-http') as Promise<{ OTLPTraceExporter: new (config: { url: string }) => unknown }>
    ]);
    const sdk = new NodeSDK({ traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }) });
    await sdk.start();
    return sdk;
  } catch (error) {
    console.warn('OpenTelemetry SDK was requested but could not be started.', error);
    return null;
  }
}

export async function traceApiRoute<T>(
  spanName: string,
  attributes: Record<string, string | number | boolean | undefined>,
  run: () => Promise<T> | T
): Promise<T> {
  traceApi ??= dynamicImport('@opentelemetry/api')
    .then((api) => api as OpenTelemetryApi)
    .catch(() => null);
  const api = await traceApi;

  if (!api) return run();

  const tracer = api.trace.getTracer('groceryview-api');
  return tracer.startActiveSpan(spanName, { attributes }, async (span) => {
    try {
      const result = await run();
      span.setStatus?.({ code: 1 });
      return result;
    } catch (error) {
      if (error instanceof Error) {
        span.recordException?.(error);
        span.setStatus?.({ code: 2, message: error.message });
      }
      throw error;
    } finally {
      span.end();
    }
  });
}

void configureOpenTelemetry();
