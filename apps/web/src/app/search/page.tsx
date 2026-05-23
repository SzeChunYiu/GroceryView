import ProductsPage from '../products/page';
import { routeMetadata, type RouteSearchParams } from '@/lib/seo';

type SearchParams = RouteSearchParams;

export async function generateMetadata({ searchParams }: Readonly<{ searchParams?: Promise<SearchParams> }>) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  return routeMetadata(
    {
      path: '/search',
      title: 'Grocery product search | GroceryView',
      description: 'Search and filter verified Swedish grocery products by category, chain, brand, price, and confidence signals.',
    },
    resolvedSearchParams
  );
}

export default async function SearchPage({ searchParams }: Readonly<{ searchParams?: Promise<SearchParams> }>) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  return <ProductsPage searchParams={Promise.resolve(resolvedSearchParams)} />;
}
