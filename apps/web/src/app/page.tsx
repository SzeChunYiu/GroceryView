import { AdQualitySlot } from '@/components/ad-quality-slot';
import { MarketShell } from '@/components/market-shell';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/');
}


export default function HomePage() {
  return (
    <>
      <MarketShell />
      <AdQualitySlot />
    </>
  );
}
