import Link from 'next/link';
import { SearchBar } from '@/components/SearchBar';

export default function NotFoundPage() {
  return (
    <main className="gv-not-found-shell">
      <section className="mx-auto max-w-3xl rounded-2xl border border-market-ink/15 bg-white p-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-market-mint">Page not found</p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-market-ink sm:text-5xl">
          Sorry — this page is missing.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-market-ink/70">
          The link may be stale or typed incorrectly. Use the search bar below or jump to a popular section to keep
          exploring Stockholm grocery prices and stores.
        </p>

        <SearchBar />

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/products/zoegas-coffee-450g" className="gv-quick-link">
            Products
          </Link>
          <Link href="/stores" className="gv-quick-link">
            Stores
          </Link>
          <Link href="/categories" className="gv-quick-link">
            Categories
          </Link>
          <Link href="/" className="gv-quick-link">
            Homepage
          </Link>
        </div>
      </section>
    </main>
  );
}
