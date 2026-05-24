import Link from 'next/link';
import { defaultLocale, groceryTranslator, type SupportedLocale } from '@/lib/i18n';

export type EmptyStateAction = Readonly<{
  href: string;
  label?: string;
}>;

export type EmptyStateProps = Readonly<{
  locale?: SupportedLocale;
  eyebrow?: string;
  title?: string;
  body?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
}>;

export function EmptyState({
  locale = defaultLocale,
  eyebrow,
  title,
  body,
  primaryAction,
  secondaryAction,
  className = ''
}: EmptyStateProps) {
  const t = groceryTranslator(locale);
  const resolvedEyebrow = eyebrow ?? t('empty-state.eyebrow');
  const resolvedTitle = title ?? t('empty-state.title');
  const resolvedBody = body ?? t('empty-state.body');
  const primaryLabel = primaryAction?.label ?? t('empty-state.primaryAction');
  const secondaryLabel = secondaryAction?.label ?? t('empty-state.secondaryAction');

  return (
    <section
      aria-label={resolvedTitle}
      className={[
        'rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-sm',
        className
      ].filter(Boolean).join(' ')}
    >
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{resolvedEyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{resolvedTitle}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">{resolvedBody}</p>

      {primaryAction || secondaryAction ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {primaryAction ? (
            <Link className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-800" href={primaryAction.href}>
              {primaryLabel}
            </Link>
          ) : null}
          {secondaryAction ? (
            <Link className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm hover:border-emerald-700" href={secondaryAction.href}>
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
