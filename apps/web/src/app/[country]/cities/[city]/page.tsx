import { MarketCityPage, generateCityParams } from '../../market-page-content';
import { marketCityPreviews, marketCountryForSlug } from '@/lib/market-routing';
import { siteUrl } from '@/lib/seo';

export const dynamic = 'force-static';
export const generateStaticParams = generateCityParams;

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string; city: string }> }>) {
  const { country, city } = await params;
  const entry = marketCountryForSlug(country);
  const cityEntry = marketCityPreviews.find((candidate) => candidate.country === country && candidate.slug === city);
  const path = entry && cityEntry ? `/${entry.slug}/cities/${cityEntry.slug}` : '/sweden/cities/stockholm';

  return {
    title: `${cityEntry?.label ?? 'Stockholm'} grocery price preview | GroceryView`,
    description: `${cityEntry?.label ?? 'Stockholm'} market-specific GroceryView city page with live claims withheld until verified local rows exist.`,
    alternates: {
      canonical: new URL(path, siteUrl).toString(),
      languages: entry ? { [entry.language]: new URL(path, siteUrl).toString() } : undefined
    }
  };
}

export default function CountryCityPage({ params }: Readonly<{ params: Promise<{ country: string; city: string }> }>) {
  return <MarketCityPage params={params} />;
}
