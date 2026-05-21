import { MarketShell } from '@/components/market-shell';

export const metadata = {
  title: 'GroceryView verified grocery snapshot',
  description: 'Verified Stockholm grocery price, product browsing, fresh OpenPrices observations, source route mapping, catalogue savings, map chain index signals, and gated feature readiness.'
};

export default function HomePage() {
  return <MarketShell />;
}
