export type PaginationProps = {
  summary: string;
  previousHref?: string | null;
  nextHref?: string | null;
  previousLabel?: string;
  nextLabel?: string;
  ariaLabel?: string;
};

function PaginationLink({ href, label, primary = false }: Readonly<{ href?: string | null; label: string; primary?: boolean }>) {
  const enabledClass = primary
    ? 'bg-indigo-700 text-white shadow-sm'
    : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200';
  const className = `rounded-full px-4 py-2 font-black ${href ? enabledClass : 'bg-slate-100 text-slate-400'}`;

  return href ? <a className={className} href={href}>{label}</a> : <span aria-disabled="true" className={className}>{label}</span>;
}

export function Pagination({
  summary,
  previousHref = null,
  nextHref = null,
  previousLabel = 'Previous',
  nextLabel = 'Next',
  ariaLabel = 'Pagination'
}: Readonly<PaginationProps>) {
  return (
    <nav aria-label={ariaLabel} className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="font-black text-slate-700">{summary}</p>
      <div className="flex gap-3">
        <PaginationLink href={previousHref} label={previousLabel} />
        <PaginationLink href={nextHref} label={nextLabel} primary />
      </div>
    </nav>
  );
}
