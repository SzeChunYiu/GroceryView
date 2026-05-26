'use client';

import Link from 'next/link';
import { Globe2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { marketCityPreviews, marketCountries, readinessLabel, type MarketCountrySlug } from '@/lib/market-routing';

function equivalentMarketPath(pathname: string, targetCountry: MarketCountrySlug) {
  const segments = pathname.split('/').filter(Boolean);
  const currentMarket = marketCountries.find((country) => country.slug === segments[0]);
  if (currentMarket) {
    if (segments[1] === 'cities' && segments[2]) {
      const hasEquivalentCity = marketCityPreviews.some((city) => city.country === targetCountry && city.slug === segments[2]);
      return hasEquivalentCity ? `/${[targetCountry, ...segments.slice(1)].join('/')}` : `/${targetCountry}`;
    }
    return `/${[targetCountry, ...segments.slice(1)].join('/')}`;
  }
  return `/${targetCountry}`;
}

export function MarketSwitcher() {
  const pathname = usePathname();
  const currentMarket = marketCountries.find((country) => pathname === country.href || pathname.startsWith(`${country.href}/`));

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <Globe2 className="h-4 w-4 shrink-0 text-emerald-800 dark:text-emerald-300" aria-hidden="true" />
      <span className="sr-only">Market</span>
      <div className="flex min-w-0 gap-1 overflow-x-auto">
        {marketCountries.map((country) => {
          const isActive = currentMarket?.slug === country.slug || (!currentMarket && country.slug === 'sweden');
          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black transition ${
                isActive
                  ? 'bg-emerald-800 text-white'
                  : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 dark:text-slate-200 dark:hover:bg-emerald-950 dark:hover:text-emerald-200'
              }`}
              href={equivalentMarketPath(pathname, country.slug)}
              key={country.slug}
            >
              <span>{country.nativeLabel}</span>
              <span className={isActive ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}>{readinessLabel(country.readiness)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
