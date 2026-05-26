'use client';

import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { productImageCdnUrl } from '@/lib/imageCdn';
import { cn } from '@/lib/utils';

export type FlyerSectionPromo = {
  id?: string;
  slug?: string;
  rank?: number;
  rankLabel?: string;
  name?: string;
  productName?: string;
  title?: string;
  description?: string;
  storeName?: string;
  store?: string;
  chain?: string;
  category?: string;
  priceText?: string;
  currentPrice?: string;
  regularPriceText?: string;
  unitPriceText?: string;
  savingsText?: string;
  discountText?: string;
  distanceLabel?: string;
  validUntilLabel?: string;
  validTo?: string;
  endsAt?: string;
  startsAt?: string;
  badge?: string;
  loyaltyOnly?: boolean;
  reason?: string;
  confidenceLabel?: string;
  sourceLabel?: string;
  href?: string;
  imageUrl?: string;
  imageAlt?: string;
};

export type FlyerSectionProps = {
  heading?: string;
  title?: string;
  eyebrow?: string;
  description?: string;
  promos?: FlyerSectionPromo[];
  offers?: FlyerSectionPromo[];
  items?: FlyerSectionPromo[];
  ctaLabel?: string;
  ctaHref?: string;
  emptyState?: string;
  className?: string;
};

function formatDateLabel(value?: string) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return value;
}

function promoKey(promo: FlyerSectionPromo, index: number) {
  return promo.id ?? promo.slug ?? `${promo.name ?? promo.productName ?? promo.title ?? 'promo'}-${index}`;
}

function promoName(promo: FlyerSectionPromo) {
  return promo.name ?? promo.productName ?? promo.title ?? 'Unnamed promo';
}

function promoStore(promo: FlyerSectionPromo) {
  return promo.storeName ?? promo.store ?? promo.chain ?? 'Store not selected';
}

function promoPrice(promo: FlyerSectionPromo) {
  return promo.priceText ?? promo.currentPrice ?? 'Price pending';
}

function promoSavings(promo: FlyerSectionPromo) {
  return promo.savingsText ?? promo.discountText ?? null;
}

function LazyPromoImage({
  alt,
  priority,
  src
}: Readonly<{
  alt: string;
  priority: boolean;
  src: string;
}>) {
  const { isIntersecting, ref } = useIntersectionObserver<HTMLDivElement>({
    freezeOnceVisible: true,
    rootMargin: '200px'
  });
  const shouldLoad = priority || isIntersecting;

  return (
    <div className="h-full w-full bg-gradient-to-br from-emerald-50 to-white" ref={ref}>
      {shouldLoad ? (
        <img
          alt={alt}
          className="h-full w-full object-cover"
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          loading={priority ? 'eager' : 'lazy'}
          src={productImageCdnUrl(src, { width: 96 })}
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-gradient-to-r from-emerald-50 via-white to-emerald-100" aria-hidden="true" />
      )}
    </div>
  );
}

export function FlyerSection({
  heading,
  title,
  eyebrow = 'Personal flyer picks',
  description,
  promos,
  offers,
  items,
  ctaLabel,
  ctaHref,
  emptyState = 'No ranked promos in this group yet. Check back when fresh flyer evidence lands.',
  className
}: Readonly<FlyerSectionProps>) {
  const resolvedHeading = heading ?? title ?? 'Ranked promo group';
  const rankedPromos = promos ?? offers ?? items ?? [];

  return (
    <section className={cn('overflow-hidden rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-white via-emerald-50/70 to-amber-50 p-5 shadow-sm', className)}>
      <div className="flex flex-col gap-4 border-b border-emerald-100 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{resolvedHeading}</h2>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">{description}</p> : null}
        </div>
        <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm font-black text-emerald-950 shadow-sm">
          {rankedPromos.length} ranked {rankedPromos.length === 1 ? 'promo' : 'promos'}
        </div>
      </div>

      {rankedPromos.length > 0 ? (
        <ol className="mt-5 grid gap-3" aria-label={resolvedHeading}>
          {rankedPromos.map((promo, index) => {
            const name = promoName(promo);
            const store = promoStore(promo);
            const savings = promoSavings(promo);
            const endingLabel = promo.validUntilLabel ?? formatDateLabel(promo.validTo ?? promo.endsAt);
            const rank = promo.rank ?? index + 1;
            const cardContent = (
              <>
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-white text-sm font-black text-emerald-900 shadow-sm">
                    {promo.imageUrl ? (
                      <LazyPromoImage alt={promo.imageAlt ?? ''} priority={index < 2} src={promo.imageUrl} />
                    ) : (
                      <span aria-hidden="true">#{rank}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-950 px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] text-white">
                        {promo.rankLabel ?? `Rank ${rank}`}
                      </span>
                      {promo.badge ? <span className="rounded-full bg-amber-200 px-2.5 py-1 text-[0.68rem] font-black text-amber-950">{promo.badge}</span> : null}
                      {promo.loyaltyOnly ? <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[0.68rem] font-black text-sky-950">Member price</span> : null}
                    </div>
                    <h3 className="mt-2 truncate text-lg font-black text-slate-950">{name}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{store}{promo.category ? ` · ${promo.category}` : ''}</p>
                    {promo.description ? <p className="mt-2 text-sm leading-6 text-slate-700">{promo.description}</p> : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2 text-left sm:items-end sm:text-right">
                  <p className="text-2xl font-black text-emerald-900">{promoPrice(promo)}</p>
                  {promo.regularPriceText || promo.unitPriceText ? (
                    <p className="text-xs font-bold text-slate-500">{[promo.regularPriceText, promo.unitPriceText].filter(Boolean).join(' · ')}</p>
                  ) : null}
                  {savings ? <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-950">{savings}</p> : null}
                </div>
              </>
            );

            return (
              <li className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-sm motion-safe:transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md" key={promoKey(promo, index)}>
                {promo.href ? (
                  <a className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" href={promo.href}>
                    {cardContent}
                  </a>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {cardContent}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                  {endingLabel ? <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-900">Ends {endingLabel}</span> : null}
                  {promo.startsAt ? <span className="rounded-full bg-slate-100 px-3 py-1">Starts {formatDateLabel(promo.startsAt)}</span> : null}
                  {promo.distanceLabel ? <span className="rounded-full bg-slate-100 px-3 py-1">{promo.distanceLabel}</span> : null}
                  {promo.reason ? <span className="rounded-full bg-slate-100 px-3 py-1">{promo.reason}</span> : null}
                  {promo.confidenceLabel ? <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-950">{promo.confidenceLabel}</span> : null}
                  {promo.sourceLabel ? <span className="rounded-full bg-slate-100 px-3 py-1">{promo.sourceLabel}</span> : null}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-5 rounded-3xl border border-dashed border-emerald-200 bg-white/70 p-5 text-sm font-bold text-slate-600">{emptyState}</p>
      )}

      {ctaHref && ctaLabel ? (
        <a className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-950" href={ctaHref}>
          {ctaLabel}
        </a>
      ) : null}
    </section>
  );
}
