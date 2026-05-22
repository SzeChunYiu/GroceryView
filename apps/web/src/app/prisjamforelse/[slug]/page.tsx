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
  return metadataForProduct({ ...product, slug: `prisjamforelse/${product.slug}` });
}

export default async function ComparisonLandingPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const product = seoLandingProductFor(slug);
  if (!product || !findProduct(slug)) notFound();
  const canonical = `/prisjamforelse/${product.slug}`;
  void canonical;
  return <SeoProductLanding mode="comparison" product={product} />;
}
