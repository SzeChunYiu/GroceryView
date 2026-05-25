import ProductsPage, { ProductsListingPage } from '../products/page';
import { routeMetadata } from '@/lib/seo';

type SearchParams = Parameters<typeof ProductsPage>[0]['searchParams'];

export function generateMetadata() {
  return routeMetadata('/search');
}

export default function SearchPage({ searchParams }: { searchParams?: SearchParams }) {
  return <ProductsListingPage basePath="/search" searchParams={searchParams} />;
}
