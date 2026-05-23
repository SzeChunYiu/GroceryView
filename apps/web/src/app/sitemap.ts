import type { MetadataRoute } from 'next';
import { categoryLabels } from '@/lib/openprices-products';
import { osmStores } from '@/lib/osm-stores';
import { seoLandingCities, seoLandingProducts } from '@/lib/seo-landing-pages';
import { productUniverse } from '@/lib/verified-data';

const siteUrl = 'https://grocery-web-mu.vercel.app';
const lastModified = new Date('2026-05-22T00:00:00.000Z');

function entry(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']) {
  return {
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    entry('/', 1, 'daily'),
    entry('/products', 0.95, 'daily'),
    entry('/compare', 0.9, 'daily'),
    entry('/deals', 0.9, 'daily'),
    entry('/screener', 0.9, 'daily'),
    entry('/fuel', 0.7, 'weekly'),
    entry('/pharmacy', 0.7, 'weekly'),
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
    entry('/openprices-depth', 0.65, 'daily'),
    entry('/store-coverage', 0.65, 'weekly'),
    entry('/chain-coverage', 0.65, 'weekly')
  ];

  const productRoutes = productUniverse.map((product) =>
    entry(`/products/${product.slug}`, 0.82, 'daily')
  );
  const categoryRoutes = Object.keys(categoryLabels).map((slug) =>
    entry(`/categories/${slug}`, 0.74, 'daily')
  );
  const storeRoutes = osmStores.slice(0, 80).map((store) =>
    entry(`/stores/${store.slug}`, 0.58, 'weekly')
  );
  const seoLandingRoutes = seoLandingProducts.flatMap((product) => [
    entry(`/billigaste/${product.slug}`, 0.78, 'daily'),
    entry(`/prisjamforelse/${product.slug}`, 0.78, 'daily'),
    ...seoLandingCities.map((city) =>
      entry(`/${city.slug}/billigaste/${product.slug}`, 0.72, 'daily')
    )
  ]);

  return [
    ...staticRoutes,
    ...productRoutes,
    ...categoryRoutes,
    ...storeRoutes,
    ...seoLandingRoutes
  ];
}
