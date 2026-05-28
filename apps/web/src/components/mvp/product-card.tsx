import type { ProductSummary } from '@/lib/mvp/types';
import { ProductPreviewCard } from '@/components/preview/product-preview-card';
import { productRoute, productSlugHref } from '@/lib/mvp/routes';

export { productRoute };

/** Slug-based product links for grids (preview card uses productSlugHref(product.slug)). */
export function mvpProductCardHref(product: ProductSummary) {
  return productSlugHref(product.slug);
}

export function MvpProductCard({ product }: Readonly<{ product: ProductSummary }>) {
  return <ProductPreviewCard product={product} />;
}
