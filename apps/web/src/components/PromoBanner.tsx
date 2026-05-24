'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export type PromoBannerItem = {
  id: string;
  title: string;
  detail: string;
  ctaLabel: string;
  ctaHref: string;
  accent: 'warm' | 'cool' | 'mint';
};

type PromoBannerProps = Readonly<{
  banners: PromoBannerItem[];
}>;

export function PromoBanner({ banners }: PromoBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeBanner = banners[activeIndex] ?? banners[0];

  useEffect(() => {
    if (banners.length <= 1) return;

    const id = setInterval(() => {
      setActiveIndex((index) => (index + 1) % banners.length);
    }, 5000);

    return () => clearInterval(id);
  }, [banners.length]);

  const accentClasses = useMemo(() => {
    switch (activeBanner?.accent) {
      case 'warm':
        return 'from-orange-500/20 to-rose-500/20 text-orange-900';
      case 'cool':
        return 'from-blue-500/20 to-indigo-500/20 text-blue-900';
      default:
        return 'from-emerald-500/20 to-emerald-400/20 text-emerald-950';
    }
  }, [activeBanner?.accent]);

  if (!activeBanner) return null;

  return (
    <section
      className={`mx-auto mt-6 flex w-full max-w-6xl items-center justify-between gap-4 rounded-lg bg-gradient-to-r px-5 py-4 ${accentClasses}`}
    >
      <div>
        <div className="text-xs font-black uppercase tracking-widest">Promotion</div>
        <h2 className="mt-2 text-lg font-black">{activeBanner.title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-black/75">{activeBanner.detail}</p>
      </div>
      <Link
        href={activeBanner.ctaHref}
        className="shrink-0 rounded-full bg-black/80 px-4 py-2 text-sm font-black text-white transition hover:bg-black"
      >
        {activeBanner.ctaLabel}
      </Link>
    </section>
  );
}
