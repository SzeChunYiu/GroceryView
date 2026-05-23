import { notFound, redirect } from 'next/navigation';
import { findProduct } from '@/lib/verified-data';
import { metadataForItem } from '@/lib/seo';

type RouteParams = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: RouteParams) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) notFound();
  return metadataForItem(product);
}

export default async function ItemPage({ params }: RouteParams) {
  const { id } = await params;
  const product = findProduct(id);
  if (!product) notFound();
  redirect(`/products/${product.slug}`);
}
