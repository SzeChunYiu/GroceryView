import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { studentBasicsBoard } from '@/lib/demo-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/student-staples');
}

const weeklyBudgetSek = 650;

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

export default function StudentStaplesPage() {
  const { comparison, coverage } = studentBasicsBoard;
  const budgetShare = Math.round((comparison.cheapestByProduct.total / weeklyBudgetSek) * 1000) / 10;

  return (
    <PageShell>
      <Eyebrow>Students / young singles</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Cheapest basics staples board</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        A weekly board for milk, pasta, rice, eggs, coffee, oats, and produce. Rows are ranked by currently visible unit prices across selected chains and Stockholm districts; missing store rows lower confidence instead of being estimated.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card><p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Cheapest basics total</p><p className="mt-2 text-5xl font-black text-emerald-800">{formatSek(comparison.cheapestByProduct.total)}</p><p className="mt-3 font-semibold text-slate-700">{comparison.cheapestByProduct.assignments.length} staple rows in the split-shop plan.</p></Card>
        <Card><p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Weekly budget impact</p><p className="mt-2 text-5xl font-black text-slate-950">{budgetShare}%</p><p className="mt-3 font-semibold text-slate-700">of a {formatSek(weeklyBudgetSek)} student grocery budget before non-staples.</p></Card>
        <Card><p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Freshness / confidence</p><p className="mt-2 text-5xl font-black capitalize text-slate-950">{studentBasicsBoard.confidence.level}</p><p className="mt-3 font-semibold text-slate-700">{studentBasicsBoard.confidence.caveat}</p></Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black text-slate-950">Ranked cheapest staples this week</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {studentBasicsBoard.items.map((item) => (
            <Link className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/products/${item.productId}`} key={item.productId}>
              <div className="flex items-start justify-between gap-4"><div><p className="font-black text-slate-950">{item.name}</p><p className="mt-1 text-sm font-semibold text-slate-600">{item.storeName} · {formatSek(item.unitPrice)} unit price</p></div><p className="text-xl font-black text-emerald-800">{formatSek(item.lineTotal)}</p></div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black text-slate-950">Coverage by selected chain and district</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">{coverage.stores.map((store) => (<div className="rounded-2xl bg-white p-4" key={store.storeId}><p className="font-black text-slate-950">{store.storeName}</p><p className="mt-2 text-sm font-semibold text-slate-700">{store.availableProductIds.length}/{store.availableProductIds.length + store.missingProductIds.length} basics priced · known total {formatSek(store.knownTotal)}</p></div>))}</div>
      </Card>
    </PageShell>
  );
}
