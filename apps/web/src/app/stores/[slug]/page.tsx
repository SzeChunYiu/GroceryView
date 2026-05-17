import Link from "next/link";
import { ConfidenceBadge } from "@/components/confidence-badge";

const departments = ["Dairy", "Produce", "Pantry", "Frozen", "Household"];
type StorePageProps = { params: Promise<{ slug: string }> };

function titleFromSlug(slug: string) {
  return slug.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  const storeName = titleFromSlug(slug) || "Store";

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10">
      <section className="rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Link className="text-sm font-semibold text-emerald-600" href="/">← Back to market overview</Link>
        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500">Store page placeholder</p><h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">{storeName}</h1><p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">Chain and location intelligence will summarize price competitiveness, category strengths, and local deal density for this store route.</p></div>
          <ConfidenceBadge level="low" label="awaiting store feed" />
        </div>
      </section>
      <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((department, index) => (
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900" key={department}>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Department</p><h2 className="mt-2 text-2xl font-semibold">{department}</h2><p className="mt-4 text-sm text-zinc-500">Placeholder rank #{index + 1} for store-level category pricing and promotion density.</p>
          </article>
        ))}
      </section>
    </div>
  );
}
