import { PriceDropDigest } from '@/components/price-drop-digest';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';
import { buildPriceDropDigest, type PriceDropDigestFilters } from '@/lib/price-events';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/deals');
}

type DealsPageProps = {
  searchParams?: PriceDropDigestFilters;
};

const digestProducts = pricedProducts.map((product) => ({
  slug: product.slug,
  name: product.name,
  brand: product.brands,
  category: categoryLabels[product.category] ?? product.category,
  observations: product.observations
}));

export default function DealsPage({ searchParams = {} }: DealsPageProps) {
  const allItems = buildPriceDropDigest(digestProducts, {}, 24);
  const items = buildPriceDropDigest(digestProducts, searchParams, 18);
  const categories = [...new Set(allItems.map((item) => item.category))];
  const stores = [...new Set(allItems.map((item) => item.store))];

  return <PriceDropDigest categories={categories} filters={searchParams} items={items} stores={stores} />;
}
