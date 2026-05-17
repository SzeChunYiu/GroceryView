import Link from "next/link";
import { ConfidenceBadge } from "@/components/confidence-badge";

const basketRows = [
  { item: "Dairy basics", current: "128,40 kr", change: "-2.1%" },
  { item: "Produce", current: "164,90 kr", change: "+1.4%" },
  { item: "Pantry staples", current: "246,20 kr", change: "-5.7%" },
  { item: "Household", current: "89,00 kr", change: "0.0%" },
];

export default function WeeklyBasketPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Link className="text-sm font-semibold text-emerald-600" href="/">← Back to market overview</Link>
        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">Weekly Basket placeholder</p><h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Stockholm weekly basket</h1><p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">Compare a repeatable household basket across chains and spot when it is worth switching stores this week.</p></div><ConfidenceBadge level="medium" label="basket mockup" /></div>
      </section>
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-2xl font-semibold">Basket segments</h2>
        <div className="mt-5 divide-y divide-zinc-100 dark:divide-zinc-800">
          {basketRows.map((row) => (<div className="grid grid-cols-3 items-center gap-4 py-4" key={row.item}><span className="font-semibold">{row.item}</span><span className="font-mono text-sm">{row.current}</span><span className="justify-self-end rounded-full bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">{row.change}</span></div>))}
        </div>
      </section>
    </div>
  );
}
