'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FavouriteProductToggle } from '@/components/favourite-product-toggle';
import {
  FAVOURITE_BRANDS_UPDATED_EVENT,
  FAVOURITES_UPDATED_EVENT,
  readFavouriteBrandPreferenceEntries,
  readFavouriteProductEntries,
  saveFavouriteBrandPreferenceEntries,
  setFavouriteBrandPreference,
  type FavouriteBrandPreference,
  type FavouriteBrandPreferenceEntry,
  type FavouriteProductEntry
} from '@/lib/favourites';

export type FavouriteProductCatalogItem = {
  slug: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  imageAlt: string | null;
  productKind: string;
  totalPriceLabel: string;
  unitPriceLabel: string;
  packageLabel: string;
  sourceLabel: string;
  confidenceLabel: string;
  priceDropBadge: string | null;
  isAvailable: boolean;
  totalSortPrice: number;
};

function Eyebrow({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">{children}</p>;
}

function Card({ children, className = '' }: Readonly<{ children: ReactNode; className?: string }>) {
  return <section className={`rounded-[1.75rem] border border-slate-200 bg-white/88 p-5 shadow-sm ${className}`}>{children}</section>;
}

function readSavedProducts(): FavouriteProductEntry[] {
  return readFavouriteProductEntries();
}

export function FavouriteProductsPageClient({ productCatalogue }: Readonly<{ productCatalogue: FavouriteProductCatalogItem[] }>) {
  const [savedProducts, setSavedProducts] = useState<FavouriteProductEntry[]>([]);
  const [brandPreferences, setBrandPreferences] = useState<FavouriteBrandPreferenceEntry[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    function syncSavedProducts() {
      setSavedProducts(readSavedProducts());
      setBrandPreferences(readFavouriteBrandPreferenceEntries());
      setHasLoaded(true);
    }

    syncSavedProducts();
    window.addEventListener('storage', syncSavedProducts);
    window.addEventListener(FAVOURITES_UPDATED_EVENT, syncSavedProducts);
    window.addEventListener(FAVOURITE_BRANDS_UPDATED_EVENT, syncSavedProducts);
    return () => {
      window.removeEventListener('storage', syncSavedProducts);
      window.removeEventListener(FAVOURITES_UPDATED_EVENT, syncSavedProducts);
      window.removeEventListener(FAVOURITE_BRANDS_UPDATED_EVENT, syncSavedProducts);
    };
  }, []);

  const savedProductsBySlug = useMemo(() => new Map(savedProducts.map((product, index) => [product.slug, { product, index }])), [savedProducts]);
  const brandPreferencesByBrand = useMemo(() => new Map(brandPreferences.map((entry) => [entry.brand.toLocaleLowerCase('sv-SE'), entry])), [brandPreferences]);
  const productSlugs = useMemo(() => new Set(productCatalogue.map((product) => product.slug)), [productCatalogue]);
  const visibleProducts = useMemo(() => productCatalogue.filter((liveProduct) => savedProductsBySlug.has(liveProduct.slug))
    .map((liveProduct) => {
      const saved = savedProductsBySlug.get(liveProduct.slug)!;
      return { savedProduct: saved.product, savedIndex: saved.index, liveProduct };
    })
    .sort((left, right) => left.savedIndex - right.savedIndex), [productCatalogue, savedProductsBySlug]);
  const staleSavedProducts = savedProducts.filter((savedProduct) => !productSlugs.has(savedProduct.slug));
  const cheapestSavedProduct = [...visibleProducts].sort((left, right) => left.liveProduct.totalSortPrice - right.liveProduct.totalSortPrice)[0]?.liveProduct;
  const preferredBrandCount = brandPreferences.filter((entry) => entry.preference === 'preferred').length;
  const avoidedBrandCount = brandPreferences.filter((entry) => entry.preference === 'avoided').length;

  function markBrand(brand: string, preference: FavouriteBrandPreference) {
    const nextPreferences = setFavouriteBrandPreference(brandPreferences, brand, preference);
    if (saveFavouriteBrandPreferenceEntries(nextPreferences)) {
      setBrandPreferences(nextPreferences);
      window.dispatchEvent(new Event(FAVOURITE_BRANDS_UPDATED_EVENT));
    }
  }

  return (
    <div>
      <Eyebrow>Local favourites</Eyebrow>
      <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Favourite products saved on this device</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            Heart products from the catalogue to keep a local shortlist. The favourites array is stored in browser localStorage only,
            while this page rehydrates each saved product from the current verified product price cards so prices stay current on every load.
          </p>
        </div>
        <Card className="border-rose-200 bg-rose-50 p-4 text-right">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-rose-800">Saved products</p>
          <p className="mt-1 text-4xl font-black text-slate-950">{hasLoaded ? visibleProducts.length : '—'}</p>
          <p className="text-sm font-semibold text-slate-600">localStorage favourites</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Current price source</p>
          <p className="mt-2 text-xl font-black text-slate-950">Live verified cards</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Saved slugs are matched back to adaptiveProductCards; no backend or stored stale price is trusted.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Lowest saved current price</p>
          <p className="mt-2 text-2xl font-black text-emerald-800">{cheapestSavedProduct?.totalPriceLabel ?? 'No saved price yet'}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{cheapestSavedProduct?.name ?? 'Save a product heart first'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Device privacy</p>
          <p className="mt-2 text-xl font-black text-slate-950">No account write</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">This local favourite list never calls network APIs and never syncs to a backend account.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Brand preferences</p>
          <p className="mt-2 text-xl font-black text-slate-950">{preferredBrandCount} preferred · {avoidedBrandCount} avoided</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">Mark brands directly from saved favourites so recommendation explanations can respect explicit likes and avoids.</p>
        </Card>
      </div>

      {!hasLoaded ? (
        <Card className="mt-6 p-6">
          <p className="text-sm font-black text-slate-700">Loading saved product favourites from this browser…</p>
        </Card>
      ) : visibleProducts.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map(({ savedProduct, liveProduct }) => (
            <Card className="relative overflow-hidden border-rose-100 bg-white p-4" key={liveProduct.slug}>
              {(() => {
                const brandPreference = brandPreferencesByBrand.get(liveProduct.brand.toLocaleLowerCase('sv-SE'))?.preference;
                return (
                  <>
              <div className="absolute right-3 top-3 z-10">
                <FavouriteProductToggle product={{ slug: liveProduct.slug, name: liveProduct.name, imageUrl: liveProduct.imageUrl }} />
              </div>
              <Link className="group block pr-24" href={`/products/${liveProduct.slug}`}>
                {liveProduct.imageUrl && liveProduct.imageAlt ? (
                  <div className="mb-4 flex h-32 items-center justify-center rounded-3xl border border-rose-50 bg-rose-50/60 p-3">
                    <Image alt={liveProduct.imageAlt} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={128} sizes="(min-width: 1280px) 18vw, (min-width: 768px) 34vw, 80vw" src={liveProduct.imageUrl} width={128} />
                  </div>
                ) : null}
                <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">saved product · {liveProduct.productKind}</p>
                <h2 className="mt-2 text-xl font-black text-slate-950">{liveProduct.name}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">{liveProduct.brand} · {liveProduct.packageLabel}</p>
              </Link>
              <div className="mt-4 rounded-3xl bg-slate-950 p-4 text-white">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">Current price</p>
                <p className="mt-1 text-3xl font-black">{liveProduct.totalPriceLabel}</p>
                <p className="mt-1 text-sm font-bold text-slate-200">{liveProduct.unitPriceLabel}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {liveProduct.isAvailable === false ? <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-900">Out of stock</span> : null}
                {liveProduct.priceDropBadge ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-950">{liveProduct.priceDropBadge}</span> : null}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">saved {savedProduct.savedAt ? savedProduct.savedAt.slice(0, 10) : 'locally'}</span>
                {brandPreference ? <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-900">brand {brandPreference}</span> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2" aria-label={`Brand preference actions for ${liveProduct.brand}`}>
                <button className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-900" onClick={() => markBrand(liveProduct.brand, 'preferred')} type="button">
                  Prefer {liveProduct.brand}
                </button>
                <button className="rounded-full bg-rose-100 px-3 py-2 text-xs font-black text-rose-900" onClick={() => markBrand(liveProduct.brand, 'avoided')} type="button">
                  Avoid {liveProduct.brand}
                </button>
              </div>
              <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-700">{liveProduct.sourceLabel}</p>
              <p className="mt-2 rounded-2xl bg-emerald-50 p-3 text-xs font-black leading-5 text-emerald-950">{liveProduct.confidenceLabel}</p>
                  </>
                );
              })()}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-6 border-dashed border-rose-200 bg-rose-50/60 p-8 text-center">
          <p className="text-2xl font-black text-slate-950">No favourite products yet</p>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
            Open the product catalogue and tap a heart on any product card. Your saved product shortlist will appear here with current price evidence from the latest verified card data.
          </p>
          <Link className="mt-5 inline-flex rounded-full bg-rose-700 px-5 py-3 text-sm font-black text-white" href="/products">Browse products</Link>
        </Card>
      )}

      {staleSavedProducts.length > 0 ? (
        <Card className="mt-6 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-black text-amber-950">Some saved product slugs no longer appear in the current catalogue and were hidden rather than shown with stale prices.</p>
          <p className="mt-2 text-xs font-semibold text-amber-900">{staleSavedProducts.map((product) => product.name).join(', ')}</p>
        </Card>
      ) : null}
    </div>
  );
}
