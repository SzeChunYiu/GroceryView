<<<<<<< HEAD
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categories } from '@/lib/demo-data';

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export default async function CategoryPage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm font-bold text-market-mint">
        GroceryView
      </Link>
      <section className="mt-4 rounded-lg border border-market-ink/10 bg-white p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-ink/50">Category terminal</div>
        <h1 className="mt-3 text-4xl font-black">Stockholm {category.name}</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Category index" value={category.index} />
          <Metric label="30D movement" value={category.movement} />
          <Metric label="Top current deal" value={category.topDeal} />
=======
type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Category market</p>
        <h1 className="mt-2 text-4xl font-semibold text-zinc-950">{titleFromSlug(slug)}</h1>
        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200">
          {["Best verified shelf price", "Promotion watch", "Estimated rows"].map((row, index) => (
            <div className="grid grid-cols-[1fr_auto] border-b border-zinc-200 px-4 py-3 last:border-b-0" key={row}>
              <span className="font-medium text-zinc-800">{row}</span>
              <span className="text-zinc-500">{index === 0 ? "49.90 SEK" : index === 1 ? "3 active" : "4 flagged"}</span>
            </div>
          ))}
>>>>>>> ec0cb15 (fix: restore release validation gate)
        </div>
      </section>
    </main>
  );
}
<<<<<<< HEAD

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-md bg-market-oat/45 p-4">
      <strong className="block text-xl">{value}</strong>
      <span className="text-xs font-semibold text-market-ink/55">{label}</span>
    </div>
  );
}
=======
>>>>>>> ec0cb15 (fix: restore release validation gate)
