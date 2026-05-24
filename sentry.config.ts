export type SentryRuntime = 'api' | 'web';

interface BaseSentryConfig {
  dsn?: string;
  environment: string;
  enabled: boolean;
  tracesSampleRate: number;
}

function getTracesSampleRate(raw: string | undefined): number {
  if (raw === undefined) {
    return 0.2;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return 0.2;
  }

  return Math.min(1, Math.max(0, parsed));
}

export function getSentryConfig(runtime: SentryRuntime): BaseSentryConfig {
  const isProduction = process.env.NODE_ENV === 'production';

  const dsn =
    runtime === 'web'
      ? process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN
      : process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

  return {
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    enabled: isProduction && Boolean(dsn),
    tracesSampleRate: getTracesSampleRate(
      runtime === 'web'
        ? process.env.NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE
        : process.env.SENTRY_TRACE_SAMPLE_RATE
    )
  };
}

