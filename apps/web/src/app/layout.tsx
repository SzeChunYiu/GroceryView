import type { Metadata } from 'next';
import { ConsentManager } from '@/components/consent-manager';
import { SkipLink } from '@/components/SkipLink';
import { ServiceWorkerRegistrar } from '@/lib/swRegister';
import { Providers } from './providers';
import './globals.css';
import '../styles/a11y.css';

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
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GroceryView'
  },
  other: {
    'mobile-web-app-capable': 'yes'
  }
};

function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv">
      <body>
        <SkipLink />
        <script
          dangerouslySetInnerHTML={{ __html: jsonLd([organizationJsonLd, websiteJsonLd]) }}
          type="application/ld+json"
        />
        <div id="main-content" tabIndex={-1}>
          <Providers>{children}</Providers>
        </div>
        <ConsentManager />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
