"use client";

import { Search, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useScrollPosition } from '@/hooks/useScrollPosition';

const navItems = [
  { href: '/', label: 'Market' },
  { href: '/weekly-basket', label: 'Basket' },
  { href: '/scanner', label: 'Scanner' },
  { href: '/household', label: 'Household' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/account', label: 'Alerts' }
];

export function Header() {
  const { isScrolled } = useScrollPosition({ threshold: 16 });
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  return (
    <header className={`site-header ${isScrolled ? 'site-header--sticky' : ''} ${isSearchExpanded ? 'site-header--search-open' : ''}`}>
      <div className="site-header__inner">
        <div className="site-header__brand">
          <Link href="/" aria-label="GroceryView home">
            GroceryView
          </Link>
        </div>

        <nav className="site-header__nav" aria-label="Primary">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="site-header__nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <form className="site-header__search" role="search" action="/" method="GET">
          <label className="sr-only" htmlFor="site-search">
            Search products
          </label>
          <Search className="site-header__search-icon" aria-hidden="true" />
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder="Search products, stores, categories"
            aria-label="Search"
          />
        </form>

        <button
          type="button"
          className="site-header__search-open-btn"
          onClick={() => setIsSearchExpanded((current) => !current)}
          aria-expanded={isSearchExpanded}
          aria-controls="site-search"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          {isSearchExpanded ? 'Hide search' : 'Search'}
        </button>

        <Link href="/login" className="site-header__cta" aria-label="Sign in">
          <UserRound className="h-4 w-4" aria-hidden="true" />
          <span>Sign in</span>
        </Link>
      </div>
    </header>
  );
}
