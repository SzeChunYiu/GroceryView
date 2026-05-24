import { PromoBanner, type PromoBannerItem } from '@/components/PromoBanner';
import { MarketShell } from '@/components/market-shell';

const homepageBanners: PromoBannerItem[] = [
  {
    id: 'seasonal-apr',
    title: 'Seasonal deals are live',
    detail: 'Fresh seasonal bundles in Stockholm are now rotated daily with top value highlights across stores.',
    ctaLabel: 'View seasonal deals',
    ctaHref: '/categories/produce',
    accent: 'warm'
  },
  {
    id: 'new-retailer',
    title: 'New retailer added',
    detail: 'A new Stockholm retailer is now live with verified shelf and confidence scoring enabled.',
    ctaLabel: 'See the new retailer',
    ctaHref: '/stores',
    accent: 'cool'
  },
  {
    id: 'weekly-basket',
    title: 'Weekly basket savings rotate',
    detail: 'Deal suggestions rotate through new high-confidence weekly savings opportunities each few seconds.',
    ctaLabel: 'Open basket planner',
    ctaHref: '/weekly-basket',
    accent: 'mint'
  }
];

export default function HomePage() {
  return (
    <>
      <PromoBanner banners={homepageBanners} />
      <MarketShell />
    </>
  );
}
