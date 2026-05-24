const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

const productionEnvironment = process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV;
const releaseSha = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA ?? process.env.COMMIT_SHA;

function isProductionEnabled() {
  return process.env.NODE_ENV === 'production' && Boolean(sentryDsn);
}

export function getSentryConfig(service: 'web' | 'api'): Record<string, unknown> | undefined {
  if (!isProductionEnabled()) return undefined;

  return {
    dsn: sentryDsn,
    environment: productionEnvironment ?? 'production',
    release: releaseSha,
    sendDefaultPii: false,
    attachStacktrace: true,
    autoSessionTracking: false,
    tracesSampleRate: 0,
    initialScope: {
      tags: {
        service
      }
    }
  };
}
