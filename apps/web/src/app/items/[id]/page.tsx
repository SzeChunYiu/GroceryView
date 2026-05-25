import type { Metadata } from 'next';
import ProductPage, {
  generateMetadata as generateProductMetadata,
  generateStaticParams
} from '../../products/[slug]/page';
import { ItemDetailListShortcut } from '@/components/item-detail-list-shortcut';
import { shareableItemCheapestDeal } from '@/lib/shareItem';
import { findProduct } from '@/lib/verified-data';

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

export default async function ItemPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const product = findProduct(id);
  const shareDeal = shareableItemCheapestDeal(id);
  const renderedProductPage = await ProductPage({ params: Promise.resolve({ slug: id }) });

  return (
    <>
      {renderedProductPage}
      <aside id="cheapest-deal" className="mx-auto mt-6 max-w-6xl px-4 pb-28">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Share cheapest current deal</p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="text-2xl font-black text-slate-950">{shareDeal.productName}</h2>
              {shareDeal.available && shareDeal.cheapestDeal ? (
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {shareDeal.cheapestDeal.sourceLabel}: {shareDeal.cheapestDeal.priceLabel}
                  {' '}
                  <span className="text-slate-500">({shareDeal.cheapestDeal.unitLabel})</span>
                </p>
              ) : (
                <p className="mt-2 text-sm font-semibold text-slate-700">No verified current deal is available for this item yet.</p>
              )}
              <p className="mt-2 text-xs font-bold text-slate-500">
                Public URL, no login required. {shareDeal.cheapestDeal?.evidenceLabel ?? 'Deep link opens this item when evidence arrives.'}
              </p>
            </div>
            <a
              className="inline-flex rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white"
              href={shareDeal.shareUrl}
            >
              Open share link
            </a>
          </div>
          <input
            aria-label="Shareable cheapest deal URL"
            className="mt-4 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            readOnly
            value={shareDeal.shareUrl}
          />
        </div>
      </aside>
      <ItemDetailListShortcut
        productId={id}
        productName={product?.name ?? id}
        quantity={product ? productQuantity(product) : undefined}
      />
    </>
  );
}
