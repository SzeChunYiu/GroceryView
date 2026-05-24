import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { siteUrl } from '@/lib/seo';

const hreflangCountries = [
  { hreflang: 'sv-SE', country: 'se' },
  { hreflang: 'nb-NO', country: 'no' },
  { hreflang: 'is-IS', country: 'is' }
] as const;

type CountryLayoutParams = Promise<{ country: string }>;

type CountryLayoutProps = Readonly<{
  children: React.ReactNode;
  params: CountryLayoutParams;
}>;

function alternatePathForCountry(pathname: string, currentCountry: string, targetCountry: string) {
  const safePathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const segments = safePathname.split('/');
  const currentIndex = segments.findIndex((segment) => segment.toLocaleLowerCase('en-US') === currentCountry.toLocaleLowerCase('en-US'));
  if (currentIndex >= 0) {
    segments[currentIndex] = targetCountry;
    return segments.join('/') || '/';
  }
  return `/${targetCountry}${safePathname === '/' ? '' : safePathname}`;
}

function absoluteAlternate(pathname: string) {
  return new URL(pathname, siteUrl).toString();
}

async function countryAlternateLanguages(country: string) {
  const requestHeaders = await headers();
  const currentPathname = requestHeaders.get('x-groceryview-pathname') ?? `/${country}`;
  const languages = Object.fromEntries(hreflangCountries.map((entry) => [
    entry.hreflang,
    absoluteAlternate(alternatePathForCountry(currentPathname, country, entry.country))
  ]));
  return {
    ...languages,
    'x-default': languages['sv-SE'] ?? absoluteAlternate('/se')
  };
}

export async function generateMetadata({ params }: { params: CountryLayoutParams }): Promise<Metadata> {
  const { country } = await params;
  return {
    metadataBase: new URL(siteUrl),
    alternates: {
      languages: await countryAlternateLanguages(country)
    }
  };
}

export default function CountryLayout({ children }: CountryLayoutProps) {
  return children;
}
