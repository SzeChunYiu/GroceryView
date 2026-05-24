'use client';

import Link from 'next/link';
import { useRef } from 'react';
import type { KeyboardEvent } from 'react';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  ariaLabel?: string;
  className?: string;
};

function focusBreadcrumbItem(container: HTMLElement | null, index: number) {
  const targets = Array.from(container?.querySelectorAll<HTMLElement>('[data-breadcrumb-focusable="true"]') ?? []);
  const target = targets[index];
  if (target) target.focus();
}

export function Breadcrumbs({ items, ariaLabel = 'Breadcrumb', className = '' }: Readonly<BreadcrumbsProps>) {
  const navRef = useRef<HTMLElement>(null);
  const normalizedItems = items.filter((item) => item.label.trim().length > 0);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    const targets = Array.from(navRef.current?.querySelectorAll<HTMLElement>('[data-breadcrumb-focusable="true"]') ?? []);
    const currentIndex = targets.findIndex((target) => target === event.target);
    if (currentIndex === -1) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusBreadcrumbItem(navRef.current, Math.min(currentIndex + 1, targets.length - 1));
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusBreadcrumbItem(navRef.current, Math.max(currentIndex - 1, 0));
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusBreadcrumbItem(navRef.current, 0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusBreadcrumbItem(navRef.current, targets.length - 1);
    }
  }

  if (normalizedItems.length === 0) return null;

  return (
    <nav aria-label={ariaLabel} className={className} onKeyDown={handleKeyDown} ref={navRef}>
      <ol className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-600">
        {normalizedItems.map((item, index) => {
          const isCurrent = index === normalizedItems.length - 1;
          return (
            <li className="flex items-center gap-2" key={`${item.href ?? 'current'}-${item.label}`}>
              {index > 0 ? <span aria-hidden="true" className="text-slate-400">/</span> : null}
              {item.href && !isCurrent ? (
                <Link
                  className="rounded-md underline decoration-slate-300 underline-offset-4 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  data-breadcrumb-focusable="true"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? 'page' : undefined}
                  className="rounded-md text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  data-breadcrumb-focusable="true"
                  tabIndex={0}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
