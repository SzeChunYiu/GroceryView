import { notFound } from 'next/navigation';
import { SeoProductLanding } from '@/components/seo-product-landing';
import { seoLandingCities, seoLandingCityFor, seoLandingProductFor, seoLandingProducts, verifiedProductForSeo } from '@/lib/seo-landing-pages';
import { metadataForProduct } from '@/lib/seo';
import { findProduct } from '@/lib/verified-data';

export function generateStaticParams() {
  return seoLandingCities.flatMap((city) => seoLandingProducts.slice(0, 8).map((product) => ({ city: city.slug, slug: product.slug })));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ city: string; slug: string }> }>) {
  const { city: citySlug, slug } = await params;
  const city = seoLandingCityFor(citySlug);
  const product = verifiedProductForSeo(slug);
  if (!city || !product) notFound();
  return metadataForProduct({ ...product, slug: `stad/${city.slug}/${product.slug}` });
}

export default async function CityLandingPage({ params }: Readonly<{ params: Promise<{ city: string; slug: string }> }>) {
  const { city: citySlug, slug } = await params;
  const city = seoLandingCityFor(citySlug);
  const product = seoLandingProductFor(slug);
  if (!city || !product || !findProduct(slug)) notFound();
  const canonical = `/stad/${city.slug}/${product.slug}`;
  void canonical;
  return <SeoProductLanding cityEvidence={city.evidence} cityName={city.name} mode="city" product={product} />;
}
