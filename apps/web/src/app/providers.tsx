'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import { useEffect, useRef, useState } from 'react';

type SentryConfig = Parameters<typeof Sentry.init>[0];

type ProvidersProps = Readonly<{
  children: React.ReactNode;
  sentryConfig?: SentryConfig;
}>;

export function Providers({ children, sentryConfig }: ProvidersProps) {
  const sentryInitialized = useRef(false);

  useEffect(() => {
    if (sentryInitialized.current || !sentryConfig) return;

    Sentry.init(sentryConfig);
    sentryInitialized.current = true;
  }, [sentryConfig]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000
          }
        }
      })
  );

  const appShell = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

  if (!sentryConfig) {
    return appShell;
  }

  return (
    <Sentry.ErrorBoundary
      fallback={
        <main className="p-6 text-sm text-red-800">
          Something went wrong. Our team has been notified.
        </main>
      }
    >
      {appShell}
    </Sentry.ErrorBoundary>
  );
}
