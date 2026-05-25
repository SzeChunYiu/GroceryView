export type CursorPaginationProps = {
  currentLabel: string;
  nextHref?: string | null;
  previousHref?: string | null;
};

export function CursorPagination({ currentLabel, nextHref, previousHref }: CursorPaginationProps) {
  return (
    <nav aria-label="Cursor pagination" className="flex flex-wrap items-center gap-2">
      {previousHref ? (
        <a className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-900" href={previousHref}>
          Previous
        </a>
      ) : null}
      <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">{currentLabel}</span>
      {nextHref ? (
        <a className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href={nextHref}>
          Next
        </a>
      ) : null}
    </nav>
  );
}
