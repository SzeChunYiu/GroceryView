import type { ReactNode } from 'react';

export function MvpPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  evidence
}: Readonly<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  evidence?: ReactNode;
}>) {
  return (
    <section className="rounded-[2rem] border border-emerald-200 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">{eyebrow}</p> : null}
          <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{title}</h1>
          {subtitle ? <p className="mt-3 text-lg leading-8 text-slate-700">{subtitle}</p> : null}
          {evidence ? <div className="mt-3">{evidence}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
