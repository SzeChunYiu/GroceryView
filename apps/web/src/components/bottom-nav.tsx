import Link from 'next/link';
import { Map, Search, Store, User, Watch } from 'lucide-react';

const bottomNavItems = [
  { href: '/', label: 'Markets', icon: Store },
  { href: '/products', label: 'Search', icon: Search },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/watchlist', label: 'Watchlist', icon: Watch },
  { href: '/account', label: 'Me', icon: User }
];

export function BottomNav() {
  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-3 bottom-3 z-30 rounded-[1.5rem] border border-white/45 bg-white/72 px-2 py-2 shadow-[0_18px_45px_rgba(15,23,42,0.22)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/58 lg:hidden"
    >
      <div className="grid grid-cols-5 gap-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.1rem] px-1 py-2 text-[0.68rem] font-black leading-none text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              href={item.href}
              key={item.href}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
