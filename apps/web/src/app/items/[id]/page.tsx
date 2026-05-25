import type { Metadata } from 'next';
import ProductPage, {
  generateMetadata as generateProductMetadata,
  generateStaticParams
} from '../../products/[slug]/page';
import { ItemDetailListShortcut } from '@/components/item-detail-list-shortcut';
import { csvDataHref, csvFilenameSegment, exportCsv, type CsvCell } from '@/lib/exportCsv';
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

function priceSnapshotRows(product: NonNullable<ReturnType<typeof findProduct>>): CsvCell[][] {
  if ('lowestPrice' in product) {
    return chainPriceRows(product).map((row) => [
      product.slug,
      product.name,
      row.chain,
      row.price,
      row.priceUnit,
      row.priceText,
      row.savings ?? '',
      'current-chain-snapshot'
    ]);
  }

  return product.observations.map((observation) => [
    product.slug,
    product.name,
    '',
    observation.price,
    'SEK',
    observation.price,
    '',
    observation.date
  ]);
}

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const product = findProduct(id);
  const renderedProductPage = await ProductPage({ params: Promise.resolve({ slug: id }) });
  const snapshotRows = product ? priceSnapshotRows(product) : [];
  const priceSnapshotsCsv = exportCsv([
    'product_id',
    'product_name',
    'chain',
    'price',
    'unit',
    'price_label',
    'savings',
    'observed_at'
  ], snapshotRows);

  return (
    <>
      {renderedProductPage}
      <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6 lg:px-8">
        <a
          className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm"
          download={`price-history-${csvFilenameSegment(id)}.csv`}
          href={csvDataHref(priceSnapshotsCsv)}
        >
          Download price snapshots CSV
        </a>
      </div>
      <ItemDetailListShortcut
        productId={id}
        productName={product?.name ?? id}
        quantity={product ? productQuantity(product) : undefined}
      />
    </>
  );
}
