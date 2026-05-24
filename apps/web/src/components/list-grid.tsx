type ListGridItem = {
  aisleConfidenceLabel: string;
  aisleConfidenceReason: string;
  detail: string;
  id: string;
  matchedProductSlug?: string;
  name: string;
};

type ListGridProps = {
  items: ListGridItem[];
};

export function ListGrid({ items }: Readonly<ListGridProps>) {
  if (items.length === 0) return null;

  return (
    <div className="mt-4 grid gap-2 md:grid-cols-2">
      {items.map((item) => (
        <div className="rounded-2xl border border-sky-100 bg-white p-3 text-sm font-semibold text-slate-700" key={item.id}>
          <p className="font-black text-slate-950">{item.name}</p>
          <p className="mt-1">{item.detail}</p>
          <p
            aria-label={`Aisle: ${item.aisleConfidenceLabel}`}
            className="mt-2 inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-900"
          >
            {item.aisleConfidenceLabel}
          </p>
          <p className="mt-2 text-xs font-bold text-slate-600">{item.aisleConfidenceReason}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">matchedProductSlug: {item.matchedProductSlug ?? 'none'}</p>
        </div>
      ))}
    </div>
  );
}
