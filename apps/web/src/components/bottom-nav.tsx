'use client';

import Link from 'next/link';
import { Heart, Map, Search, Store, UserCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Markets', icon: Store, exact: true },
  { href: '/products', label: 'Search', icon: Search },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/watchlist', label: 'Watchlist', icon: Heart },
  { href: '/account', label: 'Me', icon: UserCircle }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary mobile navigation" className="fixed inset-x-3 bottom-3 z-30 lg:hidden">
      <div className="grid grid-cols-5 rounded-3xl border border-white/60 bg-white/75 p-2 shadow-[0_16px_48px_rgba(15,23,42,0.22)] backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[0.68rem] font-black transition ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/80 hover:text-emerald-900'
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="w-full truncate text-center leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
