import type { ReactNode } from 'react';
import { dsCard, dsPrimaryButton, dsSecondaryButton } from './shared';
import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  reason,
  nextSteps,
  action,
  secondaryAction,
  className
}: Readonly<{
  title: string;
  reason: string;
  nextSteps: ReactNode;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  className?: string;
}>) {
  return (
    <section className={cn(dsCard, 'p-6 text-center', className)} aria-label={title}>
      <h2 className="text-2xl font-extrabold tracking-tight text-[color:var(--gv-ink)]">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-[length:var(--gv-text-small)] leading-7 text-[color:var(--gv-ink-soft)]">{reason}</p>
      <div className="mx-auto mt-4 max-w-2xl text-[length:var(--gv-text-small)] leading-7 text-[color:var(--gv-muted)]">{nextSteps}</div>
      {action || secondaryAction ? (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {action ? (
            <a className={dsPrimaryButton} href={action.href}>
              {action.label}
            </a>
          ) : null}
          {secondaryAction ? (
            <a className={dsSecondaryButton} href={secondaryAction.href}>
              {secondaryAction.label}
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
