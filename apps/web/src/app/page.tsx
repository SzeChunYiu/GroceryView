import { MarketShell } from '@/components/market-shell';
import { PromoBanner, defaultPromoBanners } from '@/components/PromoBanner';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/');
}


export default function HomePage() {
  return (
    <section className="grid gap-5">
      <PromoBanner banners={defaultPromoBanners} />
      <MarketShell />
    </section>
  );
}
