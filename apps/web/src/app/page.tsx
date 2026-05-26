import { MvpHomePage } from '@/components/mvp/mvp-home-page';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/');
}

export default function HomePage() {
  return <MvpHomePage />;
}
