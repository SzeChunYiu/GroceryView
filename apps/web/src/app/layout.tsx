import type { Metadata } from 'next';
import { ConsentManager } from '@/components/consent-manager';
import { Providers } from './providers';
import './globals.css';
import { getSentryConfig } from '../../../../sentry.config';

const siteUrl = 'https://grocery-web-mu.vercel.app';
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GroceryView',
  url: siteUrl,
  description: 'Verified grocery price intelligence for Sweden.'
};
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GroceryView',
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/products?q={search_term_string}`,
    'query-input': 'required name=search_term_string'
  }
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'GroceryView',
  description: 'Sweden grocery price intelligence for products, stores, and weekly baskets.',
  manifest: '/manifest.webmanifest'
};

const sentryConfig = getSentryConfig('web');
const sentrySource = 'https://browser.sentry-cdn.com/7.120.4/bundle.min.js';
const sentryInitScript = JSON.stringify({
  ...sentryConfig,
  dsn: sentryConfig.dsn ?? ''
});

function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv">
      <body>
        <script
          dangerouslySetInnerHTML={{ __html: jsonLd([organizationJsonLd, websiteJsonLd]) }}
          type="application/ld+json"
        />
        {sentryConfig.enabled && sentryConfig.dsn ? (
          <>
            <script src={sentrySource} crossOrigin="anonymous" defer />
            <script
              defer
              dangerouslySetInnerHTML={{
                __html: `if (window.Sentry) { window.Sentry.init(${sentryInitScript}); }`
              }}
            />
          </>
        ) : null}
        <Providers>{children}</Providers>
        <ConsentManager />
      </body>
    </html>
  );
}
