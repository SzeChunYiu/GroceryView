export type MarketReadiness = 'live' | 'preview' | 'waitlist';
export type MarketCountrySlug = 'sweden' | 'norway' | 'iceland';
export type MarketSectionSlug = 'compare' | 'chain-index' | 'deals';

export const marketCountries = [
  {
    slug: 'sweden',
    label: 'Sweden',
    nativeLabel: 'Sverige',
    language: 'sv-SE',
    currency: 'SEK',
    readiness: 'live',
    href: '/sweden',
    canonicalFallback: '/',
    summary: 'Live Swedish catalogue, chain, store, and product evidence powers the current GroceryView experience.'
  },
  {
    slug: 'norway',
    label: 'Norway',
    nativeLabel: 'Norge',
    language: 'nb-NO',
    currency: 'NOK',
    readiness: 'preview',
    href: '/norway',
    canonicalFallback: '/norway',
    summary: 'Norway is a crawlable preview with connector research underway. Price rankings stay withheld until verified Norwegian rows are published.'
  },
  {
    slug: 'iceland',
    label: 'Iceland',
    nativeLabel: 'Island',
    language: 'is-IS',
    currency: 'ISK',
    readiness: 'preview',
    href: '/iceland',
    canonicalFallback: '/iceland',
    summary: 'Iceland remains a preview market with source-specific ingestion work separated from Swedish price claims.'
  }
] as const;

export const marketSections = [
  {
    slug: 'compare',
    label: 'Price comparison',
    title: 'grocery price comparison',
    liveHref: '/compare',
    previewCopy: 'Compare pages show source readiness, not rankings, until product and chain rows exist for the selected market.'
  },
  {
    slug: 'chain-index',
    label: 'Chain index',
    title: 'grocery chain index',
    liveHref: '/chain-index',
    previewCopy: 'Chain index pages stay in preview until verified observations can support a market-level index without borrowing another country.'
  },
  {
    slug: 'deals',
    label: 'Deals',
    title: 'grocery deals',
    liveHref: '/deals',
    previewCopy: 'Deal pages require dated offer evidence, validity windows, and member-price labels before live cards are shown.'
  }
] as const;

export const marketCityPreviews = [
  { country: 'sweden', slug: 'stockholm', label: 'Stockholm', readiness: 'live', summary: 'Sweden live data can link shoppers into Stockholm store and map workflows.' },
  { country: 'norway', slug: 'oslo', label: 'Oslo', readiness: 'waitlist', summary: 'Oslo is listed for Norway launch planning, but no city-level price ranking is published yet.' },
  { country: 'norway', slug: 'bergen', label: 'Bergen', readiness: 'waitlist', summary: 'Bergen remains a preview city until verified store and product feeds are available.' },
  { country: 'norway', slug: 'trondheim', label: 'Trondheim', readiness: 'waitlist', summary: 'Trondheim is crawlable as a preview only; live price claims are withheld.' },
  { country: 'iceland', slug: 'reykjavik', label: 'Reykjavik', readiness: 'waitlist', summary: 'Reykjavik remains a preview city while Iceland source coverage matures.' }
] as const;

export function marketCountryForSlug(slug: string | undefined) {
  return marketCountries.find((country) => country.slug === slug);
}

export function marketSectionForSlug(slug: string | undefined) {
  return marketSections.find((section) => section.slug === slug);
}

export function marketPath(country: MarketCountrySlug, section?: MarketSectionSlug) {
  return section ? `/${country}/${section}` : `/${country}`;
}

export function marketCanonicalPath(country: MarketCountrySlug, section?: MarketSectionSlug) {
  const entry = marketCountryForSlug(country);
  const sectionEntry = marketSectionForSlug(section);
  if (entry?.readiness === 'live' && sectionEntry) return sectionEntry.liveHref;
  return marketPath(country, section);
}

export function marketLanguageAlternates(section?: MarketSectionSlug, citySlug?: string) {
  return Object.fromEntries(
    marketCountries.map((country) => [
      country.language,
      citySlug ? `/${country.slug}/cities/${citySlug}` : marketPath(country.slug, section)
    ])
  ) as Record<string, string>;
}

export function readinessLabel(readiness: MarketReadiness) {
  if (readiness === 'live') return 'Live';
  if (readiness === 'preview') return 'Preview';
  return 'Waitlist';
}
