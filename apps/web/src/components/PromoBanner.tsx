'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export type PromoBanner = {
  id: string;
  heading: string;
  subheading: string;
  copy: string;
  ctaLabel: string;
  ctaHref: string;
  theme: 'emerald' | 'indigo' | 'rose';
};

export const defaultPromoBanners: PromoBanner[] = [
  {
    id: 'weekend-savings',
    heading: 'Save on the biggest weekly buys',
    subheading: 'Updated each quarter',
    copy: 'Open-price and partner-flyer evidence now powers a rotating offer strip for high-impact basket essentials.',
    ctaLabel: 'Browse weekly savings',
    ctaHref: '/catalogue-savings',
    theme: 'emerald'
  },
  {
    id: 'new-locale-copy',
    heading: 'Verified prices in Swedish',
    subheading: 'Source-first everywhere',
    copy: 'New locale-safe copy and product confidence labels make navigation faster, clearer, and safer for every shopper.',
    ctaLabel: 'Open source claims',
    ctaHref: '/data-sources',
    theme: 'indigo'
  },
  {
    id: 'scanner-ready',
    heading: 'Turn receipts into smarter lists',
    subheading: 'Fast launch',
    copy: 'Try the receipt scanner and convert trusted rows to grocery watchlists in under a minute.',
    ctaLabel: 'Try scanner mode',
    ctaHref: '/scanner',
    theme: 'rose'
  }
];

const bannerThemes = {
  emerald: {
    ring: 'ring-emerald-300',
    background: 'from-emerald-950 to-emerald-800',
    button: 'bg-white text-emerald-950',
    eyebrow: 'bg-emerald-100 text-emerald-800'
  },
  indigo: {
    ring: 'ring-indigo-300',
    background: 'from-indigo-950 to-indigo-800',
    button: 'bg-white text-indigo-950',
    eyebrow: 'bg-indigo-100 text-indigo-800'
  },
  rose: {
    ring: 'ring-rose-300',
    background: 'from-rose-950 to-rose-800',
    button: 'bg-white text-rose-950',
    eyebrow: 'bg-rose-100 text-rose-800'
  }
};

export function PromoBanner({ banners = defaultPromoBanners, intervalMs = 7000 }: Readonly<{ banners?: PromoBanner[]; intervalMs?: number }>) {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const intervalId = setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % banners.length);
    }, intervalMs);
    return () => clearInterval(intervalId);
  }, [banners, intervalMs]);

  if (banners.length === 0) {
    return null;
  }

  const normalizedIndex = ((activeBannerIndex % banners.length) + banners.length) % banners.length;
  const banner = banners[normalizedIndex];
  const theme = bannerThemes[banner.theme];

  return (
    <section
      aria-label="Homepage promotional banners"
      className={`rounded-[1.5rem] border border-white/20 bg-gradient-to-r ${theme.background} p-5 text-white shadow-xl ring-1 ${theme.ring}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={`inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${theme.eyebrow}`}>{banner.subheading}</p>
          <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight lg:text-4xl">{banner.heading}</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/90 lg:text-base">{banner.copy}</p>
        </div>
        <Link className={`inline-flex shrink-0 rounded-full px-5 py-3 text-sm font-black ${theme.button}`} href={banner.ctaHref}>
          {banner.ctaLabel}
        </Link>
      </div>
      <div className="mt-4 flex items-center gap-2" role="presentation">
        {banners.map((item, index) => (
          <button
            className={`h-2 w-8 rounded-full transition-all ${index === normalizedIndex ? 'bg-white' : 'bg-white/40'}`}
            key={item.id}
            onClick={() => setActiveBannerIndex(index)}
            type="button"
            aria-label={`Go to banner ${index + 1}: ${item.heading}`}
          />
        ))}
      </div>
    </section>
  );
}
