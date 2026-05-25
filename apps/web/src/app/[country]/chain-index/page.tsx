import { MarketCountryPage, generateCountryParams } from '../market-page-content';
import { marketCanonicalPath, marketCountryForSlug, marketLanguageAlternates } from '@/lib/market-routing';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const generateStaticParams = generateCountryParams;

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const entry = marketCountryForSlug(country);
  const canonicalPath = marketCanonicalPath((entry?.slug ?? 'sweden'), 'chain-index');

  return {
    title: `${entry?.label ?? 'Sweden'} grocery chain index | GroceryView`,
    description: `Country-specific grocery chain index page for ${entry?.label ?? 'Sweden'} with insufficient markets held in preview.`,
    alternates: {
      canonical: new URL(canonicalPath, siteUrl).toString(),
      languages: Object.fromEntries(Object.entries(marketLanguageAlternates('chain-index')).map(([language, href]) => [language, new URL(href, siteUrl).toString()]))
    }
  };
}

export default function CountryChainIndexPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  return <MarketCountryPage params={params} kind="chain-index" />;
}
