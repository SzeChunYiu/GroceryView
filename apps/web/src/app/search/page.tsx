import ProductsPage from '@/app/products/page';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/search');
}

export default ProductsPage;
