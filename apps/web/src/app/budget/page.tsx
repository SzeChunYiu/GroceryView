import Link from "next/link";
import { ConfidenceBadge } from "@/components/confidence-badge";

const budgetCards = [
  { label: "Monthly target", value: "4 500 kr", note: "Editable later" },
  { label: "Projected spend", value: "4 230 kr", note: "Based on placeholder basket" },
  { label: "Deal buffer", value: "270 kr", note: "Potential savings" },
];

export default function BudgetPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Link className="text-sm font-semibold text-emerald-600" href="/">← Back to market overview</Link>
        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">Budget Tracker placeholder</p><h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Grocery budget control room</h1><p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">Plan spending, monitor basket drift, and convert price alerts into a weekly savings plan once accounts and alerts are connected.</p></div><ConfidenceBadge level="low" label="planning shell" /></div>
      </section>
      <section className="grid gap-5 md:grid-cols-3">
        {budgetCards.map((card) => (<article className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900" key={card.label}><p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">{card.label}</p><p className="mt-3 text-4xl font-bold">{card.value}</p><p className="mt-3 text-sm text-zinc-500">{card.note}</p></article>))}
      </section>
    </div>
  );
}
