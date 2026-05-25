import type { Metadata, Viewport } from 'next';
import { AppShell } from '@/components/app-shell';
import { PwaInstall } from '@/components/pwa-install';
import { ConsentManager } from '@/components/consent-manager';
import { ListToastViewport } from '@/components/Toast';
import { SkipLink } from '@/components/SkipLink';
import { EngagementReporter } from '@/lib/engagement';
import { ServiceWorkerRegistrar } from '@/lib/swRegister';
import '@/lib/env';
import { Providers } from './providers';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';
import '@/styles/print.css';
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
  applicationName: 'GroceryView',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'GroceryView'
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' }]
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-TileColor': '#064e3b'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f1e8' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' }
  ]
};

function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body>
        <SkipLink />
        <div id="main-content" tabIndex={-1}>
          <script
            dangerouslySetInnerHTML={{ __html: "try{var p=localStorage.getItem('groceryview:theme-preference');if(p==='dark'||(!p&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}" }}
          />
          <script
            dangerouslySetInnerHTML={{ __html: jsonLd([organizationJsonLd, websiteJsonLd]) }}
            type="application/ld+json"
          />
          <Providers><AppShell>{children}</AppShell></Providers>
        </div>
        <ConsentManager />
        <EngagementReporter />
        <ServiceWorkerRegistrar />
        <PwaInstall />
        <ListToastViewport />
      </body>
    </html>
  );
}
