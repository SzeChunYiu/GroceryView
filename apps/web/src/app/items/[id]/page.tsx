import type { Metadata } from 'next';
import ProductPage, {
  generateMetadata as generateProductMetadata,
  generateStaticParams
} from '../../products/[slug]/page';
import { BackInStockBanner } from '@/components/BackInStockBanner';
import { ItemDetailListShortcut } from '@/components/item-detail-list-shortcut';
import { chainPriceRows, findProduct } from '@/lib/verified-data';

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

function chainName(chain: string) {
  if (chain === 'willys') return 'Willys';
  if (chain === 'hemkop') return 'Hemköp';
  return chain.replaceAll('-', ' ');
}

function backInStockAvailabilityForProduct(product: NonNullable<ReturnType<typeof findProduct>> | undefined) {
  if (!product || !('lowestPrice' in product)) return null;

  const backInStockRow = chainPriceRows(product)
    .map((row) => row as typeof row & {
      observedAt?: string;
      previousOutOfStockAt?: string;
      storeName?: string;
    })
    .find((row) => row.isAvailable !== false && typeof row.previousOutOfStockAt === 'string' && row.previousOutOfStockAt.trim().length > 0);

  if (!backInStockRow) return null;

  const displayChainName = chainName(backInStockRow.chain);
  const previousOutOfStockAt = backInStockRow.previousOutOfStockAt;
  if (!previousOutOfStockAt) return null;

  return {
    chainName: displayChainName,
    currency: 'SEK',
    currentObservedAt: backInStockRow.observedAt ?? '2026-05-21T00:00:00.000Z',
    previousOutOfStockAt,
    price: backInStockRow.price,
    storeName: backInStockRow.storeName ?? `${displayChainName} online catalog`
  };
}

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const product = findProduct(id);
  const renderedProductPage = await ProductPage({ params: Promise.resolve({ slug: id }), routeBase: 'items' });

  return (
    <>
      <BackInStockBanner availability={backInStockAvailabilityForProduct(product)} />
      {renderedProductPage}
      <ItemDetailListShortcut
        productId={id}
        productName={product?.name ?? id}
        quantity={product ? productQuantity(product) : undefined}
      />
    </>
  );
}
