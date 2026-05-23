'use client';

import Link from 'next/link';
import { Activity, BarChart3, Database, Map, PackageSearch, Store, Tags } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { LanguagePreferenceSwitcher } from '@/components/language-preference-switcher';
import {
  defaultLocale,
  localeCookieName,
  localeStorageKey,
  localizedShellCopy,
  normalizeLocale,
  type SupportedLocale
} from '@/lib/i18n';

const copyByLocale = Object.fromEntries(localizedShellCopy.map((copy) => [copy.locale, copy])) as Record<
  SupportedLocale,
  (typeof localizedShellCopy)[number]
>;
const fallbackCopy = copyByLocale[defaultLocale] ?? localizedShellCopy[0];

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

function navItemsForLocale(locale: SupportedLocale) {
  const copy = copyByLocale[locale] ?? fallbackCopy;
  return [
    { href: '/', label: copy.nav.overview, icon: BarChart3 },
    { href: '/products', label: copy.nav.products, icon: PackageSearch },
    { href: '/compare', label: copy.nav.compare, icon: Tags },
    { href: '/meal-cost', label: copy.nav.mealCost, icon: Tags },
    { href: '/catalogue-savings', label: copy.nav.savings, icon: Tags },
    { href: '/chain-coverage', label: copy.nav.chain, icon: Tags },
    { href: '/stores', label: copy.nav.stores, icon: Store },
    { href: '/openprices-depth', label: copy.nav.openPrices, icon: Activity },
    { href: '/map', label: copy.nav.map, icon: Map },
    { href: '/categories', label: copy.nav.categories, icon: Database }
  ];
}

export function AppNav() {
  const [locale, setLocale] = useState<SupportedLocale>(defaultLocale);
  const navItems = useMemo(() => navItemsForLocale(locale), [locale]);

  useEffect(() => {
    const persistedLocale = readPersistedLocale();
    setLocale(persistedLocale);
    document.documentElement.lang = persistedLocale;

    function handleLocaleChanged(event: Event) {
      const nextLocale = normalizeLocale((event as CustomEvent<{ locale?: string }>).detail?.locale);
      if (nextLocale) setLocale(nextLocale);
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
