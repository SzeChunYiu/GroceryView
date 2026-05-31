/* GroceryView v2 — shared components: TopBar, SectorTabs, ProductLink, ProductTile, Footer */

const { useState: useStateS, useEffect: useEffectS, useContext: useContextS, createContext } = React;

// ============ Global app context ============
const AppContext = createContext({ country: 'SE', sector: 'groceries', navigate: () => {} });
function useApp() { return useContextS(AppContext); }

// ============ Promo banner (animated sheen) ============
function PromoBanner({ icon, tag, children, hue }) {
  return (
    <div className="promo-banner" style={hue ? { ['--banner-hue']: hue } : undefined}>
      {icon && <Icon name={icon} size={18} />}
      {tag && <span className="promo-tag">{tag}</span>}
      <span className="promo-text">{children}</span>
    </div>
  );
}

// ============ Info tooltip ("?" explainer) ============
function InfoTip({ text, align }) {
  return (
    <span className={'info-tip' + (align === 'right' ? ' right' : '')} tabIndex={0} role="button" aria-label={text}>
      <Icon name="question" size={13} />
      <span className="info-tip-pop">{text}</span>
    </span>
  );
}

// ============ Country picker ============
function CountryPicker({ country, onChange }) {
  const [open, setOpen] = useStateS(false);
  const c = COUNTRIES[country];
  return (
    <div style={{ position: 'relative' }}>
      <button className="country-pill" onClick={() => setOpen(o => !o)}>
        <Flag code={c.code} size={15} />
        <span>{c.name}</span>
        <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80 }} />
          <div className="menu" style={{ position: 'absolute', top: 44, right: 0, zIndex: 90 }}>
            {Object.values(COUNTRIES).map(co => (
              <button key={co.code} className={co.code === country ? 'active' : ''}
                onClick={() => { onChange(co.code); setOpen(false); }}>
                <Flag code={co.code} size={18} />
                <div className="col" style={{ flex: 1 }}>
                  <span>{co.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 400 }}>{co.city} · {co.currencyCode}</span>
                </div>
                {co.code === country && <span style={{ color: 'var(--brand)', display: 'inline-flex' }}><Icon name="check" size={14} /></span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============ Municipality picker ============
function MunicipalityPicker({ country, municipality, onChange, postcode, setPostcode, compact }) {
  const [open, setOpen] = useStateS(false);
  const [draft, setDraft] = useStateS(postcode || '');
  const list = municipalitiesFor(country);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button className={'muni-pill' + (compact ? ' compact' : '')} onClick={() => setOpen(o => !o)} title={`Live prices from ${municipality}${postcode ? ' · ' + postcode : ''}`}>
        <Icon name="mapPin" size={compact ? 14 : 12} />
        {compact
          ? <strong>{municipality}</strong>
          : <span>Live prices from <strong>{municipality}{postcode ? ' · ' + postcode : ''}</strong></span>}
        <span style={{ opacity: 0.6, fontSize: 9 }}>▾</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 80 }} />
          <div className="menu muni-menu" style={{ position: 'absolute', top: compact ? 40 : 26, right: compact ? 0 : 'auto', left: compact ? 'auto' : 0, zIndex: 90 }}>
            <div className="muni-menu-head">Choose your municipality</div>
            {list.map(m => (
              <button key={m.name} className={m.name === municipality ? 'active' : ''}
                onClick={() => { onChange(m.name); setOpen(false); }}>
                <div className="col" style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{m.region} · {m.stores} stores</span>
                </div>
                {m.name === municipality && <span style={{ color: 'var(--brand)', display: 'inline-flex' }}><Icon name="check" size={14} /></span>}
              </button>
            ))}
            <div className="muni-postcode">
              <div className="muni-menu-head" style={{ padding: '10px 10px 6px' }}>Your postcode <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--ink-4)' }}>— for exact distances</span></div>
              <form className="row gap-2" style={{ padding: '0 6px 6px' }} onSubmit={(e) => { e.preventDefault(); setPostcode(draft.trim()); setOpen(false); }}>
                <input className="muni-postcode-input" value={draft} onChange={(e) => setDraft(e.target.value)}
                  placeholder={country === 'SE' ? 'e.g. 113 30' : country === 'NO' ? 'e.g. 0150' : 'e.g. 101'} />
                <button type="submit" className="btn sm primary">Set</button>
              </form>
            </div>
          </div>
        </>
      )}
    </span>
  );
}

// ============ Top bar ============
function TopBar({ navigate, route, country, setCountry, basketCount, sector, setSector, showSectors, municipality, setMunicipality, postcode, setPostcode, sidebarCollapsed, onToggleSidebar, setOverview, overview }) {
  return (
    <header className="topbar">
      <div className="container topbar-main row gap-2">
        <button className="topbar-toggle" onClick={onToggleSidebar} title={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'} aria-label="Toggle menu">
          <Icon name="panelLeft" size={18} />
        </button>
        <a className="topbar-brand" onClick={() => navigate('home', { overview: true, sector: 'groceries' })} style={{ cursor: 'pointer' }}>
          <span className="topbar-brand-mark">G</span>
          <span>GroceryView</span>
        </a>
        {showSectors && (
          <div className="topbar-sectors">
            {Object.values(SECTORS).map(s => (
              <button key={s.id} className={'topbar-sector ' + (!overview && sector === s.id ? 'active' : '')}
                onClick={() => { if (setOverview) setOverview(false); setSector(s.id); }}>
                <Icon name={iconForSector(s.id)} size={15} />
                <span>{s.nameLocal[country] || s.name}</span>
                <span className="count">{s.items.toLocaleString()}</span>
              </button>
            ))}
          </div>
        )}
        <div className="topbar-search">
          <span className="icon"><Icon name="search" size={15} /></span>
          <input placeholder={`Search products, stores or fuel in ${municipality}…`}
            onClick={() => navigate('search')} readOnly />
        </div>
        <MunicipalityPicker country={country} municipality={municipality} onChange={setMunicipality} postcode={postcode} setPostcode={setPostcode} compact />
        <CountryPicker country={country} onChange={setCountry} />
        <button className={'topbar-acct ' + (route === 'watchlist' ? 'active' : '')} onClick={() => navigate('watchlist')} title="Watchlist — track prices &amp; get drop alerts">
          <Icon name="heart" size={15} />
          <span className="topbar-acct-label">Watchlist</span>
          <span className="topbar-acct-count">5</span>
        </button>
        <button className={'topbar-acct ' + (route === 'basket' ? 'active' : '')} onClick={() => navigate('basket')} title="Basket — your shopping list to buy &amp; compare">
          <Icon name="cart" size={15} />
          <span className="topbar-acct-label">Basket</span>
          {basketCount > 0 && <span className="topbar-acct-count brand">{basketCount}</span>}
        </button>
        <button className="btn primary" onClick={() => navigate('dashboard')}>Dashboard</button>
      </div>
    </header>
  );
}

// ============ Sector tabs (groceries / fuel / pharmacy) ============
function SectorTabs({ sector, setSector, country }) {
  return (
    <div className="sector-tabs">
      <div className="container">
        <div className="sector-tabs-inner">
          {Object.values(SECTORS).map(s => (
            <button key={s.id} className={'sector-tab ' + (sector === s.id ? 'active' : '')}
              onClick={() => setSector(s.id)}>
              <span className="emoji" style={{ display: 'inline-flex' }}><Icon name={iconForSector(s.id)} size={17} /></span>
              <span>{s.nameLocal[country] || s.name}</span>
              <span className="count">{s.items.toLocaleString()}</span>
            </button>
          ))}
          <div style={{ flex: 1 }}></div>
          <button className="sector-tab" onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: { route: 'compare' } }))}>
            <span style={{ display: 'inline-flex' }}><Icon name="scale" size={17} /></span>
            <span>Compare prices</span>
          </button>
          <button className="sector-tab" onClick={() => window.dispatchEvent(new CustomEvent('nav', { detail: { route: 'map' } }))}>
            <span style={{ display: 'inline-flex' }}><Icon name="mapPin" size={17} /></span>
            <span>Map</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Product Link (everywhere) ============
function ProductLink({ slug, children, className = '', style }) {
  const { navigate } = useApp();
  return (
    <a className={className} style={{ cursor: 'pointer', color: 'inherit', ...style }}
      onClick={(e) => { e.stopPropagation(); navigate('product', { slug }); }}>
      {children}
    </a>
  );
}

// ============ Product Tile ============
function ProductTile({ product, badge, showCheapest = true }) {
  const { country, navigate } = useApp();
  const p = product;
  const price = priceOf(p, country);
  const regular = p.regular?.[country];
  const savings = regular != null ? (regular - price) : 0;
  const savingsPct = regular ? Math.round((savings / regular) * 100) : 0;
  const cheapest = cheapestChainOf(p, country);
  const ch = cheapest ? CHAINS[cheapest] : null;

  return (
    <div className="tile" onClick={() => navigate('product', { slug: p.slug })}>
      <div className="tile-image ico-media">
        <img src={imageForProduct(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {savingsPct >= 10 && <span className="tile-badge">−{savingsPct}%</span>}
        {badge && !savingsPct && <span className="tile-badge">{badge}</span>}
        <button className="tile-fav" onClick={(e) => e.stopPropagation()} aria-label="Save"><Icon name="heart" size={14} /></button>
      </div>
      <div className="col gap-1">
        <div className="tile-brand-size">{p.brand || ''} {p.brand && p.size && '·'} {p.size || ''}</div>
        <div className="tile-name">{p.brand && p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name.slice(p.brand.length).trim() : p.name}</div>
      </div>
      <div className="row between" style={{ alignItems: 'flex-end' }}>
        <div className="col gap-1">
          <div className="tile-price">{fmtPrice(price, country)}
            {regular > price && <span className="tile-price-old">{fmtPrice(regular, country)}</span>}
          </div>
          {jamforpris(p, country) && <div className="tile-unit-price">{jamforpris(p, country)}</div>}
        </div>
      </div>
      {showCheapest && ch && (
        <div className="tile-store">
          <span className="dot" style={{ background: ch.color }}></span>
          <span style={{ color: 'var(--ink-2)' }}>Cheapest at</span>
          <strong>{ch.name}</strong>
        </div>
      )}
    </div>
  );
}

// ============ Chain swatch ============
function ChainSwatch({ chain, size = 18 }) {
  const c = typeof chain === 'string' ? CHAINS[chain] : chain;
  if (!c) return null;
  return (
    <span className="swatch" style={{
      background: c.color,
      width: size, height: size, fontSize: Math.max(8, size * 0.5),
      borderRadius: 100, color: 'white', fontWeight: 800,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
    }}>{c.short}</span>
  );
}

// ============ Store chip (clickable) ============
function StoreChip({ chain, name, onClick }) {
  const c = typeof chain === 'string' ? CHAINS[chain] : chain;
  if (!c) return null;
  return (
    <span className="store-chip" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <ChainSwatch chain={c} size={18} />
      <span>{name || c.name}</span>
    </span>
  );
}

// ============ Section header ============
function Section({ eyebrow, title, subtitle, action, children }) {
  return (
    <section style={{ marginTop: 48 }}>
      <div className="row between" style={{ marginBottom: 20, alignItems: 'flex-end' }}>
        <div>
          {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
          {title && <h2 className="section-title">{title}</h2>}
          {subtitle && <div style={{ color: 'var(--ink-2)', fontSize: 14, marginTop: 4, maxWidth: 640 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ============ Breadcrumb ============
function Breadcrumb({ trail }) {
  const { navigate } = useApp();
  return (
    <div className="row gap-2" style={{ fontSize: 13, color: 'var(--ink-3)' }}>
      {trail.map((t, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span>›</span>}
          {t.route
            ? <a className="crumb-link" style={{ cursor: 'pointer' }} onClick={() => navigate(t.route, t.params || {})}>{t.label}</a>
            : <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{t.label}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============ Footer ============
function Footer({ navigate, country }) {
  return (
    <footer className="footer">
      <div className="container grid grid-4" style={{ gap: 32, marginBottom: 32 }}>
        <div>
          <a className="topbar-brand" onClick={() => navigate('home', { overview: true, sector: 'groceries' })} style={{ cursor: 'pointer', marginBottom: 16, display: 'inline-flex' }}>
            <span className="topbar-brand-mark">G</span>
            <span>GroceryView</span>
          </a>
          <p style={{ color: 'var(--ink-2)', fontSize: 13, maxWidth: 260, marginTop: 12 }}>
            Compare grocery, fuel, and pharmacy prices across Sweden, Norway and Iceland. Always free, always honest.
          </p>
          <div className="row gap-2" style={{ marginTop: 16 }}>
            {Object.values(COUNTRIES).map(c => (
              <span key={c.code} className="pill" style={{ gap: 6 }}>
                <Flag code={c.code} size={13} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Discover</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--ink-2)', fontSize: 14, lineHeight: 2 }}>
            <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('home')}>Deals today</a></li>
            <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('compare')}>Compare basket</a></li>
            <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('map')}>Stores near me</a></li>
            <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('dashboard')}>Price dashboard</a></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Sectors</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--ink-2)', fontSize: 14, lineHeight: 2 }}>
            <li><a className="row gap-2" style={{ cursor: 'pointer' }} onClick={() => navigate('home', { sector: 'groceries' })}><Icon name="cart" size={14} /> Groceries</a></li>
            <li><a className="row gap-2" style={{ cursor: 'pointer' }} onClick={() => navigate('home', { sector: 'fuel' })}><Icon name="fuel" size={14} /> Fuel</a></li>
            <li><a className="row gap-2" style={{ cursor: 'pointer' }} onClick={() => navigate('home', { sector: 'pharmacy' })}><Icon name="pillCapsule" size={14} /> Pharmacy</a></li>
          </ul>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>About</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--ink-2)', fontSize: 14, lineHeight: 2 }}>
            <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('about')}>How we measure</a></li>
            <li><a style={{ cursor: 'pointer' }} onClick={() => navigate('about')}>Data sources</a></li>
            <li><a>API for developers</a></li>
            <li><a>Press</a></li>
          </ul>
        </div>
      </div>
      <div className="container row between legal">
        <span>© 2026 GroceryView · Independent, ad-free.</span>
        <div className="row gap-4">
          <a style={{ cursor: 'pointer' }} onClick={() => navigate('about')}>How it works</a>
          <a>Help</a><a>For businesses</a><a>App</a>
          <a>Privacy</a><a>Terms</a><a>Cookies</a>
        </div>
      </div>
    </footer>
  );
}

// ============ Banner / hero variants ============
function SavingsBanner({ amount, currency = 'kr', city = 'Stockholm', onClick }) {
  return (
    <div className="savings-banner">
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9 }}>Save up to</div>
        <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 4 }}>
          {amount.toLocaleString('sv-SE')} {currency}
        </div>
        <div style={{ fontSize: 16, opacity: 0.9, marginTop: 8, maxWidth: 360 }}>
          on this week's basket by buying from the cheapest chain in {city}.
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <button className="btn save lg" onClick={onClick}>See how →</button>
      </div>
    </div>
  );
}

// ============ Floating sitemap button ============
function FloatingNav({ navigate, route }) {
  const [open, setOpen] = useStateS(false);
  const items = [
    { id: 'home', name: 'Home', emoji: '🏠' },
    { id: 'product', name: 'Product page', emoji: '🥛', params: { slug: 'zoegas-coffee-450g' } },
    { id: 'dashboard', name: 'Dashboard', emoji: '📊' },
    { id: 'compare', name: 'Compare basket', emoji: '⚖️' },
    { id: 'deals', name: 'Deals', emoji: '🔥' },
    { id: 'map', name: 'Map', emoji: '📍' },
    { id: 'category', name: 'Category page', emoji: '📚', params: { slug: 'coffee' } },
    { id: 'store', name: 'Store page', emoji: '🏬', params: { slug: 'willys-odenplan' } },
    { id: 'fuel', name: 'Fuel stations', emoji: '⛽' },
    { id: 'pharmacy', name: 'Pharmacy', emoji: '💊' },
    { id: 'watchlist', name: 'Watchlist', emoji: '♡' },
    { id: 'basket', name: 'Shopping list', emoji: '🛒' },
    { id: 'search', name: 'Search', emoji: '🔍' },
    { id: 'about', name: 'About data', emoji: 'ℹ️' },
  ];
  return (
    <>
      <button className="btn sm float-btn" onClick={() => setOpen(o => !o)}>
        <Icon name="grid" size={13} /> All pages · {items.length}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.3)' }} />
          <div style={{ position: 'fixed', bottom: 56, left: 16, zIndex: 70, background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 16, padding: 8, boxShadow: 'var(--shadow-lg)', minWidth: 240, maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="eyebrow" style={{ padding: '8px 12px' }}>Site map</div>
            {items.map(it => (
              <button key={it.id + (it.params?.slug || '')} className="menu" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 12px', background: route === it.id ? 'var(--brand-tint)' : 'transparent', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                onClick={() => { navigate(it.id, it.params || {}); setOpen(false); }}>
                <Icon name={({home:'home',product:'coffee',dashboard:'dashboard',compare:'scale',deals:'flame',map:'mapPin',category:'layers',store:'store',fuel:'fuel',pharmacy:'pillCapsule',watchlist:'heart',basket:'cart',search:'search',about:'info'})[it.id] || 'box'} size={16} />
                <span style={{ flex: 1, color: 'var(--ink)' }}>{it.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// ============ Stat card row ============
function StatRow({ label, value, hint, color, big }) {
  return (
    <div className="row between" style={{ paddingBottom: 10, borderBottom: '1px solid var(--rule)' }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ fontSize: big ? 22 : 16, fontWeight: 700, color: color || 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

// ============ SIDEBAR NAVIGATION ============
function SideNav({ route, navigate, collapsed, setCollapsed }) {
  const sections = [
    {
      title: 'Markets',
      items: [
        { id: 'home',      icon: 'home',      label: 'Overview',     meta: 'LIVE', params: { overview: true, sector: 'groceries' } },
        { id: 'dashboard', icon: 'dashboard', label: 'Dashboard',    meta: '' },
        { id: 'browse',    icon: 'grid',      label: 'Browse all',   meta: '5 500' },
        { id: 'deals',     icon: 'flame',     label: 'Top deals',    meta: 'HOT' },
      ],
    },
    {
      title: 'Tools',
      items: [
        { id: 'compare',   icon: 'scale', label: 'Compare basket', meta: '' },
        { id: 'map',       icon: 'mapPin', label: 'Price map',      meta: '' },
        { id: 'search',    icon: 'search', label: 'Search',         meta: '⌘K' },
      ],
    },
    {
      title: 'Account',
      items: [
        { id: 'basket',    icon: 'cart', label: 'Shopping list',   meta: '10' },
        { id: 'watchlist', icon: 'heart', label: 'Watchlist',      meta: '5' },
        { id: 'about',     icon: 'info', label: 'About data',     meta: '' },
      ],
    },
  ];
  return (
    <aside className={'sidenav ' + (collapsed ? 'collapsed' : '')}>
      {sections.map((sec, i) => (
        <div key={i} className="sidenav-section">
          <div className="sidenav-section-title">— {sec.title}</div>
          {sec.items.map((it, j) => {
            const isActive = route === it.id && !it.params?.sector;
            return (
              <button key={j} className={'sidenav-item ' + (isActive ? 'active' : '')}
                onClick={() => navigate(it.id, it.params || {})}
                title={collapsed ? it.label : undefined}>
                <span className="sidenav-icon"><Icon name={it.icon} size={17} /></span>
                <span className="sidenav-label">{it.label}</span>
                {it.meta && <span className={'sidenav-meta ' + (it.meta === 'HOT' || it.meta === 'LIVE' ? 'brand-color' : '')}>{it.meta}</span>}
              </button>
            );
          })}
        </div>
      ))}
      <div className="sidenav-divider" />
      <div style={{ padding: '0 20px' }} className="sidenav-foot">
        <div className="sidenav-section-title" style={{ padding: 0 }}>Coverage</div>
        <div className="freshness-key" style={{ marginTop: 10 }}>
          <div className="row gap-2"><Icon name="check" size={13} /><span>Prices verified daily</span></div>
          <div className="row gap-2"><Icon name="store" size={13} /><span>86 stores · 3 countries</span></div>
          <div className="row gap-2"><Icon name="clock" size={13} /><span>Updated 3 minutes ago</span></div>
        </div>
      </div>
    </aside>
  );
}

// ============ Product preview (quick-look popover) ============
function ProductPreview({ product, onClose }) {
  const { country, navigate, municipality } = useApp();
  useEffectS(() => {
    if (!product) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product]);
  if (!product) return null;
  const p = product;
  const price = priceOf(p, country);
  const regular = p.regular?.[country];
  const savingsPct = regular && regular > price ? Math.round((1 - price / regular) * 100) : 0;
  const cheapest = cheapestChainOf(p, country);
  const low = p.low52?.[country], high = p.high52?.[country];
  const pct = (low != null && high != null && high > low) ? ((price - low) / (high - low)) * 100 : null;
  const verdict = pct == null ? null
    : pct < 30 ? { txt: 'Great price', color: 'var(--up)' }
    : pct < 70 ? { txt: 'Typical price', color: 'var(--ink-2)' }
    : { txt: 'Near year-high', color: 'var(--down)' };
  const tr = p.sparkline ? ((p.sparkline[p.sparkline.length - 1] - p.sparkline[0]) / p.sparkline[0]) * 100 : 0;
  const go = () => { onClose(); navigate('product', { slug: p.slug }); };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'oklch(20% 0.02 250 / 0.45)', WebkitBackdropFilter: 'blur(3px)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="fade-in" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: 'var(--surface)', border: '1px solid var(--rule-2)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        <div className="ico-media" style={{ height: 156, position: 'relative', borderBottom: '1px solid var(--rule)' }}>
          <img src={imageForProduct(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {savingsPct >= 1 && <span className="tile-badge" style={{ top: 12, left: 12 }}>−{savingsPct}%</span>}
          <button className="icon-btn" onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 12, right: 12 }}><Icon name="x" size={15} /></button>
        </div>
        <div className="col gap-3" style={{ padding: 20 }}>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            {p.brand && <span className="pill">{p.brand}</span>}
            {p.size && <span className="pill">{p.size}</span>}
            {verdict && <span className="pill" style={{ color: verdict.color, borderColor: 'currentColor', background: 'transparent' }}>{verdict.txt}</span>}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.12 }}>{p.name}</div>
          <div className="row between" style={{ alignItems: 'flex-end' }}>
            <div className="col gap-1">
              <div style={{ fontFamily: 'var(--mono)', fontSize: 30, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--brand-deep)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{fmtPrice(price, country)}</div>
              {jamforpris(p, country) && <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{jamforpris(p, country)}</div>}
              {regular > price && <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Reg. <span style={{ textDecoration: 'line-through' }}>{fmtPrice(regular, country)}</span></div>}
            </div>
            {p.sparkline && <Sparkline values={p.sparkline} w={120} h={38} color={tr < 0 ? 'var(--up)' : 'var(--down)'} />}
          </div>
          {cheapest && (() => {
            const ch = CHAINS[cheapest];
            const online = ch && (ch.tier === 'online' || /online|mathem|apotea/i.test(ch.name));
            return (
              <div className="preview-source">
                <div className="row between" style={{ alignItems: 'center' }}>
                  <span className="row gap-2" style={{ alignItems: 'center', fontSize: 12, color: 'var(--ink-2)', fontFamily: 'var(--mono)', letterSpacing: '0.04em' }}>
                    <span>Cheapest at</span><StoreChip chain={cheapest} />
                  </span>
                  <span className="pill" style={{ gap: 5 }}><Icon name={online ? 'truck' : 'store'} size={11} /> {online ? 'Online' : 'In-store'}</span>
                </div>
                <a className="offer-link" href="#" onClick={(e) => e.preventDefault()}>
                  <Icon name="arrowUpRight" size={13} />
                  {online ? `View this price on ${ch.name.replace(/\s*\(online\)/i,'')}` : `Open ${ch.name}'s weekly flyer`}
                </a>
                <span className="offer-note">
                  {online
                    ? `Live online price, refreshed today — ships nationwide.`
                    : `From this week's ${ch.name} flyer · ${municipality}. Verify in-store before you travel.`}
                </span>
              </div>
            );
          })()}
          <div className="row gap-2" style={{ marginTop: 4 }}>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={go}>View full details <Icon name="arrowRight" size={14} /></button>
            <button className="btn" onClick={onClose}><Icon name="heart" size={14} /> Watch</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  AppContext, useApp, InfoTip, MunicipalityPicker, PromoBanner,
  TopBar, SectorTabs, CountryPicker, SideNav,
  ProductLink, ProductTile, ChainSwatch, StoreChip,
  Section, Breadcrumb, Footer, SavingsBanner, FloatingNav, StatRow, ProductPreview,
});
