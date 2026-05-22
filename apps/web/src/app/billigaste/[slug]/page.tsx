import { notFound } from 'next/navigation';
import { SeoLandingPage } from '@/components/seo-landing-page';
import { findSeoLandingProduct, metadataForCheapestLanding, seoLandingProducts } from '@/lib/seo-landing-pages';

export function generateStaticParams() {
  return seoLandingProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const product = findSeoLandingProduct(slug);
  if (!product) notFound();
  return metadataForCheapestLanding(product);
}

export default async function CheapestProductLandingPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const product = findSeoLandingProduct(slug);
  if (!product) notFound();
  return <SeoLandingPage product={product} kind="cheapest" />;
}
