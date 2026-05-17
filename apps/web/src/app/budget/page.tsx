import Link from "next/link";
import { ConfidenceBadge } from "@/components/confidence-badge";

const budgetRows = [
  ["Weekly target", "800 kr", "Set by household profile"],
  ["Projected spend", "743 kr", "Using placeholder basket"],
  ["Potential savings", "57 kr", "From deal substitutions"],
];

export default function BudgetPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <ConfidenceBadge level="low" label="budget placeholder" sampleSize={3} />
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Budget Tracker</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
          Track grocery spend against household targets and convert detected deals into a practical weekly shopping plan.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {budgetRows.map(([label, value, note]) => (
          <article
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            key={label}
          >
            <p className="text-sm font-medium text-zinc-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{note}</p>
          </article>
        ))}
      </section>

      <Link className="text-sm font-semibold text-emerald-600" href="/weekly-basket">
        Tune weekly basket assumptions →
      </Link>
    </div>
  );
}
