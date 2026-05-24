import Link from "next/link";
import { ArrowLeft, ArrowRightLeft } from "lucide-react";
import { BasketCompareItem } from "@/components/BasketCompareButton";

function parseBasketPayload(raw?: string): BasketCompareItem[] {
  if (!raw) return [];

  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;

        const name = typeof (entry as { name?: unknown }).name === "string"
          ? String((entry as { name?: string }).name).trim()
          : "";
        const quantity = typeof (entry as { quantity?: unknown }).quantity === "string"
          ? String((entry as { quantity?: string }).quantity).trim()
          : "";

        if (!name || !quantity) return null;

        return { name, quantity };
      })
      .filter((entry): entry is BasketCompareItem => Boolean(entry));
  } catch {
    return [];
  }
}

export default async function ComparePage({
  searchParams
}: Readonly<{
  searchParams: Promise<{ items?: string } | undefined>;
}>) {
  const parsedParams = await searchParams;
  const items = parseBasketPayload(parsedParams?.items);

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-8">
        <header className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Basket compare</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">No basket items loaded</h1>
          <p className="text-sm text-zinc-600">
            Open your shopping list and tap <span className="font-semibold">Compare my basket at all stores</span> to pre-fill this view.
          </p>
          <Link className="inline-flex w-fit items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" href="/list">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to list
          </Link>
        </header>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-8">
      <header className="grid gap-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Compare route</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">Compare this basket at all stores</h1>
          <Link className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800" href="/list">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Edit list
          </Link>
        </div>
        <p className="max-w-2xl text-sm text-zinc-600">
          The payload below is pre-loaded from your list and can be used for all-store basket optimization.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-950">
          <ArrowRightLeft className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          Incoming list payload ({items.length} items)
        </h2>

        <ul className="mt-5 space-y-3">
          {items.map((item) => (
            <li key={`${item.name}-${item.quantity}`} className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 md:grid-cols-[1fr_auto]">
              <span className="font-semibold text-zinc-950">{item.name}</span>
              <span className="rounded-md bg-white px-3 py-1 text-sm font-medium text-zinc-700">Qty: {item.quantity}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Algorithm note</p>
          <p className="mt-2 text-sm text-emerald-950">
            In this prototype, this view confirms that the list payload is correctly passed through the route.
            Next step is routing the rows to store-level pricing and store comparison optimization.
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Compare status</p>
          <p className="mt-2 text-sm text-zinc-700">{items.length} rows loaded • no estimated pricing applied yet</p>
        </div>
      </section>
    </main>
  );
}
