<<<<<<< HEAD
import { MarketShell } from '@/components/market-shell';

export default function HomePage() {
  return <MarketShell />;
=======
import Link from "next/link";
import { ScanLine, ShieldCheck, ShoppingBasket, Users } from "lucide-react";
import { basketItems, formatSek } from "@/components/sample-data";

const featuredProducts = [
  { slug: "zoegas-coffee-450g", name: "Zoegas Coffee 450g", price: "49.90 SEK", signal: "12% below 30D median" },
  { slug: "arla-milk-1l", name: "Arla Milk 1L", price: "14.90 SEK", signal: "verified shelf price" },
  { slug: "butter-600g", name: "Butter 600g", price: "54.90 SEK", signal: "normal price" },
];

const workflowLinks = [
  { href: "/weekly-basket", label: "Weekly basket", metric: "-13%", icon: ShoppingBasket },
  { href: "/scanner", label: "Receipt review", metric: "3 queued", icon: ScanLine },
  { href: "/household", label: "Household", metric: "3 members", icon: Users },
  { href: "/privacy", label: "Privacy", metric: "4 controls", icon: ShieldCheck },
];

export default function HomePage() {
  const basketTotal = basketItems.reduce((sum, item) => sum + item.currentPrice, 0);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Stockholm grocery terminal</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">Track grocery prices like market data.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            Compare verified shelf prices, promotions, member prices, and estimates without blending their provenance.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white" href="/products/zoegas-coffee-450g">
              Open product terminal
            </Link>
            <Link className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800" href="/stores/willys-odenplan">
              View store
            </Link>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Today</p>
          <div className="mt-5 grid gap-3">
            {featuredProducts.map((product) => (
              <Link className="rounded-lg border border-white/10 bg-white/5 p-4 transition hover:bg-white/10" href={`/products/${product.slug}`} key={product.slug}>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold">{product.name}</span>
                  <span className="tabular-nums">{product.price}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{product.signal}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        {workflowLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-400" href={item.href} key={item.href}>
              <div className="flex items-center justify-between gap-3">
                <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                <span className="text-sm font-semibold text-zinc-500">{item.metric}</span>
              </div>
              <p className="mt-4 text-base font-semibold text-zinc-950">{item.label}</p>
            </Link>
          );
        })}
      </section>
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Weekly basket</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-zinc-950">{formatSek(basketTotal)}</p>
          <p className="mt-1 text-sm text-zinc-500">Current tracked spend</p>
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          {basketItems.slice(0, 3).map((item) => (
            <Link className="grid gap-2 border-b border-zinc-200 px-5 py-4 last:border-b-0 sm:grid-cols-[1fr_auto]" href={`/products/${item.name.toLowerCase().replaceAll(" ", "-")}`} key={item.name}>
              <div>
                <p className="font-semibold text-zinc-950">{item.name}</p>
                <p className="text-sm text-zinc-500">{item.quantity} at {item.store}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-semibold tabular-nums text-zinc-950">{formatSek(item.currentPrice)}</p>
                <p className="text-sm text-zinc-500">{item.confidence}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
>>>>>>> ec0cb15 (fix: restore release validation gate)
}
