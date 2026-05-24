import { routeMetadata } from '@/lib/seo';

export { default } from '../chain-coverage/page';

export function generateMetadata() {
  return routeMetadata('/coverage');
}

export const dynamic = 'force-static';
