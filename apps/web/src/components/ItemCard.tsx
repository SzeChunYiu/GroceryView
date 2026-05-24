import Link from 'next/link';
import type { ReactNode } from 'react';
import { toImageProxyUrl } from '@/lib/imageCdn';

type ItemCardProps = {
  href: string;
  imageUrl?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  meta?: string;
  children?: ReactNode;
  size?: 'sm' | 'md';
};

export function ItemCard({
  href,
  imageUrl,
  title,
  subtitle,
  actionLabel,
  meta,
  children,
  size = 'md'
}: Readonly<ItemCardProps>) {
  const imageSize = size === 'sm' ? 64 : 96;
  const imageSource = toImageProxyUrl(imageUrl, {
    width: imageSize,
    height: imageSize,
    quality: 80,
    format: 'webp'
  });

  return (
    <Link href={href} className="flex gap-4 rounded-lg border border-market-ink/10 bg-white p-4 transition hover:border-market-mint/70">
      <div className="shrink-0 overflow-hidden rounded-md bg-market-oat/40">
        <img
          alt={title}
          width={imageSize}
          height={imageSize}
          src={imageSource}
          className="h-16 w-16 object-cover sm:h-24 sm:w-24"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 flex-1">
        <span className="font-black uppercase tracking-wide text-market-ink/80 sm:text-lg">{title}</span>
        {subtitle ? <p className="mt-1 truncate text-sm text-market-ink/60">{subtitle}</p> : null}
        {meta ? <p className="mt-1 text-xs font-semibold uppercase text-market-ink/50">{meta}</p> : null}
        {children ? <div className="mt-3 text-sm leading-6 text-market-ink/65">{children}</div> : null}
        {actionLabel ? (
          <span className="mt-3 inline-block text-sm font-semibold text-market-mint">
            {actionLabel}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
