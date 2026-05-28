import type { ReactNode } from 'react';

type ActionLink = {
  href: string;
  label: string;
  detail?: string;
};

export function PageQuestionHeader({
  eyebrow,
  question,
  title,
  subtitle,
  actions,
  evidence
}: Readonly<{
  eyebrow: string;
  question: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  evidence?: ReactNode;
}>) {
  return (
    <section className="rounded-[2rem] border border-emerald-200 bg-white/92 p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">{eyebrow}</p>
      <p className="mt-3 text-sm font-black text-emerald-950">{question}</p>
      <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{title}</h1>
          <p className="mt-3 text-lg leading-8 text-slate-700">{subtitle}</p>
          {evidence ? <div className="mt-3">{evidence}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

export function PanelPurpose({
  title,
  question,
  description,
  children
}: Readonly<{
  title: string;
  question: string;
  description: string;
  children?: ReactNode;
}>) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white/88 p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">{question}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

export function ConnectedActionRow({ actions }: Readonly<{ actions: ActionLink[] }>) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <a className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-950 hover:bg-white" href={action.href} key={action.href}>
          {action.label}
          {action.detail ? <span className="ml-2 font-semibold text-emerald-700">{action.detail}</span> : null}
        </a>
      ))}
    </div>
  );
}

export function GuidedEmptyState({
  title,
  body,
  actions = []
}: Readonly<{
  title: string;
  body: string;
  actions?: ActionLink[];
}>) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Plain-language meaning first</p>
      <h3 className="mt-2 text-lg font-black text-amber-950">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-amber-900">{body}</p>
      {actions.length > 0 ? <div className="mt-3"><ConnectedActionRow actions={actions} /></div> : null}
    </div>
  );
}
