import Link from 'next/link';
import { Layers3 } from 'lucide-react';

type HeatmapCell = { chain: string; category: string; score: number };

const heatmapRows: HeatmapCell[] = [];

export default function HeatmapPage() {
  if (heatmapRows.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <Layers3 className="h-12 w-12 text-zinc-400" aria-hidden="true" />
        <h1 className="text-3xl font-semibold text-zinc-900">No heatmap data available</h1>
        <p className="max-w-2xl text-sm text-zinc-600">We do not yet have verified index rows to render a heatmap.</p>
        <Link href="/market" className="text-sm font-semibold text-emerald-700 underline">
          Browse the market explorer
        </Link>
      </main>
    );
  }

  const rowsByCategory = heatmapRows.reduce<Record<string, HeatmapCell[]>>((memo, cell) => {
    memo[cell.category] = [...(memo[cell.category] ?? []), cell];
    return memo;
  }, {});

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8">
      <h1 className="text-4xl font-semibold text-zinc-900">Heatmap</h1>
      <p className="mt-2 text-sm text-zinc-600">Verified chain index and category pairings are available.</p>
      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
        {Object.entries(rowsByCategory).map(([category, cells]) => (
          <div key={category} className="mb-4">
            <h2 className="font-semibold text-zinc-900">{category}</h2>
            <p>{cells.length} cells available</p>
          </div>
        ))}
      </div>
    </main>
  );
}
