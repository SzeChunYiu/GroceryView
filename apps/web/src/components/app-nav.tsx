import Link from 'next/link';
import { LanguagePreferenceSwitcher } from '@/components/language-preference-switcher';
import { Activity, BarChart3, Database, Map, PackageSearch, Store, Tags } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Overview', icon: BarChart3 },
  { href: '/products', label: 'Products', icon: PackageSearch },
  { href: '/compare', label: 'Compare', icon: Tags },
  { href: '/meal-cost', label: 'Meal cost', icon: Tags },
  { href: '/catalogue-savings', label: 'Savings', icon: Tags },
  { href: '/chain-coverage', label: 'Chain', icon: Tags },
  { href: '/stores', label: 'Stores', icon: Store },
  { href: '/openprices-depth', label: 'OpenPrices', icon: Activity },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/categories', label: 'Categories', icon: Database }
];

export function AppNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f5f1e8]/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link className="group flex items-center gap-3" href="/">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-800 text-lg font-black text-white shadow-sm">GV</span>
          <span>
            <span className="block text-lg font-black tracking-tight text-slate-950">GroceryView</span>
            <span className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Verified grocery intelligence</span>
          </span>
        </Link>
        <div className="flex flex-col gap-3 lg:items-end">
          <LanguagePreferenceSwitcher />
          <div className="flex gap-2 overflow-x-auto pb-1 lg:justify-end lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:border-emerald-700 hover:text-emerald-900" href={item.href} key={item.href}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          </div>
        </div>
      </nav>
    </header>
  );
}
