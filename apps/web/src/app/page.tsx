import { MarketShell } from '@/components/market-shell';

export const metadata = {
  title: 'GroceryView verified grocery snapshot',
  description: 'Verified Stockholm grocery price, category freshness, source freshness, store coverage, and gated feature readiness.'
};

export default function HomePage() {
  return <MarketShell />;
}
