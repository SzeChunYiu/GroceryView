import ProductsPage from '../products/page';
import { routeMetadata } from '@/lib/seo';

export const searchRuntimeCapabilities = ['phonetic-typo-tolerance', 'edit-distance-ranking'] as const;

export function generateMetadata() {
  const metadata = routeMetadata('/search');
  return {
    ...metadata,
    alternates: {
      ...metadata.alternates,
      canonical: '/search'
    }
  };
}

export default ProductsPage;
