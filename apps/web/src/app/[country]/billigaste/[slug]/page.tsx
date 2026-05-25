import { notFound } from 'next/navigation';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { findSeoLandingCity, findSeoLandingProduct, metadataForCityCheapestLanding, seoLandingCities, seoLandingProducts } from '@/lib/seo-landing-pages';

export function generateStaticParams() {
  return seoLandingCities.flatMap((city) => seoLandingProducts.map((product) => ({ country: city.slug, slug: product.slug })));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string; slug: string }> }>) {
  const { country: citySlug, slug } = await params;
  const city = findSeoLandingCity(citySlug);
  const product = findSeoLandingProduct(slug);
  if (!city || !product) notFound();
  return metadataForCityCheapestLanding(product, city);
}

export default async function CityCheapestProductLandingPage({ params }: Readonly<{ params: Promise<{ country: string; slug: string }> }>) {
  const { country: citySlug, slug } = await params;
  const city = findSeoLandingCity(citySlug);
  const product = findSeoLandingProduct(slug);
  if (!city || !product) notFound();
  return <SeoLandingPage product={product} city={city} kind="city" />;
}
