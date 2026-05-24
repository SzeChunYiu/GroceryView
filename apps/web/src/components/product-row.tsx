import Image from 'next/image';
import Link from 'next/link';
import { groceryTranslator, type SupportedLocale } from '@/lib/i18n';

type ProductRowProduct = {
  brand: string;
  categoryLabel: string;
  chainLabel: string;
  cheapestPriceLabel: string;
  imageUrl?: string | null;
  isAvailable?: boolean | null;
  name: string;
  slug: string;
  sourceTables: readonly string[];
  unitPriceLabel: string;
};

type ProductRowProps = {
  locale?: SupportedLocale;
  product: ProductRowProduct;
};

export function ProductRow({ locale, product }: Readonly<ProductRowProps>) {
  const t = groceryTranslator(locale);

  return (
    <Link className="group rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-700" href={`/products/${product.slug}`}>
      <div className="flex gap-3">
        {product.imageUrl ? (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-violet-100">
            <Image alt={`${product.name} ${t('product-row.imageAltSuffix')}`} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={80} sizes="80px" src={product.imageUrl} width={80} />
          </div>
        ) : null}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">{product.brand}</p>
            {product.isAvailable === false ? (
              <span className="rounded-full bg-rose-100 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-rose-900">{t('product-row.outOfStock')}</span>
            ) : null}
          </div>
          <h3 className="mt-1 text-lg font-black text-slate-950">{product.name}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{product.categoryLabel}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-xs font-black text-slate-700">
        <p>{product.cheapestPriceLabel} · {product.unitPriceLabel}</p>
        <p>{product.chainLabel}</p>
        <p className="text-violet-800">{t('product-row.sourceTables')}: {product.sourceTables.join(' · ')}</p>
      </div>
    </Link>
  );
}
