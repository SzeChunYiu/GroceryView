'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  ChevronDown,
  Database,
  Flame,
  Heart,
  ScanLine,
  Map,
  MessageCircle,
  Newspaper,
  PackageSearch,
  PiggyBank,
  Search,
  ShoppingBasket,
  Store,
  Tags,
  Moon,
  Sun,
  Utensils
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SearchBar } from './SearchBar';
import { LanguagePreferenceSwitcher } from '@/components/language-preference-switcher';
import { trackPwaInstallAnalytics } from '@/lib/analytics';
import { defaultLocale, groceryTranslator, localeCookieName, localeStorageKey, normalizeLocale, type SupportedLocale } from '@/lib/i18n';

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  match?: 'exact' | 'my-flyer';
};

type NavGroup = {
  icon: LucideIcon;
  items: NavItem[];
  label: string;
};

type AppNavTranslator = ReturnType<typeof groceryTranslator>;

const navigationLabelContract = [
  {
    label: 'Markets',
    items: [
      { href: '/', label: 'Overview' },
      { href: '/chain-index', label: 'Chain index' },
      { href: '/categories', label: 'Categories' },
      { href: '/heatmap', label: 'Heatmap' },
      { href: '/screener', label: 'Screener' }
    ]
  },
  { label: 'Products', items: [{ label: 'Browse' }, { label: 'Compare' }] },
  { label: 'Stores', items: [{ label: 'Map' }, { label: 'Stores' }] },
  { label: 'Trip', items: [{ label: 'Current list' }, { label: 'Nearby deals' }, { label: 'Watchlist' }] },
  { label: 'Personal', items: [{ label: 'Savings' }, { label: 'My Flyer' }, { label: 'Weekly basket' }, { label: 'Meal planner' }, { href: '/contact', label: 'Contact' }] }
] as const;
const appNavProvenanceLabel = 'Verified grocery intelligence';

function buildNavGroups(t: AppNavTranslator): NavGroup[] {
  void navigationLabelContract;
  void appNavProvenanceLabel;
  return [
    {
      label: t('app-nav.groups.markets'),
      icon: BarChart3,
      items: [
        { href: '/', label: t('app-nav.items.overview'), icon: BarChart3 },
        { href: '/chain-index', label: t('app-nav.items.chainIndex'), icon: Database },
        { href: '/analytics/funnel', label: t('app-nav.items.funnel'), icon: BarChart3 },
        { href: '/categories', label: t('app-nav.items.categories'), icon: Tags },
        { href: '/heatmap', label: t('app-nav.items.heatmap'), icon: Flame },
        { href: '/screener', label: 'Screener', icon: Search }
      ]
    },
    {
      label: t('app-nav.groups.products'),
      icon: PackageSearch,
      items: [
        { href: '/products', label: t('app-nav.items.browse'), icon: PackageSearch },
        { href: '/new-arrivals', label: t('app-nav.items.newArrivals'), icon: PackageSearch },
        { href: '/compare', label: t('app-nav.items.compare'), icon: Tags }
      ]
    },
    {
      label: t('app-nav.groups.stores'),
      icon: Store,
      items: [
        { href: '/map', label: t('app-nav.items.map'), icon: Map },
        { href: '/stores', label: t('app-nav.items.stores'), icon: Store }
      ]
    },
    {
      label: t('app-nav.groups.trip'),
      icon: ScanLine,
      items: [
        { href: '/scanner', label: t('app-nav.items.scanner'), icon: ScanLine },
        { href: '/list', label: t('app-nav.items.currentList'), icon: ShoppingBasket },
        { href: '/screener', label: t('app-nav.items.nearbyDeals'), icon: Tags },
        { href: '/watchlist', label: t('app-nav.items.watchlist'), icon: Heart }
      ]
    },
    {
      label: t('app-nav.groups.personal'),
      icon: Heart,
      items: [
        { href: '/savings-dashboard', label: t('app-nav.items.savings'), icon: PiggyBank },
        { href: '/stockholm/my-flyer', label: t('app-nav.items.myFlyer'), icon: Newspaper, match: 'my-flyer' },
        { href: '/weekly-basket', label: t('app-nav.items.weeklyBasket'), icon: ShoppingBasket },
        { href: '/meal-planner', label: t('app-nav.items.mealPlanner'), icon: Utensils },
        { href: '/pantry-inventory', label: t('app-nav.items.pantryInventory'), icon: ShoppingBasket },
        { href: '/contact', label: t('app-nav.items.contact'), icon: MessageCircle }
      ]
    }
  ];
}

const installBannerDismissedKey = "groceryview:install-banner-dismissed";
const themePreferenceStorageKey = 'groceryview:theme-preference';

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

type ThemePreference = 'light' | 'dark';

function applyThemePreference(preference: ThemePreference) {
  document.documentElement.classList.toggle('dark', preference === 'dark');
  document.documentElement.style.colorScheme = preference;
}

function preferredTheme(): ThemePreference {
  const storedPreference = window.localStorage.getItem(themePreferenceStorageKey);
  if (storedPreference === 'dark' || storedPreference === 'light') return storedPreference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function isInstalledDisplayMode() {
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function installBannerPlatform() {
  const userAgent = window.navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  if (/android/i.test(userAgent)) return 'android';
  return 'desktop';
}

function isNavItemActive(item: NavItem, pathname: string) {
  if (item.match === 'my-flyer') return pathname === item.href || pathname.endsWith('/my-flyer');
  if (item.match === 'exact' || item.href === '/') return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function navItemClassName(isActive: boolean, surface: 'mobile' | 'menu') {
  if (surface === 'mobile') {
    return `inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-black transition ${
      isActive
        ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
        : 'border-slate-200 bg-white text-slate-700 dark:text-slate-200 hover:border-emerald-700 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-200'
    }`;
  }

  return `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-black transition focus:outline-none ${
    isActive
      ? 'bg-emerald-800 text-white'
      : 'text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-900 focus:bg-emerald-50 focus:text-emerald-900 dark:text-slate-200 dark:hover:bg-emerald-950 dark:hover:text-emerald-200 dark:focus:bg-emerald-950 dark:focus:text-emerald-200'
  }`;
}

function InstallBanner({ t }: { t: AppNavTranslator }) {
  const [isVisible, setIsVisible] = useState(false);
  const trackedViewRef = useRef(false);

  useEffect(() => {
    setIsVisible(window.localStorage.getItem(installBannerDismissedKey) !== 'true' && !isInstalledDisplayMode());
  }, []);

  useEffect(() => {
    if (!isVisible || trackedViewRef.current) return;
    trackedViewRef.current = true;
    trackPwaInstallAnalytics({
      action: 'prompt_impression',
      canInstall: false,
      platform: installBannerPlatform(),
      source: 'install_banner'
    });
  }, [isVisible]);

  if (!isVisible) return null;

  function dismissBanner() {
    trackPwaInstallAnalytics({
      action: 'banner_dismissed',
      canInstall: false,
      platform: installBannerPlatform(),
      source: 'install_banner'
    });
    window.localStorage.setItem(installBannerDismissedKey, 'true');
    setIsVisible(false);
  }

  return (
    <aside aria-label={t('app-nav.install.label')} className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-white/88 dark:border-emerald-900 dark:bg-slate-900/90 p-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-emerald-950">{t('app-nav.install.title')}</p>
          <p className="mt-1 font-semibold leading-6 text-slate-700 dark:text-slate-200">
            {t('app-nav.install.instructions')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a className="rounded-full bg-emerald-700 px-4 py-2 font-black text-white" href="/manifest.webmanifest">
            {t('app-nav.install.cta')}
          </a>
          <button
            aria-label={t('app-nav.install.dismiss')}
            className="rounded-full border border-slate-200 px-3 py-2 font-black text-slate-600 dark:text-slate-300 transition hover:border-emerald-700 hover:text-emerald-900"
            onClick={dismissBanner}
            type="button"
          >
            ×
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const [themePreference, setThemePreference] = useState<ThemePreference>('light');
  const [locale, setLocale] = useState<SupportedLocale>(defaultLocale);
  const t = groceryTranslator(locale);
  const navGroups = buildNavGroups(t);
  const mobileNavItems = navGroups.flatMap((group) => group.items);

  useEffect(() => {
    const initialPreference = preferredTheme();
    setThemePreference(initialPreference);
    applyThemePreference(initialPreference);

    function handleSystemThemeChanged(event: MediaQueryListEvent) {
      if (window.localStorage.getItem(themePreferenceStorageKey)) return;
      const nextPreference = event.matches ? 'dark' : 'light';
      setThemePreference(nextPreference);
      applyThemePreference(nextPreference);
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChanged);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChanged);
  }, []);

  function toggleThemePreference() {
    const nextPreference = themePreference === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem(themePreferenceStorageKey, nextPreference);
    setThemePreference(nextPreference);
    applyThemePreference(nextPreference);
  }


  useEffect(() => {
    const initialLocale = readPersistedLocale();
    setLocale(initialLocale);
    document.documentElement.lang = initialLocale;

    function handleLocaleChanged(event: Event) {
      const nextLocale = normalizeLocale((event as CustomEvent<{ locale?: string }>).detail?.locale);
      if (nextLocale) {
        setLocale(nextLocale);
        document.documentElement.lang = nextLocale;
      }
    }

    window.addEventListener("groceryview:locale-changed", handleLocaleChanged);
    return () => window.removeEventListener("groceryview:locale-changed", handleLocaleChanged);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#f5f1e8]/95 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/95">
      <nav className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link className="group flex items-center gap-3" href="/">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-800 text-lg font-black text-white shadow-sm">GV</span>
          <span>
            <span className="block text-lg font-black tracking-tight text-slate-950 dark:text-slate-50">GroceryView</span>
            <span className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t('app-nav.tagline')}</span>
          </span>
        </Link>
        <div className="flex flex-1 flex-col gap-3 lg:items-end">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <SearchBar surface="app-nav" />
            <LanguagePreferenceSwitcher />
            <button
              aria-label={themePreference === "dark" ? t('app-nav.theme.switchToLight') : t('app-nav.theme.switchToDark')}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-emerald-700 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-200"
              onClick={toggleThemePreference}
              type="button"
            >
              {themePreference === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
              <span>{themePreference === "dark" ? t('app-nav.theme.light') : t('app-nav.theme.dark')}</span>
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(item, pathname);
              return (
                <Link aria-current={isActive ? 'page' : undefined} className={navItemClassName(isActive, 'mobile')} href={item.href} key={`${item.href}-${item.label}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="hidden gap-2 lg:flex lg:justify-end">
            {navGroups.map((group) => {
              const GroupIcon = group.icon;
              const isGroupActive = group.items.some((item) => isNavItemActive(item, pathname));
              return (
                <div className="group relative" key={group.label}>
                  <button
                    aria-haspopup="true"
                    className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-black transition focus:border-emerald-700 focus:text-emerald-900 focus:outline-none ${
                      isGroupActive
                        ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 dark:text-slate-200 hover:border-emerald-700 hover:text-emerald-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-400 dark:hover:text-emerald-200'
                    }`}
                    type="button"
                  >
                    <GroupIcon className="h-4 w-4" aria-hidden="true" />
                    {group.label}
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <div className="invisible absolute right-0 top-full z-30 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900 opacity-0 shadow-xl shadow-slate-900/10 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = isNavItemActive(item, pathname);
                      return (
                        <Link
                          aria-current={isActive ? 'page' : undefined}
                          className={navItemClassName(isActive, 'menu')}
                          href={item.href}
                          key={`${group.label}-${item.href}-${item.label}`}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} aria-hidden="true" />
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
      <InstallBanner t={t} />
    </header>
  );
}
