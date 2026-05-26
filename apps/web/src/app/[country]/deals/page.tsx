import { MarketCountryPage, generateCountryParams } from '../market-page-content';
import { marketCanonicalPath, marketCountryForSlug, marketLanguageAlternates } from '@/lib/market-routing';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const generateStaticParams = generateCountryParams;

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const entry = marketCountryForSlug(country);
  const canonicalPath = marketCanonicalPath((entry?.slug ?? 'sweden'), 'deals');

  return {
    title: `${entry?.label ?? 'Sweden'} grocery deals | GroceryView`,
    description: `Country-specific grocery deals page for ${entry?.label ?? 'Sweden'} with dated offer evidence required before live cards render.`,
    alternates: {
      canonical: new URL(canonicalPath, siteUrl).toString(),
      languages: Object.fromEntries(Object.entries(marketLanguageAlternates('deals')).map(([language, href]) => [language, new URL(href, siteUrl).toString()]))
    }
  };
}

export default function CountryDealsPage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  return <MarketCountryPage params={params} kind="deals" />;
}
