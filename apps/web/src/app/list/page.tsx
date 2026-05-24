import { ArrowDownRight, ArrowUpRight, ShoppingBasket } from "lucide-react";
import { BasketCompareButton } from "@/components/BasketCompareButton";
import { basketItems, formatSek } from "@/components/sample-data";

export default function ListPage() {
  const currentTotal = basketItems.reduce((sum, item) => sum + item.currentPrice, 0);
  const usualTotal = basketItems.reduce((sum, item) => sum + item.usualPrice, 0);

  const itemsForCompare = basketItems.map((item) => ({
    name: item.name,
    quantity: item.quantity
  }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Shopping list</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Plan this week&apos;s basket</h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-600">
            Compare every listed item across all stores to find your best mix and decide which stores and routes to hit.
          </p>
        </div>
        <div className="flex w-full items-center justify-end sm:w-auto">
          <BasketCompareButton items={itemsForCompare} />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid-cols-[1.2fr_0.8fr_1fr_1fr_0.9fr]">
          <span>Product</span>
          <span>Qty</span>
          <span>Store</span>
          <span>Current price</span>
          <span>Signal</span>
        </div>
        {basketItems.map((item) => {
          const saving = item.currentPrice - item.usualPrice;
          const SavingIcon = saving <= 0 ? ArrowDownRight : ArrowUpRight;

          return (
            <article
              className="grid gap-3 border-b border-zinc-200 px-5 py-4 last:border-b-0 md:grid-cols-[1.2fr_0.8fr_1fr_1fr_0.9fr]"
              key={item.name}
            >
              <p className="font-semibold text-zinc-950">{item.name}</p>
              <p className="text-zinc-600">{item.quantity}</p>
              <p className="text-zinc-600">{item.store}</p>
              <p className="font-semibold tabular-nums text-zinc-950">{formatSek(item.currentPrice)}</p>
              <span className={`inline-flex w-fit items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold ${saving <= 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
                <SavingIcon className="h-4 w-4" aria-hidden="true" />
                {formatSek(Math.abs(saving))}
              </span>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Current total" value={formatSek(currentTotal)} />
        <Metric label="Usual total" value={formatSek(usualTotal)} />
        <Metric label="Items" value={String(basketItems.length)} />
        <Metric label="Compare status" value="Ready" />
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Compare this list</p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-950">Ready all items pre-filled at /compare</h2>
            <p className="mt-1 text-sm text-zinc-600">Route uses all rows from this list to estimate your best all-store split.</p>
          </div>
          <ShoppingBasket className="h-5 w-5 text-emerald-700" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-zinc-950">{value}</p>
    </article>
  );
}
