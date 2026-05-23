import { MarketShell } from '@/components/market-shell';
import { routeMetadata } from '@/lib/seo';

type SearchParams = Record<string, string | string[] | undefined>;

export function generateMetadata() {
  return routeMetadata('/');
}

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({ searchParams }: Readonly<{ searchParams?: Promise<SearchParams> }>) {
  const params = (await searchParams) ?? {};
  return <MarketShell selectedBrand={paramValue(params.brand)} />;
}
