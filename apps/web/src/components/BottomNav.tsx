'use client';

import Link from 'next/link';
import { Heart, Home, Search, ShoppingBasket, SlidersHorizontal } from 'lucide-react';
import { usePathname } from 'next/navigation';

const bottomNavItems = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/products', label: 'Search', icon: Search },
  { href: '/screener', label: 'Screener', icon: SlidersHorizontal },
  { href: '/favourites', label: 'Favourites', icon: Heart },
  { href: '/basket', label: 'Basket', icon: ShoppingBasket },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Mobile bottom navigation" className="fixed inset-x-3 bottom-3 z-40 rounded-[1.5rem] border border-white/60 bg-white/90 px-2 py-2 shadow-[0_18px_45px_rgba(15,23,42,0.22)] backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link aria-current={active ? 'page' : undefined} className={`flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[0.68rem] font-black ${active ? 'bg-emerald-800 text-white' : 'text-slate-700'}`} href={item.href} key={item.href}>
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
