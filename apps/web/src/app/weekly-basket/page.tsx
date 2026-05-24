import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ShoppingBasket } from "lucide-react";
import { basketItems, formatSek } from "@/components/sample-data";
import { itemDetailHref } from "@/lib/item-route";
import { products } from "@/lib/demo-data";

const productByName = new Map(products.map((product) => [product.name, product]));

export default function WeeklyBasketPage() {
  const currentTotal = basketItems.reduce((sum, item) => sum + item.currentPrice, 0);
  const usualTotal = basketItems.reduce((sum, item) => sum + item.usualPrice, 0);
  const delta = currentTotal - usualTotal;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Weekly basket</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Household spend board</h1>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Current" value={formatSek(currentTotal)} />
          <Metric label="Usual" value={formatSek(usualTotal)} />
          <Metric label="Delta" value={formatSek(delta)} tone={delta <= 0 ? "good" : "bad"} />
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="grid grid-cols-2 gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr_0.9fr]">
          <span>Product</span>
          <span>Qty</span>
          <span>Store</span>
          <span>Price</span>
          <span>Signal</span>
        </div>
        {basketItems.map((item) => {
          const saving = item.currentPrice - item.usualPrice;
          const SavingIcon = saving <= 0 ? ArrowDownRight : ArrowUpRight;

          return (
            <article className="grid gap-3 border-b border-zinc-200 px-5 py-4 last:border-b-0 md:grid-cols-[1.2fr_0.6fr_0.8fr_0.8fr_0.9fr]" key={item.name}>
              <Link
                className="font-semibold text-zinc-950 hover:text-emerald-700"
                href={itemDetailHref(productByName.get(item.name) ? { slug: productByName.get(item.name)!.slug } : { name: item.name })}
              >
                {item.name}
              </Link>
              <span className="text-zinc-600">{item.quantity}</span>
              <span className="text-zinc-600">{item.store}</span>
              <span className="font-semibold tabular-nums text-zinc-950">{formatSek(item.currentPrice)}</span>
              <span className={`inline-flex w-fit items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold ${saving <= 0 ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
                <SavingIcon className="h-4 w-4" aria-hidden="true" />
                {formatSek(Math.abs(saving))}
              </span>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Panel icon={ShoppingBasket} label="Best verified route" value="Willys + ICA" detail="2 store stops" />
        <Panel icon={ArrowDownRight} label="Promo savings" value={formatSek(14.6)} detail="Coffee and oats" />
        <Panel icon={ArrowUpRight} label="Watch item" value="Butter" detail="Above usual price" />
      </section>
    </main>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "bad" }) {
  const toneClass = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-amber-700" : "text-zinc-950";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

function Panel({ icon: Icon, label, value, detail }: { icon: typeof ShoppingBasket; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
      <p className="mt-4 text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-950">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
    </div>
  );
}
