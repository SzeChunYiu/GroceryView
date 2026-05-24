'use client';

import Link from 'next/link';
import locale from '@/locales/sv.json';

type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type EmptyStateProps = Readonly<{
  title?: string;
  message?: string;
  action?: EmptyStateAction;
  className?: string;
}>;

const translations = locale.emptyState;

export function EmptyState({ title, message, action, className }: EmptyStateProps) {
  const titleText = title ?? translations.title;
  const messageText = message ?? translations.message;
  const actionLabel = action?.label ?? translations.actionLabel;

  return (
    <section className={className ?? 'mx-auto flex w-full max-w-3xl flex-col items-center gap-4 rounded-xl border border-zinc-200 bg-white p-8 text-center'}>
      <h2 className="text-xl font-semibold text-zinc-900">{titleText}</h2>
      <p className="max-w-md text-zinc-600">{messageText}</p>
      {action ? (
        action.href ? (
          <Link
            className="inline-flex rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-900"
            href={action.href}
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            className="inline-flex rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-900"
            onClick={action.onClick}
            type="button"
          >
            {actionLabel}
          </button>
        )
      ) : null}
    </section>
  );
}
