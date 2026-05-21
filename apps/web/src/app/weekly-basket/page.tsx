import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, ListChecks, PiggyBank, ShoppingBasket } from "lucide-react";
import { householdSavings, products, savingsPlaybook, weeklyBasket } from "@/lib/demo-data";

const productBySlug = new Map(products.map((product) => [product.slug, product]));

function parseSek(total: string) {
  return Number(total.replace(" SEK", ""));
}

function movementTone(value: string) {
  if (value.startsWith("-")) return "text-emerald-700";
  if (value.startsWith("+")) return "text-rose-700";
  return "text-zinc-600";
}

export default function WeeklyBasketPage() {
  const lineCount = weeklyBasket.length;
  const basketTotal = weeklyBasket.reduce((sum, item) => sum + parseSek(item.total), 0);
  const fallingLines = weeklyBasket.filter((item) => item.vsLastWeek.startsWith("-")).length;
  const risingLines = weeklyBasket.filter((item) => item.vsLastWeek.startsWith("+")).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Weekly basket</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Household staples with live savings signals</h1>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
            The basket combines observed Stockholm shelf rows, weekly movement, and action cards so shoppers can see what to buy, hold, or split across stores.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric icon={ShoppingBasket} label="Basket total" value={`${basketTotal.toFixed(2)} SEK`} detail={`${lineCount} tracked lines`} />
          <Metric icon={PiggyBank} label="Weekly saving" value={householdSavings.vsLastWeek} detail={`Current total ${householdSavings.weeklyTotal}`} />
          <Metric icon={ListChecks} label="Local offers" value="Ranked" detail="API basket coverage" />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <SignalCard icon={ArrowDownRight} label="Falling lines" value={String(fallingLines)} detail="Products priced below last week" tone="text-emerald-700" />
        <SignalCard icon={ArrowUpRight} label="Rising lines" value={String(risingLines)} detail="Products to delay or verify" tone="text-rose-700" />
        <SignalCard icon={CheckCircle2} label="Top saving" value={householdSavings.topSaving.amount} detail={householdSavings.topSaving.product} tone="text-zinc-950" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 md:grid-cols-[1fr_0.35fr_0.5fr_0.45fr_0.8fr]">
            <span>Product</span>
            <span>Qty</span>
            <span>Total</span>
            <span>Week</span>
            <span>Store</span>
          </div>
          {weeklyBasket.map((item) => {
            const product = productBySlug.get(item.slug);

            return (
              <article className="grid gap-3 border-b border-zinc-200 px-5 py-4 last:border-b-0 md:grid-cols-[1fr_0.35fr_0.5fr_0.45fr_0.8fr]" key={item.slug}>
                <div>
                  <Link className="font-semibold text-zinc-950 transition hover:text-emerald-700" href={`/products/${item.slug}`}>
                    {product?.name ?? item.slug}
                  </Link>
                  <p className="mt-1 text-sm text-zinc-500">{product?.source ?? "observed basket row"}</p>
                </div>
                <p className="font-semibold tabular-nums text-zinc-950">{item.qty}</p>
                <p className="font-semibold tabular-nums text-zinc-950">{item.total}</p>
                <p className={`font-semibold tabular-nums ${movementTone(item.vsLastWeek)}`}>{item.vsLastWeek}</p>
                <p className="text-zinc-600">{product?.store ?? "Stockholm basket"}</p>
              </article>
            );
          })}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-5 text-white shadow-sm">
            <ListChecks className="h-6 w-6 text-emerald-300" aria-hidden="true" />
            <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-zinc-400">Savings playbook</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Next best basket moves</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Prioritized from the same observed product rows that power the weekly basket.
            </p>
          </div>
          {savingsPlaybook.map((play) => (
            <Link className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/40" href={play.href} key={play.title}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-zinc-950">{play.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{play.action}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-sm font-semibold text-emerald-800">{play.impact}</span>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">{play.trigger}</p>
            </Link>
          ))}
        </aside>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof ShoppingBasket; label: string; value: string; detail: string }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
      <p className="mt-3 text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
    </article>
  );
}

function SignalCard({ icon: Icon, label, value, detail, tone }: { icon: typeof ArrowDownRight; label: string; value: string; detail: string; tone: string }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
        <p className={`text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
      </div>
      <p className="mt-3 text-sm font-semibold text-zinc-950">{label}</p>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
    </article>
  );
}
