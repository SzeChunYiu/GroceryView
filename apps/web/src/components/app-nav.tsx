'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  ChevronDown,
  Database,
  Flame,
  Heart,
  ListChecks,
  Map,
  PackageSearch,
  PiggyBank,
  Search,
  ShoppingBasket,
  Store,
  Tags,
  Utensils
} from 'lucide-react';
import { useEffect } from 'react';
import { LanguagePreferenceSwitcher } from '@/components/language-preference-switcher';
import { defaultLocale, localeCookieName, localeStorageKey, normalizeLocale, type SupportedLocale } from '@/lib/i18n';

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

type NavGroup = {
  icon: LucideIcon;
  items: NavItem[];
  label: string;
};

const navGroups: NavGroup[] = [
  {
    label: 'Markets',
    icon: BarChart3,
    items: [
      { href: '/', label: 'Overview', icon: BarChart3 },
      { href: '/chain-index', label: 'Chain index', icon: Database },
      { href: '/categories', label: 'Categories', icon: Tags },
      { href: '/heatmap', label: 'Heatmap', icon: Flame },
      { href: '/screener', label: 'Screener', icon: Search }
    ]
  },
  {
    label: 'Products',
    icon: PackageSearch,
    items: [
      { href: '/products', label: 'Browse', icon: PackageSearch },
      { href: '/compare', label: 'Compare', icon: ListChecks }
    ]
  },
  {
    label: 'Stores',
    icon: Store,
    items: [
      { href: '/map', label: 'Map', icon: Map },
      { href: '/stores', label: 'Stores', icon: Store }
    ]
  },
  {
    label: 'Personal',
    icon: Heart,
    items: [
      { href: '/savings-dashboard', label: 'Savings', icon: PiggyBank },
      { href: '/alerts', label: 'Alerts', icon: Bell },
      { href: '/favorites', label: 'Favorites', icon: Heart },
      { href: '/favourites', label: 'Favourites', icon: Heart },
      { href: '/watchlist', label: 'Watchlist', icon: Heart },
      { href: '/list', label: 'Shopping list', icon: ListChecks },
      { href: '/basket', label: 'Basket', icon: ShoppingBasket },
      { href: '/weekly-basket', label: 'Weekly basket', icon: ShoppingBasket },
      { href: '/meal-planner', label: 'Meal planner', icon: Utensils }
    ]
  }
];

const mobileNavItems = navGroups.flatMap((group) => group.items);

function readPersistedLocale(): SupportedLocale {
  const localStorageLocale = normalizeLocale(window.localStorage.getItem(localeStorageKey));
  if (localStorageLocale) return localStorageLocale;

  const legacyLocalStorageLocale = normalizeLocale(window.localStorage.getItem('groceryview:locale'));
  if (legacyLocalStorageLocale) return legacyLocalStorageLocale;

  const cookieLocale = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${localeCookieName}=`))
    ?.split('=')[1];

  return normalizeLocale(cookieLocale) ?? defaultLocale;
}

export function AppNav() {
  useEffect(() => {
    document.documentElement.lang = readPersistedLocale();

    function handleLocaleChanged(event: Event) {
      const nextLocale = normalizeLocale((event as CustomEvent<{ locale?: string }>).detail?.locale);
      if (nextLocale) document.documentElement.lang = nextLocale;
    }

    window.addEventListener('groceryview:locale-changed', handleLocaleChanged);
    return () => window.removeEventListener('groceryview:locale-changed', handleLocaleChanged);
  }, []);

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
          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:border-emerald-700 hover:text-emerald-900" href={item.href} key={`${item.href}-${item.label}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="hidden gap-2 lg:flex lg:justify-end">
            {navGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div className="group relative" key={group.label}>
                  <button
                    aria-haspopup="true"
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-emerald-700 hover:text-emerald-900 focus:border-emerald-700 focus:text-emerald-900 focus:outline-none"
                    type="button"
                  >
                    <GroupIcon className="h-4 w-4" aria-hidden="true" />
                    {group.label}
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <div className="invisible absolute right-0 top-full z-30 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 opacity-0 shadow-xl shadow-slate-900/10 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-900 focus:bg-emerald-50 focus:text-emerald-900 focus:outline-none"
                          href={item.href}
                          key={`${group.label}-${item.href}-${item.label}`}
                        >
                          <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
