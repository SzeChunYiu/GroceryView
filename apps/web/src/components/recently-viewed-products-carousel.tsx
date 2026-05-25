'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  clearRecentlyViewedProducts,
  readRecentlyViewedProducts,
  recentlyViewedProductsChangedEvent,
  type RecentlyViewedProductEntry
} from '@/lib/personalization';

export function RecentlyViewedProductsCarousel({ className = '' }: Readonly<{ className?: string }>) {
  const [items, setItems] = useState<RecentlyViewedProductEntry[]>([]);

  useEffect(() => {
    const refresh = () => setItems(readRecentlyViewedProducts());
    refresh();
    window.addEventListener(recentlyViewedProductsChangedEvent, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(recentlyViewedProductsChangedEvent, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section className={`rounded-[1.5rem] border border-cyan-200 bg-cyan-50/80 p-4 shadow-sm ${className}`} data-recently-viewed-products-carousel>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">Recently viewed</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Return to products from this device</h2>
        </div>
        <button className="rounded-full bg-white px-3 py-2 text-xs font-black text-cyan-900 shadow-sm" onClick={() => setItems(clearRecentlyViewedProducts())} type="button">
          Clear
        </button>
      </div>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1" role="list">
        {items.map((item) => (
          <Link className="grid min-w-56 max-w-56 gap-3 rounded-2xl border border-cyan-100 bg-white p-3 shadow-sm hover:border-cyan-700" href={item.href} key={item.slug} role="listitem">
            <div className="flex gap-3">
              {item.imageUrl ? (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 ring-1 ring-cyan-100">
                  <Image alt={`${item.name} product image`} className="max-h-full max-w-full object-contain" height={56} loading="lazy" src={item.imageUrl} width={56} />
                </div>
              ) : null}
              <div>
                <p className="line-clamp-2 text-sm font-black text-slate-950">{item.name}</p>
                {item.brand ? <p className="mt-1 text-xs font-semibold text-slate-500">{item.brand}</p> : null}
              </div>
            </div>
            {item.priceLabel ? <p className="text-sm font-black text-cyan-900">{item.priceLabel}</p> : null}
            <p className="text-xs font-semibold text-slate-500">{new Date(item.viewedAt).toLocaleString('sv-SE')}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
