import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

export type ProductGridCard = {
  slug: string;
  imageUrl?: string | null;
  name: string;
  brand: string;
  isAvailable?: boolean;
  categoryLabel: string;
  cheapestPriceLabel: string;
  unitPriceLabel: string;
  chainLabel: string;
  sourceTables: readonly string[];
};

type ProductGridProps = {
  products: Promise<readonly ProductGridCard[]>;
  partialProducts: readonly ProductGridCard[];
};

function ProductTiles({ products, partial = false }: { products: readonly ProductGridCard[]; partial?: boolean }) {
  if (products.length === 0) {
    return <p className="mt-5 rounded-2xl bg-white p-4 text-sm font-black text-violet-900 shadow-sm">No verified products match the active filters yet.</p>;
  }

  return (
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <Link className="group rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-700" href={`/products/${product.slug}`} key={product.slug}>
          <div className="flex gap-3">
            {product.imageUrl ? (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-violet-100">
                <Image alt={`${product.name} product image`} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={80} sizes="80px" src={product.imageUrl} width={80} />
              </div>
            ) : null}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">{product.brand}</p>
                {product.isAvailable === false ? (
                  <span className="rounded-full bg-rose-100 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-rose-900">Out of stock</span>
                ) : null}
                {partial ? <span className="rounded-full bg-violet-100 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-violet-900">Hydrating</span> : null}
              </div>
              <h3 className="mt-1 text-lg font-black text-slate-950">{product.name}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{product.categoryLabel}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-xs font-black text-slate-700">
            <p>{product.cheapestPriceLabel} · {product.unitPriceLabel}</p>
            <p>{product.chainLabel}</p>
            <p className="text-violet-800">sourceTables: {product.sourceTables.join(' · ')}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

async function HydratedProductTiles({ products }: { products: Promise<readonly ProductGridCard[]> }) {
  const hydratedProducts = await products;
  return <ProductTiles products={hydratedProducts} />;
}

export function ProductGrid({ partialProducts, products }: ProductGridProps) {
  return (
    <Suspense fallback={(
      <div aria-busy="true">
        <p className="mt-5 rounded-2xl bg-violet-900 px-4 py-3 text-sm font-black text-white shadow-sm">
          Showing the first {partialProducts.length.toLocaleString('sv-SE')} partial matches while the full result grid hydrates.
        </p>
        <ProductTiles partial products={partialProducts} />
      </div>
    )}>
      <HydratedProductTiles products={products} />
    </Suspense>
  );
}
