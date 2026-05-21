import Link from 'next/link';
import { Lightbulb, MapPinned, Route, ShoppingBasket } from 'lucide-react';
import { mealIdeaBoard, products } from '@/lib/demo-data';

export const dynamic = 'force-static';

function productTicker(slug: string) {
  return products.find((product) => product.slug === slug)?.ticker ?? slug;
}

export default function BasketIdeasPage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="flex flex-wrap items-center justify-between gap-3 border-b border-market-ink/10 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <div className="flex gap-3 text-sm font-semibold text-market-ink/70">
          <Link href="/meal-planner">Planner</Link>
          <Link href="/weekly-basket">Basket</Link>
          <Link href="/shopping-trips">Trips</Link>
        </div>
      </nav>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg bg-market-ink p-6 text-white">
          <div className="text-xs font-bold uppercase tracking-widest text-market-mint">Basket ideas</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">{mealIdeaBoard.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">{mealIdeaBoard.focus}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric icon={<Lightbulb size={20} />} label="Ideas" value={String(mealIdeaBoard.readyIdeas)} />
          <Metric icon={<ShoppingBasket size={20} />} label="Spotlight" value={mealIdeaBoard.spotlight} />
          <Metric icon={<Route size={20} />} label="Signal" value="Route ready" />
          <Metric icon={<MapPinned size={20} />} label="Scope" value="Stockholm" />
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="border-b border-market-ink/10 px-4 py-3">
          <h2 className="text-lg font-black">{mealIdeaBoard.rulesTitle}</h2>
          <p className="mt-1 text-sm text-market-ink/60">{mealIdeaBoard.newestSignal}</p>
        </div>
        <div className="grid gap-0 md:grid-cols-3">
          {mealIdeaBoard.rules.map((rule) => (
            <div key={rule.label} className="border-b border-market-ink/10 px-4 py-4 text-sm md:border-r">
              <span className="block text-xs font-bold uppercase text-market-ink/50">{rule.label}</span>
              <span className="mt-2 block leading-6 text-market-ink/65">{rule.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-market-ink/10 bg-white">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-market-ink/10 px-4 py-3 text-xs font-bold uppercase tracking-wide text-market-ink/55">
          <span>Idea</span>
          <span>Savings</span>
          <span className="text-right">Total</span>
        </div>
        {mealIdeaBoard.ideas.map((idea) => (
          <article key={idea.title} className="border-b border-market-ink/10 px-4 py-4 text-sm last:border-b-0">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <div>
                <span className="block text-xs font-bold uppercase text-market-ink/50">{idea.area}</span>
                <h2 className="mt-1 text-xl font-black capitalize">{idea.title}</h2>
                <p className="mt-2 leading-6 text-market-ink/65">{idea.route}</p>
              </div>
              <span className="font-black tabular-nums text-market-mint">{idea.savings}</span>
              <span className="text-right font-black tabular-nums">{idea.total}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {idea.products.map((slug) => (
                <Link
                  key={slug}
                  href={`/products/${slug}`}
                  className="rounded-full bg-market-oat px-2 py-1 text-xs font-bold text-market-ink/65 hover:text-market-mint"
                >
                  {productTicker(slug)}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: Readonly<{ icon: React.ReactNode; label: string; value: string }>) {
  return (
    <div className="rounded-lg border border-market-ink/10 bg-white p-4">
      <div className="flex items-center justify-between gap-3 text-market-mint">
        {icon}
        <span className="text-xs font-bold uppercase text-market-ink/45">{label}</span>
      </div>
      <strong className="mt-4 block text-2xl font-black">{value}</strong>
    </div>
  );
}
