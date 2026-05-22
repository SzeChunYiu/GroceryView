import { notFound } from 'next/navigation';
import { SeoProductLanding } from '@/components/seo-product-landing';
import { seoLandingProductFor, seoLandingProducts, verifiedProductForSeo } from '@/lib/seo-landing-pages';
import { metadataForProduct } from '@/lib/seo';
import { findProduct } from '@/lib/verified-data';

export function generateStaticParams() {
  return seoLandingProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const product = verifiedProductForSeo(slug);
  if (!product) notFound();
  return metadataForProduct({ ...product, slug: `billigaste/${product.slug}` });
}

export default async function CheapestLandingPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const product = seoLandingProductFor(slug);
  if (!product || !findProduct(slug)) notFound();
  const canonical = `/billigaste/${product.slug}`;
  void canonical;
  return <SeoProductLanding mode="cheapest" product={product} />;
}
