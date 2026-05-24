import type { Metadata } from 'next';
import { Providers } from './providers';
import { getSentryConfig } from '../../../../sentry.config';
import './globals.css';

export const metadata: Metadata = {
  title: 'GroceryView',
  description: 'Stockholm grocery price intelligence for products, stores, and weekly baskets.'
};

const sentryConfig = getSentryConfig('web');

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers sentryConfig={sentryConfig}>{children}</Providers>
      </body>
    </html>
  );
}
