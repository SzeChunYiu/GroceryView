import type { MetadataRoute } from 'next';
import {
  groceryCategoryHierarchy,
  type CategoryHierarchyNode,
  type ProductCatalogRecord,
  type StoreCatalogRecord
} from '@groceryview/db';
import { axfoodProducts } from '@/lib/axfood-products';
import { osmStores } from '@/lib/osm-stores';
import { pricedProducts } from '@/lib/openprices-products';
import { seoLandingCities, seoLandingProducts } from '@/lib/seo-landing-pages';

const siteUrl = 'https://grocery-web-mu.vercel.app';
const fallbackLastModified = new Date('2026-05-22T00:00:00.000Z');

type ProductSitemapRecord = Pick<ProductCatalogRecord, 'slug' | 'updatedAt'>;
type StoreSitemapRecord = Pick<StoreCatalogRecord, 'slug' | 'updatedAt'>;
type CategorySitemapRecord = Pick<CategoryHierarchyNode, 'slug' | 'routable'>;

const productSitemapRecords: ProductSitemapRecord[] = [
  ...axfoodProducts.map((product) => ({
    slug: product.slug,
    updatedAt: fallbackLastModified.toISOString()
  })),
  ...pricedProducts.map((product) => ({
    slug: product.slug,
    updatedAt: product.lastObservedAt
  }))
];

const categorySitemapRecords: CategorySitemapRecord[] = groceryCategoryHierarchy.filter((category) => category.routable);

const storeSitemapRecords: StoreSitemapRecord[] = osmStores.map((store) => ({
  slug: store.slug,
  updatedAt: store.retrievedDate
}));

const countryTermsRoutes = ['sweden', 'norway', 'denmark', 'finland', 'iceland'] as const;
const nordicCountryRoutes = ['se', 'no', 'is'] as const;
const nordicHreflangByCountry: Record<typeof nordicCountryRoutes[number], string> = {
  se: 'sv-SE',
  no: 'nb-NO',
  is: 'is-IS'
};
const nordicLogicalRoutes = [
  '/terms',
  '/rescue',
  '/group-buys',
  '/greedflation',
  '/account/subscriptions',
  '/fuel/route',
  '/receipts/upload'
] as const;

function lastModifiedFrom(updatedAt: string | undefined) {
  if (!updatedAt) return fallbackLastModified;
  const value = new Date(updatedAt);
  return Number.isNaN(value.getTime()) ? fallbackLastModified : value;
}

function uniqueRecordsBySlug<T extends { slug: string }>(records: readonly T[]) {
  return [
    ...new Map(
      records
        .filter((record) => record.slug.length > 0)
        .map((record) => [record.slug, record])
    ).values()
  ];
}

function entry(
  path: string,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  lastModified = fallbackLastModified,
  alternates?: MetadataRoute.Sitemap[number]['alternates']
) {
  return {
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
    ...(alternates ? { alternates } : {})
  };
}

function nordicAlternatesFor(logicalPath: string): MetadataRoute.Sitemap[number]['alternates'] {
  return {
    languages: Object.fromEntries(
      nordicCountryRoutes.map((country) => [nordicHreflangByCountry[country], `${siteUrl}/${country}${logicalPath}`])
    )
  };
}

function buildNordicCountrySitemapEntries(): MetadataRoute.Sitemap {
  return nordicLogicalRoutes.flatMap((logicalPath) => {
    const alternates = nordicAlternatesFor(logicalPath);
    return nordicCountryRoutes.map((country) => entry(`/${country}${logicalPath}`, 0.64, 'weekly', fallbackLastModified, alternates));
  });
}

export function buildCatalogSitemapEntries(): MetadataRoute.Sitemap {
  const products = uniqueRecordsBySlug(productSitemapRecords);
  const categories = uniqueRecordsBySlug(categorySitemapRecords);
  const stores = uniqueRecordsBySlug(storeSitemapRecords);

  return [
    ...products.map((product) => entry(`/products/${product.slug}`, 0.82, 'daily', lastModifiedFrom(product.updatedAt))),
    ...categories.map((category) => entry(`/categories/${category.slug}`, 0.74, 'daily')),
    ...stores.map((store) => entry(`/stores/${store.slug}`, 0.58, 'weekly', lastModifiedFrom(store.updatedAt)))
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    entry('/', 1, 'daily'),
    entry('/products', 0.95, 'daily'),
    // Public entry points that alias the product discovery and item lookup surfaces.
    entry('/items', 0.9, 'daily'),
    entry('/search', 0.9, 'daily'),
    entry('/compare', 0.9, 'daily'),
    entry('/compare-items', 0.88, 'daily'),
    entry('/cultural-aisles', 0.82, 'weekly'),
    entry('/coverage', 0.66, 'daily'),
    entry('/deals', 0.9, 'daily'),
    entry('/screener', 0.9, 'daily'),
    entry('/alerts', 0.72, 'daily'),
    entry('/fuel', 0.7, 'weekly'),
    entry('/pharmacy', 0.7, 'weekly'),
    entry('/pricing', 0.72, 'weekly'),
    entry('/seasonal-calendar', 0.89, 'weekly'),
    entry('/meal-cost', 0.88, 'daily'),
    entry('/weekly-basket', 0.85, 'daily'),
    entry('/chain-index', 0.85, 'daily'),
    entry('/widgets/grocery-index-ticker', 0.7, 'daily'),
    entry('/categories', 0.8, 'daily'),
    entry('/stores', 0.75, 'weekly'),
    entry('/map', 0.75, 'daily'),
    entry('/cookies', 0.68, 'weekly'),
    entry('/data-sources', 0.65, 'weekly'),
    entry('/methodology', 0.65, 'weekly'),
    entry('/openprices-depth', 0.65, 'daily'),
    entry('/store-coverage', 0.65, 'weekly'),
    entry('/chain-coverage', 0.65, 'weekly'),
    ...countryTermsRoutes.map((country) => entry(`/${country}/terms`, 0.52, 'monthly'))
  ];

  const seoLandingRoutes = seoLandingProducts.flatMap((product) => [
    entry(`/billigaste/${product.slug}`, 0.78, 'daily'),
    entry(`/prisjamforelse/${product.slug}`, 0.78, 'daily'),
    ...seoLandingCities.map((city) =>
      entry(`/${city.slug}/billigaste/${product.slug}`, 0.72, 'daily')
    )
  ]);

  return [
    ...staticRoutes,
    ...buildNordicCountrySitemapEntries(),
    ...buildCatalogSitemapEntries(),
    ...seoLandingRoutes
  ];
}
