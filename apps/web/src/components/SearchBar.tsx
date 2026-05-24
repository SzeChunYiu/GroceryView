import Link from 'next/link';
import { Search } from 'lucide-react';

type SearchBarProps = {
  action?: string;
  placeholder?: string;
  defaultValue?: string;
};

const quickLinks = [
  { label: 'Coffee & Tea', href: '/categories/coffee-tea' },
  { label: 'Dairy', href: '/categories/dairy' },
  { label: 'Breakfast', href: '/categories/breakfast' },
  { label: 'Bread', href: '/categories/bread' },
  { label: 'Produce', href: '/categories/produce' },
];

export function SearchBar({
  action = '/products',
  defaultValue = '',
  placeholder = 'Search products, stores, or categories',
}: SearchBarProps) {
  return (
    <section className="gv-search-card rounded-xl border border-market-ink/20 bg-white p-5">
      <form action={action} method="get" className="gv-search-form">
        <label className="gv-search-label">
          <span className="sr-only">Search grocery site</span>
          <span className="gv-search-icon" aria-hidden="true">
            <Search size={18} />
          </span>
          <input
            type="search"
            name="q"
            defaultValue={defaultValue}
            placeholder={placeholder}
            className="gv-search-input"
          />
        </label>
        <button type="submit" className="gv-search-submit">
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} className="gv-chip">
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
