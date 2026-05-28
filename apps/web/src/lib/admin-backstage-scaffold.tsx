import type { ReactNode } from 'react';
import Link from 'next/link';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { Card, Eyebrow, StatusBadge } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

export type AdminReportScaffoldLabel = Readonly<{
  mode: 'scaffold' | 'live';
  source: string;
  nextIntegration: string;
}>;

export function AdminReportSourceLabel({ label }: Readonly<{ label: AdminReportScaffoldLabel }>) {
  if (label.mode === 'live') {
    return (
      <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950">
        Live report · Source: {label.source}
      </p>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-black">Backstage scaffold</p>
      <p className="mt-1 font-semibold">Source: {label.source}</p>
      <p className="mt-1 font-semibold">Next integration: {label.nextIntegration}</p>
    </div>
  );
}

type AdminBackstageScaffoldProps = Readonly<{
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  relatedLinks?: Array<{ href: string; label: string }>;
}>;

export function adminBackstageMetadata(path: string, title: string, description: string) {
  return routeMetadata({ path, title: `${title} | GroceryView Admin`, description, noIndex: true });
}

export function AdminBackstageScaffold({
  path,
  eyebrow,
  title,
  description,
  children,
  relatedLinks = []
}: AdminBackstageScaffoldProps) {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-800">{eyebrow}</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-black tracking-tight text-slate-950">{title}</h1>
            <p className="mt-3 text-lg leading-8 text-slate-700">{description}</p>
          </div>
          <StatusBadge tone="warning">Admin only</StatusBadge>
        </div>
        {relatedLinks.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedLinks.map((link) => (
              <Link className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
        <Card className="mt-6">{children}</Card>
      </main>
      <BottomNav />
    </div>
  );
}
