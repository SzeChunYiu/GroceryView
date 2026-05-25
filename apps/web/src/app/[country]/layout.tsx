import type { Metadata } from 'next';
import { siteUrl } from '@/lib/seo';

const hreflangCountryPaths = {
  'sv-SE': 'sweden',
  'nb-NO': 'norway',
  'is-IS': 'iceland'
} as const;

function absoluteCountryUrl(country: string) {
  return new URL(`/${country}`, siteUrl).toString();
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>): Promise<Metadata> {
  const { country } = await params;
  const canonicalCountry = country || hreflangCountryPaths['sv-SE'];

  return {
    alternates: {
      canonical: absoluteCountryUrl(canonicalCountry),
      languages: {
        'sv-SE': absoluteCountryUrl(hreflangCountryPaths['sv-SE']),
        'nb-NO': absoluteCountryUrl(hreflangCountryPaths['nb-NO']),
        'is-IS': absoluteCountryUrl(hreflangCountryPaths['is-IS']),
        'x-default': absoluteCountryUrl(hreflangCountryPaths['sv-SE'])
      }
    }
  };
}

export default function CountryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
