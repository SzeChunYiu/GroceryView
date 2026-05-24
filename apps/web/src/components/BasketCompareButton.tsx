import Link from 'next/link';
import { ArrowRightLeft } from 'lucide-react';

export type BasketCompareItem = {
  name: string;
  quantity: string;
};

export function BasketCompareButton({
  items,
  compact = false,
  label = 'Compare my basket at all stores',
}: {
  items: BasketCompareItem[];
  compact?: boolean;
  label?: string;
}) {
  const payload = encodeURIComponent(JSON.stringify(items));

  return (
    <Link
      href={`/compare?items=${payload}&source=list`}
      className={`inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 ${
        compact ? 'w-full justify-center' : ''
      }`}
    >
      <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
