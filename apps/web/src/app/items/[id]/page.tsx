import type { Metadata } from 'next';
import ProductPage, {
  generateMetadata as generateProductMetadata,
  generateStaticParams
} from '../../products/[slug]/page';
import { ItemDetailListShortcut } from '@/components/item-detail-list-shortcut';
import { StoreComparisonChart, type StoreComparisonChartRow } from '@/components/StoreComparisonChart';
import { chainPriceRows, findProduct, formatSek, labelFromSlug } from '@/lib/verified-data';

export { generateStaticParams };

const metadataForProduct = generateProductMetadata;

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ id: string }> }>): Promise<Metadata> {
  const { id } = await params;
  const metadata = await metadataForProduct({ params: Promise.resolve({ slug: id }) });
  const itemOgImage = { url: `/items/${id}/opengraph-image`, width: 1200, height: 630, alt: `${metadata.title ?? 'GroceryView item'} social price card` };

  return {
    ...metadata,
    alternates: metadata.alternates ? { ...metadata.alternates, canonical: `/items/${id}` } : { canonical: `/items/${id}` },
    openGraph: metadata.openGraph ? { ...metadata.openGraph, url: `/items/${id}`, images: [itemOgImage] } : { images: [itemOgImage] },
    twitter: metadata.twitter ? { ...metadata.twitter, images: [itemOgImage] } : { card: 'summary_large_image', images: [itemOgImage] }
  };
}

function productQuantity(product: NonNullable<ReturnType<typeof findProduct>>) {
  return 'lowestPrice' in product ? product.subline : product.quantity;
}

function storeComparisonRows(product: NonNullable<ReturnType<typeof findProduct>> | undefined): StoreComparisonChartRow[] {
  if (!product || !('lowestPrice' in product)) return [];

  return chainPriceRows(product)
    .map((row) => ({
      storeName: labelFromSlug(row.chain),
      price: row.price,
      priceLabel: formatSek(row.price),
      evidenceLabel: row.priceText ? `${row.priceText} · ${row.priceUnit}` : row.priceUnit,
      isAvailable: row.isAvailable
    }))
    .sort((left, right) => left.price - right.price || left.storeName.localeCompare(right.storeName, 'sv'));
}

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const product = findProduct(id);
  const renderedProductPage = await ProductPage({ params: Promise.resolve({ slug: id }) });
  const comparisonRows = storeComparisonRows(product);

  return (
    <>
      {renderedProductPage}
      <StoreComparisonChart
        productName={product?.name ?? id}
        rows={comparisonRows}
        sourceLabel={comparisonRows.length > 0 ? 'Current verified chain-wide catalogue rows' : 'Store-specific current price evidence is unavailable'}
      />
      <ItemDetailListShortcut
        productId={id}
        productName={product?.name ?? id}
        quantity={product ? productQuantity(product) : undefined}
      />
    </>
  );
}
