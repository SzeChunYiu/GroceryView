import type { ReactNode } from 'react';
import { dsEyebrow, dsSectionCard } from './shared';
import { cn } from '@/lib/utils';

export function PageQuestionHeader({
  eyebrow,
  question,
  title,
  subtitle,
  actions,
  evidence,
  className
}: Readonly<{
  eyebrow?: string;
  question?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  evidence?: ReactNode;
  className?: string;
}>) {
  return (
    <section className={cn(dsSectionCard, 'p-6', className)}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          {eyebrow ? <p className={dsEyebrow}>{eyebrow}</p> : null}
          {question ? (
            <p className="mt-2 text-[length:var(--gv-text-small)] font-semibold leading-6 text-[color:var(--gv-ink-soft)]">{question}</p>
          ) : null}
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[color:var(--gv-ink)] md:text-5xl">{title}</h1>
          {subtitle ? (
            <p className="mt-3 text-lg leading-8 text-[color:var(--gv-ink-soft)]">{subtitle}</p>
          ) : null}
          {evidence ? <div className="mt-4 flex flex-wrap gap-2">{evidence}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
