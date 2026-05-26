/**
 * GroceryView v3 design-system shell: TopBar (Bloomberg ribbon), SectorTabs,
 * SideNav, Footer, and the PageShell wrapper pages render inside.
 * Uses design-system.css classes. Server-renderable; nav is link-based.
 */
import * as React from 'react';

export interface NavItem { label: string; href: string; icon?: string; meta?: string; active?: boolean }
export interface NavSection { title: string; items: NavItem[] }

const DEFAULT_SECTIONS: NavSection[] = [
  { title: 'Markets', items: [
    { label: 'Home', href: '/', icon: '◆' },
    { label: 'Dashboard', href: '/dashboard', icon: '▤' },
    { label: 'Deals', href: '/deals', icon: '▼', meta: 'hot' },
    { label: 'Browse', href: '/products', icon: '▦' },
    { label: 'Chain index', href: '/chain-index', icon: '∿' },
  ]},
  { title: 'Sectors', items: [
    { label: 'Groceries', href: '/', icon: '🛒' },
    { label: 'Fuel', href: '/fuel', icon: '⛽' },
    { label: 'Pharmacy', href: '/pharmacy', icon: '💊' },
  ]},
  { title: 'Tools', items: [
    { label: 'Basket', href: '/basket', icon: '🧺' },
    { label: 'Compare', href: '/compare', icon: '⇄' },
    { label: 'Map', href: '/map', icon: '◎' },
    { label: 'Seasonal', href: '/seasonal', icon: '🍂' },
  ]},
  { title: 'Account', items: [
    { label: 'Watchlist', href: '/favorites', icon: '♥' },
    { label: 'Alerts', href: '/alerts', icon: '🔔' },
    { label: 'Settings', href: '/settings', icon: '⚙' },
  ]},
];

export function TopBar({ country = 'SE' }: { country?: string }) {
  const flags: Record<string, string> = { SE: '🇸🇪', NO: '🇳🇴', IS: '🇮🇸' };
  return (
    <div className="topbar">
      <div className="topbar-utility">
        <div className="container row between">
          <span>GROCERYVIEW · NORDIC GROCERY, FUEL &amp; PHARMACY PRICE INTELLIGENCE</span>
          <a href="/about">How it works</a>
        </div>
      </div>
      <div className="container topbar-main row gap-4">
        <a href="/" className="topbar-brand">GroceryView <small>v3</small></a>
        <div className="topbar-search">
          <span className="icon" aria-hidden="true">⌕</span>
          <input placeholder="Search products, stores, categories…" aria-label="Search" />
        </div>
        <div className="row gap-2" style={{ marginLeft: 'auto' }}>
          <span className="country-pill"><span className="flag">{flags[country] || '🇸🇪'}</span>{country}</span>
          <a className="icon-btn" href="/favorites" aria-label="Watchlist">♥<span className="dot" /></a>
          <a className="icon-btn" href="/basket" aria-label="Basket">🧺</a>
          <a className="btn primary" href="/dashboard">Dashboard</a>
        </div>
      </div>
    </div>
  );
}

export function SectorTabs({ active = 'groceries' }: { active?: string }) {
  const tabs = [
    { id: 'groceries', label: 'Groceries', href: '/', emoji: '🛒', count: '4,240' },
    { id: 'fuel', label: 'Fuel', href: '/fuel', emoji: '⛽', count: '320' },
    { id: 'pharmacy', label: 'Pharmacy', href: '/pharmacy', emoji: '💊', count: '180' },
  ];
  return (
    <div className="sector-tabs">
      <div className="container sector-tabs-inner">
        {tabs.map((t) => (
          <a key={t.id} href={t.href} className={`sector-tab${t.id === active ? ' active' : ''}`}>
            <span className="emoji">{t.emoji}</span>{t.label}<span className="count">{t.count}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function SideNav({ sections = DEFAULT_SECTIONS, activeHref }: { sections?: NavSection[]; activeHref?: string }) {
  return (
    <nav className="sidenav" aria-label="Main navigation">
      {sections.map((s) => (
        <div className="sidenav-section" key={s.title}>
          <div className="sidenav-section-title">{s.title}</div>
          {s.items.map((it) => (
            <a key={it.label} href={it.href} className={`sidenav-item${activeHref === it.href ? ' active' : ''}`}>
              <span className="sidenav-icon" aria-hidden="true">{it.icon}</span>
              <span className="sidenav-label">{it.label}</span>
              {it.meta && <span className={`sidenav-meta${it.meta === 'hot' ? ' brand-color' : ''}`}>{it.meta}</span>}
            </a>
          ))}
        </div>
      ))}
      <div className="sidenav-divider" />
      <div className="sidenav-section">
        <div className="sidenav-section-title">Confidence</div>
        <div className="col gap-1" style={{ padding: '0 20px', fontSize: 11, color: 'var(--ink-3)' }}>
          <span className="mono">●●● verified price</span>
          <span className="mono">●●○ recent / community</span>
          <span className="mono">●○○ estimated</span>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container col gap-6">
        <div className="row between wrap gap-6">
          <a href="/" className="topbar-brand">GroceryView <small>v3</small></a>
          <div className="row gap-8 wrap">
            <div className="col gap-2"><span className="eyebrow">Discover</span><a href="/deals">Deals</a><a href="/chain-index">Chain index</a><a href="/seasonal">Seasonal</a></div>
            <div className="col gap-2"><span className="eyebrow">Sectors</span><a href="/">Groceries</a><a href="/fuel">Fuel</a><a href="/pharmacy">Pharmacy</a></div>
            <div className="col gap-2"><span className="eyebrow">About</span><a href="/about">How it works</a><a href="/data-sources">Data sources</a><a href="/privacy">Privacy</a></div>
          </div>
        </div>
        <div className="legal" style={{ paddingTop: 16 }}>© {new Date().getFullYear()} GroceryView · Prices are indicative · Verify in-store before purchase</div>
      </div>
    </footer>
  );
}

export function PageShell({ children, activeHref, sector, withSideNav = true }: { children: React.ReactNode; activeHref?: string; sector?: string; withSideNav?: boolean }) {
  return (
    <div className="ds-root">
      <TopBar />
      <SectorTabs active={sector} />
      <div className="app-layout container">
        {withSideNav && <SideNav activeHref={activeHref} />}
        <main className="app-main" style={{ padding: '24px 0 0', minWidth: 0 }}>{children}</main>
      </div>
      <Footer />
    </div>
  );
}
