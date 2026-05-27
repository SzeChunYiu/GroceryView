import { MarketCountryPage, generateCountryParams } from '../market-page-content';
import { marketCanonicalPath, marketCountryForSlug, marketLanguageAlternates } from '@/lib/market-routing';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const generateStaticParams = generateCountryParams;

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const entry = marketCountryForSlug(country);
  const canonicalPath = marketCanonicalPath((entry?.slug ?? 'sweden'), 'compare');

  return {
    title: `${entry?.label ?? 'Sweden'} grocery price comparison | GroceryView`,
    description: `Country-specific grocery price comparison page for ${entry?.label ?? 'Sweden'} with preview markets kept separate from live Swedish rankings.`,
    alternates: {
      canonical: new URL(canonicalPath, siteUrl).toString(),
      languages: Object.fromEntries(Object.entries(marketLanguageAlternates('compare')).map(([language, href]) => [language, new URL(href, siteUrl).toString()]))
    }
  };
}

export default function CountryComparePage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  return <MarketCountryPage params={params} kind="compare" />;
}
