import type { ReactNode } from 'react';

export function MvpSectionCard({
  title,
  children,
  className = ''
}: Readonly<{ title?: string; children: ReactNode; className?: string }>) {
  return (
    <section className={`rounded-[1.75rem] border border-slate-200 bg-white/88 p-5 shadow-sm ${className}`}>
      {title ? <h2 className="text-2xl font-black tracking-tight text-slate-950">{title}</h2> : null}
      <div className={title ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}
