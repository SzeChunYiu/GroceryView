import Link from 'next/link';

export type RelatedLink = {
  label: string;
  href: string;
  detail?: string;
};

export function RelatedLinksPanel({ title = 'Related next steps', links }: Readonly<{ title?: string; links: RelatedLink[] }>) {
  if (links.length === 0) return null;
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link className="font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={link.href}>
              {link.label}
            </Link>
            {link.detail ? <p className="mt-1 text-sm font-semibold text-slate-600">{link.detail}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
