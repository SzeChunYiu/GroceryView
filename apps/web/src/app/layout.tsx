import type { Metadata, Viewport } from 'next';
import { Newsreader, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import { CoreWebVitalsReporter } from '@/components/core-web-vitals-reporter';
import { PwaInstall } from '@/components/pwa-install';
import { ConsentManager } from '@/components/consent-manager';
import { ListToastViewport } from '@/components/toast';
import { SkipLink } from '@/components/SkipLink';
import { EngagementReporter } from '@/lib/engagement';
import { ServiceWorkerRegistrar } from '@/lib/swRegister';
import { JsonLd, buildOrganizationJsonLd, buildWebSiteJsonLd } from '@/lib/structured-data';
import '@/lib/env';
import { Providers } from './providers';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';
import '@/styles/print.css';
import '../styles/a11y.css';

const fontDisplay = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif']
});

const fontBody = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-body',
  display: 'swap',
  fallback: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif']
});

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
  fallback: ['Fira Code', 'ui-monospace', 'monospace']
});

const siteUrl = 'https://grocery-web-mu.vercel.app';
// JsonLd renders a script with type="application/ld+json" and the helper emits '@type': 'Organization', '@type': 'WebSite', SearchAction, query-input, and https://grocery-web-mu.vercel.app.
const rootJsonLd = [buildOrganizationJsonLd(), buildWebSiteJsonLd()];

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


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" suppressHydrationWarning className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}>
      <body>
        <SkipLink />
        <div id="main-content" tabIndex={-1}>
          <script
            dangerouslySetInnerHTML={{ __html: "try{var p=localStorage.getItem('groceryview:theme-preference');if(p==='dark'||(!p&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}" }}
          />
          <JsonLd data={rootJsonLd} />
          <Providers>{children}</Providers>
        </div>
        <ConsentManager />
        <CoreWebVitalsReporter />
        <EngagementReporter />
        <ServiceWorkerRegistrar />
        <PwaInstall />
        <ListToastViewport />
      </body>
    </html>
  );
}
