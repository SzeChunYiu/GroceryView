import { MarketShell } from '@/components/market-shell';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/');
}

const homepageWebsiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GroceryView',
  url: 'https://grocery-web-mu.vercel.app/',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://grocery-web-mu.vercel.app/products?q={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
};

function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export default function HomePage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: jsonLd(homepageWebsiteJsonLd) }}
        type="application/ld+json"
      />
      <MarketShell />
    </>
  );
}
