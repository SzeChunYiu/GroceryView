import Image from 'next/image';

/**
 * Renders a grocery deal summary card with the offer's title, store, pricing,
 * savings, and destination link so deal-focused views can present consistent
 * offer evidence without duplicating card markup.
 */
export interface Props {
  title: string;
  storeName: string;
  priceText: string;
  savingsText?: string;
  href: string;
  imageUrl?: string;
  imageAlt?: string;
}

export function DealCard({ title, storeName, priceText, savingsText, href, imageUrl, imageAlt }: Props) {
  return (
    <a
      className="block rounded-2xl border border-slate-200 p-4 hover:border-emerald-700"
      href={href}
      data-testid="deal-card-link"
    >
      {imageUrl ? (
        <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <p className="text-sm font-semibold text-slate-600">{storeName}</p>
      <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
      <p className="mt-3 text-2xl font-black text-emerald-800">{priceText}</p>
      {savingsText ? <p className="mt-1 text-sm font-semibold text-slate-600">{savingsText}</p> : null}
    </a>
  );
}
