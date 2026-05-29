import { createElement } from 'react';
import { siteName, siteUrl } from './seo';

export type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

function absoluteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, siteUrl).toString();
}

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== '')) as T;
}

export function serializeJsonLd(data: JsonLdValue) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function JsonLd({ data }: Readonly<{ data: JsonLdValue }>) {
  return createElement('script', {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: serializeJsonLd(data) }
  });
}

export function buildBreadcrumbJsonLd(items: ReadonlyArray<{ name: string; item: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.item)
    }))
  };
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: siteUrl,
    description: 'Verified grocery price intelligence for Sweden.'
  };
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };
}

export function buildProductJsonLd(input: Readonly<{
  name: string;
  url: string;
  image?: string;
  brand?: string;
  description?: string;
  currency?: string;
  lowPrice?: number;
  highPrice?: number;
  offerCount?: number;
}>) {
  const hasOffer = typeof input.lowPrice === 'number' && Number.isFinite(input.lowPrice) && input.lowPrice > 0;
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    url: absoluteUrl(input.url),
    image: input.image ? absoluteUrl(input.image) : undefined,
    brand: input.brand ? { '@type': 'Brand', name: input.brand } : undefined,
    description: input.description,
    offers: hasOffer ? compact({
      '@type': 'AggregateOffer',
      priceCurrency: input.currency ?? 'SEK',
      lowPrice: input.lowPrice,
      highPrice: input.highPrice ?? input.lowPrice,
      offerCount: input.offerCount
    }) : undefined
  });
}

export function buildStoreLocalBusinessJsonLd(input: Readonly<{
  name: string;
  url: string;
  brand?: string;
  streetAddress?: string;
  postalCode?: string;
  addressLocality?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
}>) {
  return compact({
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'GroceryStore'],
    name: input.name,
    url: absoluteUrl(input.url),
    branchOf: input.brand ? { '@type': 'Organization', name: input.brand } : undefined,
    address: input.streetAddress || input.postalCode || input.addressLocality ? compact({
      '@type': 'PostalAddress',
      streetAddress: input.streetAddress,
      postalCode: input.postalCode,
      addressLocality: input.addressLocality,
      addressCountry: 'SE'
    }) : undefined,
    geo: typeof input.latitude === 'number' && typeof input.longitude === 'number' ? {
      '@type': 'GeoCoordinates',
      latitude: input.latitude,
      longitude: input.longitude
    } : undefined,
    openingHours: input.openingHours || undefined
  });
}

export function buildFuelStationJsonLd(input: Readonly<{
  name: string;
  url: string;
  brand?: string;
  streetAddress?: string;
  postalCode?: string;
  addressLocality?: string;
  latitude?: number;
  longitude?: number;
  openingHours?: string;
}>) {
  return compact({
    ...buildStoreLocalBusinessJsonLd(input),
    '@type': ['LocalBusiness', 'GasStation']
  });
}

export function buildPharmacyProductJsonLd(input: Parameters<typeof buildProductJsonLd>[0]) {
  return compact({
    ...buildProductJsonLd(input),
    category: 'OTC pharmacy product',
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Claim boundary', value: 'Public OTC catalog price evidence only; no medical advice, prescription, or stock claim.' }
    ]
  });
}

export function buildDatasetJsonLd(input: Readonly<{ name: string; description: string; url: string; dateModified?: string; keywords?: readonly string[] }>) {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.url),
    dateModified: input.dateModified,
    keywords: input.keywords?.join(', '),
    publisher: buildOrganizationJsonLd()
  });
}
