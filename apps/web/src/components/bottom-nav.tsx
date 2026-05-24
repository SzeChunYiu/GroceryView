'use client';

import Link from 'next/link';
import { Map, Newspaper, Search, Store, User, Watch } from 'lucide-react';
import { usePathname } from 'next/navigation';

const bottomNavItems = [
  { href: '/', label: 'Markets', icon: Store, exact: true },
  { href: '/products', label: 'Search', icon: Search },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/watchlist', label: 'Watchlist', icon: Watch },
  { href: '/se/my-flyer', label: 'My Flyer', icon: Newspaper },
  { href: '/account', label: 'Me', icon: User }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-3 bottom-3 z-30 rounded-[1.5rem] border border-white/45 bg-white/72 px-2 py-2 shadow-[0_18px_45px_rgba(15,23,42,0.22)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/58 lg:hidden"
    >
      <div className="grid grid-cols-6 gap-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.1rem] px-1 py-2 text-[0.68rem] font-black leading-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
