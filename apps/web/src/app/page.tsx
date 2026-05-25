import { PriceDropDiscoveryRail, RecommendedDealsRail } from '@/app/page-sections/trending';
import { PersonalizedRecommendationRail } from '@/components/locale-home-page';
import { MarketShell } from '@/components/market-shell';
import { PwaInstall } from '@/components/pwa-install';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/');
}

export default function HomePage() {
  return (
    <>
      <PriceDropDiscoveryRail />
      <RecommendedDealsRail />
      <PersonalizedRecommendationRail />
      <MarketShell />
      <PwaInstall />
    </>
  );
}
