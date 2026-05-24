import { MarketShell } from '@/components/market-shell';
import { routeMetadata } from '@/lib/seo';
import { getWeeklyDealsFromApi } from '@/lib/weekly-deals';

export function generateMetadata() {
  return routeMetadata('/');
}

export default async function HomePage() {
  const weeklyDeals = await getWeeklyDealsFromApi();
  return <MarketShell weeklyDeals={weeklyDeals} />;
}
