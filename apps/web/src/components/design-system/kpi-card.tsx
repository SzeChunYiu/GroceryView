import Link from 'next/link';
import type { ReactNode } from 'react';
import { dsCard } from './shared';
import { cn } from '@/lib/utils';

export function KpiCard({
  label,
  value,
  delta,
  meaning,
  href,
  onClick,
  className
}: Readonly<{
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  meaning: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}>) {
  const content = (
    <>
      <p className="text-[length:var(--gv-text-small)] font-semibold text-[color:var(--gv-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-[color:var(--gv-ink)]">{value}</p>
      {delta ? <p className="mt-1 text-sm font-bold text-[color:var(--gv-success)]">{delta}</p> : null}
      <p className="mt-2 text-sm leading-6 text-[color:var(--gv-ink-soft)]">{meaning}</p>
    </>
  );

  const shellClass = cn(dsCard, 'p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--gv-shadow)]', className);

  if (href) {
    return (
      <Link className={cn(shellClass, 'block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gv-primary)]')} href={href}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button className={cn(shellClass, 'w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gv-primary)]')} onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return <article className={shellClass}>{content}</article>;
}
