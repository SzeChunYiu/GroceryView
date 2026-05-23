import { redirect } from 'next/navigation';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/deals');
}

export default function DealsRedirectPage() {
  redirect('/screener');
}
