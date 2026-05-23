import type { MetadataRoute } from 'next';

import { pricedProducts } from '@/lib/openprices-products';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://grocery-web-mu.vercel.app';

const productSlugs = Array.from(new Set(pricedProducts.map((product) => product.slug)));

const categorySlugs = Array.from(new Set(pricedProducts.map((product) => product.category))).filter(
  (slug): slug is string => typeof slug === 'string' && slug.length > 0
);

function buildEntry(
  pathname: string,
  priority: number,
  changeFrequency: 'daily' | 'weekly' | 'monthly' = 'weekly',
): MetadataRoute.Sitemap[number] {
  return {
    url: `${BASE_URL}${pathname}`,
    lastModified: new Date().toISOString(),
    changeFrequency,
    priority
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const productEntries = productSlugs.map((slug) => buildEntry(`/products/${slug}`, 0.8));

  const categoryEntries = categorySlugs.map((slug) => buildEntry(`/categories/${slug}`, 0.7));

  return [
    buildEntry('/', 1.0, 'daily'),
    buildEntry('/products', 0.9),
    buildEntry('/categories', 0.9),
    ...productEntries,
    ...categoryEntries
  ];
}
