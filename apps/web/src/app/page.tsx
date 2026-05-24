import { MarketShell } from '@/components/market-shell';
import { PwaInstall } from '@/components/pwa-install';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/');
}

export default function HomePage() {
  return (
    <>
      <MarketShell />
      <PwaInstall />
    </>
  );
}
