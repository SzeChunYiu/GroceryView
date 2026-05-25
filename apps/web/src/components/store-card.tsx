import Link from 'next/link';

import { groceryImageBlurDataUrl } from './product-image';

type StoreCardProps = Readonly<{
  href: string;
  imageAlt?: string;
  imageUrl?: string | null;
  name: string;
  subtitle?: string;
}>;

export function StoreCard({ href, imageAlt, imageUrl, name, subtitle }: StoreCardProps) {
  return (
    <Link className="group block rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-700" href={href}>
      {imageUrl ? (
        <img
          alt={imageAlt ?? `${name} store image`}
          className="mb-4 aspect-[16/9] w-full rounded-2xl bg-slate-100 object-cover"
          decoding="async"
          loading="lazy"
          src={imageUrl}
          style={{ backgroundImage: `url(${groceryImageBlurDataUrl})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
        />
      ) : null}
      <h3 className="text-lg font-black text-slate-950 group-hover:text-emerald-800">{name}</h3>
      {subtitle ? <p className="mt-1 text-sm font-semibold text-slate-600">{subtitle}</p> : null}
    </Link>
  );
}
