import { routeMetadata } from '@/lib/seo';
export { default } from '../products/page';

export function generateMetadata() {
  return routeMetadata('/search');
}

