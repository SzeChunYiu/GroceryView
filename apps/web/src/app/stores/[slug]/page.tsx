<<<<<<< HEAD
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { stores } from '@/lib/demo-data';

export function generateStaticParams() {
  return stores.map((store) => ({ slug: store.slug }));
}

export default async function StorePage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const store = stores.find((item) => item.slug === slug);
  if (!store) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm font-bold text-market-mint">
        GroceryView
      </Link>
      <section className="mt-4 rounded-lg border border-market-ink/10 bg-white p-6">
        <div className="text-xs font-bold uppercase tracking-widest text-market-ink/50">Store profile</div>
        <h1 className="mt-3 text-4xl font-black">{store.name}</h1>
        <p className="mt-2 text-market-ink/65">
          {store.format} in {store.district}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Best category" value={store.bestCategory} />
          <Metric label="Distance metadata" value={store.distanceLabel} />
          <Metric label="Deal Score policy" value="No distance penalty" />
=======
type StorePageProps = {
  params: Promise<{ slug: string }>;
};

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Store terminal</p>
        <h1 className="mt-2 text-4xl font-semibold text-zinc-950">{titleFromSlug(slug)}</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="text-sm text-zinc-500">Verified prices</p>
            <p className="mt-1 text-2xl font-semibold">18</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="text-sm text-zinc-500">Promo observations</p>
            <p className="mt-1 text-2xl font-semibold">6</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4">
            <p className="text-sm text-zinc-500">Low-confidence rows</p>
            <p className="mt-1 text-2xl font-semibold">2</p>
          </div>
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
