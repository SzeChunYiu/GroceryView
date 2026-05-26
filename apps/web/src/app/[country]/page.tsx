import { MarketCountryPage, generateCountryParams } from './market-page-content';
import { marketCountryForSlug, marketLanguageAlternates } from '@/lib/market-routing';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const generateStaticParams = generateCountryParams;

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const entry = marketCountryForSlug(country);
  const path = entry ? `/${entry.slug}` : '/sweden';

  return {
    title: `${entry?.label ?? 'Sweden'} grocery market | GroceryView`,
    description: entry?.summary,
    alternates: {
      canonical: new URL(path, siteUrl).toString(),
      languages: Object.fromEntries(Object.entries(marketLanguageAlternates()).map(([language, href]) => [language, new URL(href, siteUrl).toString()]))
    }
  };
}

export default function CountryMarketPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  return <MarketCountryPage params={params} kind="landing" />;
}
