import { SearchFirstHome } from '@/components/home/search-first-home';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/');
}

export default function HomePage() {
  return <SearchFirstHome />;
}
