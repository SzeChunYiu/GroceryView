/* GroceryView v2 — remaining pages.
   Compare, Deals, Map, Store, Category, Watchlist, Basket, Search, About */

const { useState: useStateO, useMemo: useMemoO, useEffect: useEffectO } = React;

// ============================================================
// COMPARE BASKET
// ============================================================
function ComparePage() {
  const { country, navigate } = useApp();
  const c = COUNTRIES[country];
  const basket = MY_BASKET_DEFAULT.map(b => ({ ...b, p: findProduct(b.slug) })).filter(b => b.p && priceOf(b.p, country));
  const stores = STORES.filter(s => s.country === country);
  const [strategy, setStrategy] = useStateO('split');

  // single-stop totals
  const storeTotals = stores.map(s => {
    let total = 0, covered = 0;
    basket.forEach(({ qty, p }) => {
      const chains = chainsOf(p, country);
      const price = chains[s.chain];
      if (price != null) { total += price * qty; covered++; }
      else { total += priceOf(p, country) * qty * 1.08; }
    });
    return { ...s, total: Math.round(total), covered, totalItems: basket.length };
  }).sort((a, b) => a.total - b.total);

  // split-shop best
  const splitAssignments = basket.map(({ qty, p }) => {
    const chains = chainsOf(p, country);
    const best = Object.entries(chains).sort(([,a], [,b]) => a - b)[0];
    return { p, qty, chain: best[0], price: best[1] };
  });
  const splitTotal = Math.round(splitAssignments.reduce((s, a) => s + a.price * a.qty, 0));
  const splitStores = [...new Set(splitAssignments.map(a => a.chain))];

  const cheapest = storeTotals[0];
  const expensive = storeTotals[storeTotals.length - 1];
  const totalSavings = expensive.total - splitTotal;

  return (
    <main className="fade-in">
      <div className="container" style={{ padding: '20px 0 64px' }}>
        <Breadcrumb trail={[{ label: 'Home', route: 'home' }, { label: 'Compare basket' }]} />

        {/* HEADER */}
        <div style={{ marginTop: 20 }}>
          <h1 className="page-title" style={{ fontSize: 40 }}>Compare your basket</h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', maxWidth: 640, marginTop: 8 }}>
            We price your usual {basket.length}-item basket at every store in {c.city}. Pick the cheapest, or split your shop between two stores to save even more.
          </p>
        </div>

        {/* BIG SAVINGS */}
        <div className="savings-banner" style={{ marginTop: 28 }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ opacity: 0.9, fontSize: 14, fontWeight: 600 }}>You could save</div>
            <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 4 }}>
              {totalSavings.toLocaleString(c.locale)} {c.currency}
            </div>
            <div style={{ fontSize: 16, opacity: 0.9, marginTop: 8 }}>
              vs. shopping at the priciest store with this same basket.
            </div>
          </div>
          <div className="row gap-3" style={{ position: 'relative', zIndex: 1 }}>
            <button className="btn save lg">Show me how →</button>
          </div>
        </div>

        {/* STRATEGY TOGGLE */}
        <Section eyebrow="Strategy" title="One stop, or two?">
          <div className="grid grid-2">
            <button onClick={() => setStrategy('single')} className="card col gap-3"
              style={{ textAlign: 'left', cursor: 'pointer', border: strategy === 'single' ? '2px solid var(--brand)' : '1px solid var(--rule)', padding: 24, background: 'var(--surface)' }}>
              <div className="row between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="eyebrow">Single stop</div>
                  <h3 style={{ fontSize: 22, marginTop: 6 }}>1 trip · all in one place</h3>
                </div>
                {strategy === 'single' && <span className="pill solid-brand">Selected</span>}
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {cheapest.total.toLocaleString(c.locale)} {c.currency}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                All {basket.length} items at <strong>{cheapest.name}</strong> · {cheapest.distance} km away
              </div>
              <div className="row gap-3" style={{ paddingTop: 12, borderTop: '1px solid var(--rule)' }}>
                <span className="pill">{cheapest.distance} km</span>
                <span className="pill">~12 min drive</span>
                <span className="pill brand">Save {(expensive.total - cheapest.total).toLocaleString(c.locale)} {c.currency}</span>
              </div>
            </button>

            <button onClick={() => setStrategy('split')} className="card col gap-3"
              style={{ textAlign: 'left', cursor: 'pointer', border: strategy === 'split' ? '2px solid var(--brand)' : '1px solid var(--rule)', padding: 24, background: 'var(--surface)' }}>
              <div className="row between" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div className="eyebrow">Split shop</div>
                  <h3 style={{ fontSize: 22, marginTop: 6 }}>{splitStores.length} stops · most savings</h3>
                </div>
                {strategy === 'split' && <span className="pill solid-brand">Selected</span>}
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: 'var(--brand-deep)' }}>
                {splitTotal.toLocaleString(c.locale)} {c.currency}
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                Save an extra <strong style={{ color: 'var(--brand)' }}>{(cheapest.total - splitTotal).toLocaleString(c.locale)} {c.currency}</strong> by splitting between {splitStores.length} stores
              </div>
              <div className="row gap-3" style={{ paddingTop: 12, borderTop: '1px solid var(--rule)' }}>
                {splitStores.slice(0, 3).map(cid => <ChainSwatch key={cid} chain={cid} size={28} />)}
              </div>
            </button>
          </div>
        </Section>

        {/* TABLE */}
        {strategy === 'single' && (
          <Section eyebrow="Single-stop ranking" title="Cheapest stores for your basket">
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Store</th>
                    <th className="num">Distance</th>
                    <th className="num">Items covered</th>
                    <th className="num">Total</th>
                    <th className="num">vs cheapest</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {storeTotals.map((s, i) => (
                    <tr key={s.slug} onClick={() => navigate('store', { slug: s.slug })} style={{ cursor: 'pointer' }} className={i === 0 ? 'best' : ''}>
                      <td><strong style={{ fontFamily: 'var(--mono)', color: 'var(--ink-3)' }}>{i + 1}</strong></td>
                      <td>
                        <div className="row gap-3">
                          <ChainSwatch chain={s.chain} size={28} />
                          <div>
                            <strong>{s.name}</strong>
                            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.district}</div>
                          </div>
                        </div>
                      </td>
                      <td className="num">{s.distance} km</td>
                      <td className="num">{s.covered}/{s.totalItems}</td>
                      <td className="num"><strong style={{ fontSize: 18 }}>{s.total.toLocaleString(c.locale)} {c.currency}</strong></td>
                      <td className="num">
                        {i === 0
                          ? <span className="pill brand">Cheapest</span>
                          : <span style={{ color: 'var(--hot)' }}>+{(s.total - storeTotals[0].total).toLocaleString(c.locale)} {c.currency}</span>}
                      </td>
                      <td><button className="btn sm">Plan →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {strategy === 'split' && (
          <Section eyebrow="Split shop plan" title="Here's what to buy where">
            <div className="grid grid-3">
              {Array.from(new Set(splitAssignments.map(a => a.chain))).map(cid => {
                const items = splitAssignments.filter(a => a.chain === cid);
                const subtotal = items.reduce((s, a) => s + a.price * a.qty, 0);
                const ch = CHAINS[cid];
                return (
                  <div key={cid} className="card col gap-3">
                    <div className="row gap-3">
                      <ChainSwatch chain={ch} size={36} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{ch.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{items.length} items</div>
                      </div>
                    </div>
                    <div className="col gap-2" style={{ paddingTop: 4 }}>
                      {items.map(a => (
                        <ProductLink key={a.p.slug} slug={a.p.slug}>
                          <div className="row between" style={{ fontSize: 13, padding: '4px 0' }}>
                          <span className="row gap-2"><Icon name={iconForProduct(a.p)} size={15} /> {a.p.name} <span style={{ color: 'var(--ink-3)' }}>×{a.qty}</span></span>
                            <strong>{fmtPrice(a.price * a.qty, country)}</strong>
                          </div>
                        </ProductLink>
                      ))}
                    </div>
                    <div className="row between" style={{ paddingTop: 12, borderTop: '1px solid var(--rule)' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-3)', textTransform: 'uppercase', fontWeight: 700 }}>Subtotal</span>
                      <strong style={{ fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>{subtotal.toFixed(0)} {c.currency}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* BASKET ITEMS */}
        <Section eyebrow="Your basket" title={`${basket.length} items`}
          action={<button className="btn"><Icon name="plus" size={14} /> Add item</button>}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Cheapest at</th>
                  <th className="num">Qty</th>
                  <th className="num">Unit price</th>
                  <th className="num">Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {basket.map(({ p, qty }) => {
                  const price = priceOf(p, country);
                  const cheapest = cheapestChainOf(p, country);
                  return (
                    <tr key={p.slug} style={{ cursor: 'pointer' }} onClick={() => navigate('product', { slug: p.slug })}>
                      <td>
                        <div className="row gap-3">
                          <span className="ico-chip" style={{ width: 34, height: 34 }}><Icon name={iconForProduct(p)} size={19} /></span>
                          <div>
                            <strong>{p.name}</strong>
                            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.brand} · {p.size}</div>
                          </div>
                        </div>
                      </td>
                      <td>{cheapest && <StoreChip chain={cheapest} />}</td>
                      <td className="num">×{qty}</td>
                      <td className="num">{fmtPrice(price, country)}</td>
                      <td className="num"><strong>{fmtPrice(price * qty, country)}</strong></td>
                      <td><button className="btn sm ghost" onClick={(e) => e.stopPropagation()}>×</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </main>
  );
}

// ============================================================
// DEALS
// ============================================================
function DealsPage() {
  const { country, navigate, sector: activeSector } = useApp();
  const c = COUNTRIES[country];
  const [sector, setSector] = useStateO(activeSector || 'all');
  const deals = ALL_PRODUCTS
    .filter(p => p.regular?.[country] && priceOf(p, country) && (sector === 'all' || p.sector === sector))
    .map(p => {
      const price = priceOf(p, country);
      const regular = p.regular[country];
      return { ...p, savings: regular - price, pct: ((regular - price) / regular) * 100 };
    })
    .sort((a, b) => b.pct - a.pct);

  return (
    <main className="fade-in">
      <div className="container" style={{ padding: '20px 0 64px' }}>
        <Breadcrumb trail={[{ label: 'Home', route: 'home' }, { label: 'Deals' }]} />

        <div className="row between" style={{ marginTop: 20, alignItems: 'flex-end' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: 40 }}>Top deals in {c.city}</h1>
            <p style={{ fontSize: 16, color: 'var(--ink-2)', maxWidth: 540, marginTop: 8 }}>
              Real discounts, ranked by % off. Every deal is verified against the product's own year-long price history.
            </p>
          </div>
          <div className="row gap-2">
            <div className="tabs">
              <button className={sector === 'all' ? 'active' : ''} onClick={() => setSector('all')}>All</button>
              <button className={sector === 'groceries' ? 'active' : ''} onClick={() => setSector('groceries')}><Icon name="cart" size={13} /> Groceries</button>
              <button className={sector === 'fuel' ? 'active' : ''} onClick={() => setSector('fuel')}><Icon name="fuel" size={13} /> Fuel</button>
              <button className={sector === 'pharmacy' ? 'active' : ''} onClick={() => setSector('pharmacy')}><Icon name="pillCapsule" size={13} /> Pharmacy</button>
              <button className={sector === 'beauty' ? 'active' : ''} onClick={() => setSector('beauty')}><Icon name="lipstick" size={13} /> Beauty</button>
            </div>
          </div>
        </div>

        <div className="grid grid-4" style={{ marginTop: 32 }}>
          <KPI label="Deals today" value={deals.length.toString()} sub="Refreshed every 4 hours" color="var(--brand)" />
          <KPI label="Total potential saving" value={fmtPrice(deals.reduce((s, d) => s + d.savings, 0), country)}
            sub="Buy one of each" color="var(--save)" />
          <KPI label="Biggest discount" value={`−${Math.max(...deals.map(d => d.pct)).toFixed(0)}%`}
            sub={deals[0]?.name} />
          <KPI label="Avg discount" value={`−${(deals.reduce((s, d) => s + d.pct, 0) / deals.length).toFixed(0)}%`}
            sub="Across all deals" />
        </div>

        <Section eyebrow="All deals" title={`${deals.length} active discounts`}>
          <div className="grid grid-4">
            {deals.map(p => <ProductTile key={p.slug} product={p} />)}
          </div>
        </Section>
      </div>
    </main>
  );
}

// ============================================================
// MAP
// ============================================================
function MapPage() {
  const { country, navigate } = useApp();
  const c = COUNTRIES[country];
  const [view, setView] = useStateO('groceries');
  const [colorBy, setColorBy] = useStateO('basket'); // basket | chain | distance
  const [selected, setSelected] = useStateO(null);
  const [hovered, setHovered] = useStateO(null);
  const [search, setSearch] = useStateO('');
  const [showLayers, setShowLayers] = useStateO({ stores: true, you: true, district: true });

  const stores = STORES.filter(s => s.country === country);
  const fuelStations = Object.entries(FUEL_STATIONS).filter(([, s]) => s.country === country);
  let items = view === 'groceries' ? stores : fuelStations.map(([slug, s]) => ({ ...s, slug, basketCost: 0, basketDiff: 0, percentile: 50, district: s.city }));
  if (search) {
    const q = search.toLowerCase();
    items = items.filter(s => s.name.toLowerCase().includes(q) || (s.district||'').toLowerCase().includes(q));
  }

  const colorForStore = (s) => {
    if (colorBy === 'chain') return CHAINS[s.chain]?.color || 'var(--ink-3)';
    if (colorBy === 'distance') {
      if (s.distance < 2) return 'var(--up)';
      if (s.distance < 4) return 'var(--warn)';
      return 'var(--down)';
    }
    if (s.percentile < 20) return 'var(--up)';
    if (s.percentile < 40) return 'oklch(60% 0.10 130)';
    if (s.percentile < 60) return 'var(--ink-3)';
    if (s.percentile < 80) return 'oklch(60% 0.14 50)';
    return 'var(--down)';
  };

  return (
    <main className="fade-in">
      {/* HEADER STRIP */}
      <div style={{ background: 'var(--ink)', color: 'var(--bg)', borderBottom: '1px solid var(--ink)' }}>
        <div className="container" style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="row gap-4" style={{ alignItems: 'center' }}>
            <span className="eyebrow" style={{ color: 'oklch(75% 0.01 78)' }}>— Price map · {c.city}</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>
              <em style={{ fontWeight: 400, color: 'oklch(85% 0.01 78)' }}>Where to shop in</em> {c.city}
            </h1>
          </div>
          <div className="row gap-2">
            <div className="tabs" style={{ background: 'oklch(24% 0.02 250)', borderColor: 'oklch(30% 0.02 250)' }}>
              <button className={view === 'groceries' ? 'active' : ''} onClick={() => setView('groceries')} style={{ color: view === 'groceries' ? 'var(--ink)' : 'oklch(80% 0.01 78)' }}><Icon name="cart" size={13} /> GROCERIES</button>
              <button className={view === 'fuel' ? 'active' : ''} onClick={() => setView('fuel')} style={{ color: view === 'fuel' ? 'var(--ink)' : 'oklch(80% 0.01 78)' }}><Icon name="fuel" size={13} /> FUEL</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '20px 0 64px' }}>
        <div className="grid" style={{ gridTemplateColumns: '320px 1fr 360px', gap: 16, alignItems: 'flex-start' }}>

          {/* LEFT — list of stores */}
          <div className="card no-pad" style={{ position: 'sticky', top: 56 + 70, maxHeight: 'calc(100vh - 140px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--rule)' }}>
              <input className="input" placeholder="Search store or district…" value={search} onChange={e => setSearch(e.target.value)} style={{ height: 32, fontSize: 12 }} />
              <div className="row between" style={{ marginTop: 10 }}>
                <span className="eyebrow" style={{ fontSize: 10 }}>{items.length} {view === 'groceries' ? 'stores' : 'stations'}</span>
                <span className="eyebrow" style={{ fontSize: 10 }}>SORT · {colorBy === 'basket' ? 'cheapest' : colorBy === 'distance' ? 'closest' : 'chain'}</span>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {items.slice().sort((a, b) =>
                colorBy === 'distance' ? a.distance - b.distance :
                colorBy === 'basket' ? (a.basketCost||0) - (b.basketCost||0) :
                a.name.localeCompare(b.name)
              ).map((s, i) => {
                const ch = CHAINS[s.chain];
                const isSel = selected?.slug === s.slug;
                return (
                  <button key={s.slug} className="col gap-2" onClick={() => setSelected(s)}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid var(--rule)',
                      background: isSel ? 'var(--bg-2)' : 'transparent',
                      borderLeft: isSel ? '3px solid var(--brand)' : '3px solid transparent',
                      cursor: 'pointer', textAlign: 'left', border: 'none', width: '100%',
                    }}>
                    <div className="row between" style={{ alignItems: 'flex-start' }}>
                      <div className="row gap-2" style={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <ChainSwatch chain={ch} size={24} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                          <div className="eyebrow" style={{ fontSize: 10 }}>{s.district || s.city}</div>
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{s.distance.toFixed(1)}km</span>
                    </div>
                    {view === 'groceries' && s.basketCost > 0 && (
                      <div className="row between" style={{ marginTop: 4 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600 }}>
                          {s.basketCost.toLocaleString(c.locale)} {c.currency}
                        </span>
                        <span className={'pill ' + (s.basketDiff < 0 ? 'save' : s.basketDiff > 0 ? 'hot' : '')}>
                          {s.basketDiff < 0 ? '−' : '+'}{Math.abs(s.basketDiff)} {c.currency}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAP */}
          <div className="card no-pad" style={{ overflow: 'hidden', position: 'sticky', top: 56 + 70 }}>
            {/* Controls bar */}
            <div className="row between" style={{ padding: '10px 14px', borderBottom: '1px solid var(--rule)', background: 'var(--surface-2)' }}>
              <div className="row gap-2">
                <span className="eyebrow">Color by:</span>
                <div className="tabs">
                  <button className={colorBy === 'basket' ? 'active' : ''} onClick={() => setColorBy('basket')}>BASKET COST</button>
                  <button className={colorBy === 'distance' ? 'active' : ''} onClick={() => setColorBy('distance')}>DISTANCE</button>
                  <button className={colorBy === 'chain' ? 'active' : ''} onClick={() => setColorBy('chain')}>CHAIN</button>
                </div>
              </div>
              <div className="row gap-2">
                <button className="btn sm">＋ Zoom</button>
                <button className="btn sm">− Zoom</button>
              </div>
            </div>

            <div className="map-bg" style={{ height: 600, position: 'relative' }}>
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="grid-bg" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(88% 0.012 78)" strokeWidth="0.5" />
                  </pattern>
                  <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(82% 0.04 220)" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="oklch(78% 0.05 230)" stopOpacity="0.55" />
                  </linearGradient>
                </defs>
                <rect width="1200" height="600" fill="oklch(95% 0.014 78)" />
                <rect width="1200" height="600" fill="url(#grid-bg)" />
                {/* land blocks */}
                <path d="M 50 60 L 500 50 L 620 180 L 580 380 L 320 410 L 100 330 Z" fill="oklch(97% 0.008 78)" stroke="oklch(86% 0.014 78)" strokeWidth="1" />
                <path d="M 140 440 L 700 430 L 770 540 L 380 600 L 80 580 Z" fill="oklch(97% 0.008 78)" stroke="oklch(86% 0.014 78)" strokeWidth="1" />
                <path d="M 650 220 L 1100 240 L 1180 480 L 850 520 L 700 420 Z" fill="oklch(97% 0.008 78)" stroke="oklch(86% 0.014 78)" strokeWidth="1" />
                <path d="M 850 540 L 1180 560 L 1180 600 L 760 600 Z" fill="oklch(97% 0.008 78)" stroke="oklch(86% 0.014 78)" strokeWidth="1" />
                {/* water */}
                <path d="M 0 380 Q 300 360 600 410 T 1200 420 L 1200 460 Q 900 440 600 460 T 0 470 Z" fill="url(#water)" />
                {/* roads */}
                <path d="M 0 220 Q 300 210 600 240 T 1200 240" stroke="oklch(82% 0.014 78)" strokeWidth="3" fill="none" />
                <path d="M 480 0 Q 500 200 540 380 T 600 600" stroke="oklch(82% 0.014 78)" strokeWidth="3" fill="none" />
                <path d="M 0 510 Q 600 500 1200 510" stroke="oklch(82% 0.014 78)" strokeWidth="2" fill="none" />
                {/* district labels */}
                {showLayers.district && (
                  <g style={{ pointerEvents: 'none' }}>
                    <text x="230" y="140" fontSize="11" fontWeight="600" fill="oklch(50% 0.012 78)" letterSpacing="0.14em" fontFamily="JetBrains Mono">VASASTAN</text>
                    <text x="500" y="280" fontSize="11" fontWeight="600" fill="oklch(50% 0.012 78)" letterSpacing="0.14em" fontFamily="JetBrains Mono">NORRMALM</text>
                    <text x="370" y="500" fontSize="11" fontWeight="600" fill="oklch(50% 0.012 78)" letterSpacing="0.14em" fontFamily="JetBrains Mono">SÖDERMALM</text>
                    <text x="820" y="350" fontSize="11" fontWeight="600" fill="oklch(50% 0.012 78)" letterSpacing="0.14em" fontFamily="JetBrains Mono">ÖSTERMALM</text>
                    <text x="990" y="570" fontSize="11" fontWeight="600" fill="oklch(50% 0.012 78)" letterSpacing="0.14em" fontFamily="JetBrains Mono">HAMMARBY SJ.</text>
                  </g>
                )}
                {/* Mälaren */}
                <text x="600" y="448" fontSize="10" fontWeight="500" fill="oklch(55% 0.05 230)" letterSpacing="0.18em" fontFamily="JetBrains Mono" textAnchor="middle">MÄLAREN</text>
              </svg>

              {/* Pins */}
              {showLayers.stores && items.map((s, i) => {
                const x = s.coords[0] * 100;
                const y = s.coords[1] * 100;
                const isSel = selected?.slug === s.slug;
                const isHov = hovered?.slug === s.slug;
                const color = colorForStore(s);
                return (
                  <div key={s.slug} style={{
                    position: 'absolute', left: x + '%', top: y + '%',
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer', zIndex: isSel || isHov ? 20 : 1,
                    transition: 'transform 0.16s',
                  }}
                    onClick={() => setSelected(s)}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(null)}>
                    {/* Outer pulse on selected */}
                    {isSel && (
                      <div style={{
                        position: 'absolute', inset: -8,
                        background: color,
                        borderRadius: 100,
                        opacity: 0.15,
                        animation: 'pulse-pin 1.6s ease-out infinite',
                      }} />
                    )}
                    {/* Pill */}
                    <div style={{
                      background: 'var(--surface)',
                      border: `2px solid ${color}`,
                      borderRadius: 999,
                      padding: '3px 9px 3px 4px',
                      fontFamily: 'var(--mono)',
                      fontWeight: 600,
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                      boxShadow: 'var(--shadow-md)',
                      transform: (isHov || isSel) ? 'scale(1.08)' : 'scale(1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                      <span style={{
                        width: 14, height: 14, background: color, borderRadius: 100, display: 'inline-block',
                      }} />
                      {view === 'groceries'
                        ? `${s.basketCost.toLocaleString(c.locale)} ${c.currency}`
                        : s.name.split(' ').slice(-1)[0]}
                    </div>
                  </div>
                );
              })}

              {/* You marker */}
              {showLayers.you && (
                <div style={{ position: 'absolute', left: '40%', top: '40%', transform: 'translate(-50%, -50%)', zIndex: 5 }}>
                  <div style={{ position: 'relative', width: 18, height: 18 }}>
                    <span style={{
                      position: 'absolute', inset: 0,
                      background: 'var(--info)', borderRadius: 100,
                      animation: 'pulse-pin 1.6s ease-out infinite',
                      opacity: 0.4,
                    }} />
                    <span style={{
                      position: 'absolute', inset: 4,
                      background: 'var(--info)', borderRadius: 100,
                      border: '2px solid var(--bg)',
                    }} />
                  </div>
                  <div style={{
                    position: 'absolute', top: 18, left: 9, transform: 'translateX(-50%)',
                    fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 600,
                    color: 'var(--info)', whiteSpace: 'nowrap', letterSpacing: '0.06em',
                  }}>YOU</div>
                </div>
              )}
              <style>{`
                @keyframes pulse-pin { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(3); opacity: 0; } }
              `}</style>

              {/* Bottom strip with layers + legend */}
              <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'var(--surface)', border: '1px solid var(--rule)', padding: '10px 14px', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="eyebrow" style={{ fontSize: 10 }}>LAYERS</div>
                {[
                  { id: 'stores', label: 'Stores' },
                  { id: 'you', label: 'You' },
                  { id: 'district', label: 'Districts' },
                ].map(l => (
                  <label key={l.id} className="row gap-2" style={{ fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showLayers[l.id]} onChange={e => setShowLayers({...showLayers, [l.id]: e.target.checked})} />
                    {l.label}
                  </label>
                ))}
              </div>

              {colorBy === 'basket' && (
                <div style={{ position: 'absolute', bottom: 14, right: 14, background: 'var(--surface)', border: '1px solid var(--rule)', padding: '10px 14px', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)' }}>
                  <div className="eyebrow" style={{ fontSize: 10, marginBottom: 8 }}>BASKET COST</div>
                  <div className="row gap-2" style={{ alignItems: 'center' }}>
                    {[
                      { c: 'var(--up)', l: 'Cheap' },
                      { c: 'oklch(60% 0.10 130)', l: '' },
                      { c: 'var(--ink-3)', l: 'Avg' },
                      { c: 'oklch(60% 0.14 50)', l: '' },
                      { c: 'var(--down)', l: 'Pricey' },
                    ].map((b, i) => (
                      <div key={i} className="col gap-1" style={{ alignItems: 'center', fontSize: 10, fontFamily: 'var(--mono)' }}>
                        <span style={{ width: 22, height: 10, background: b.c, borderRadius: 2 }} />
                        <span style={{ color: 'var(--ink-3)' }}>{b.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — detail panel */}
          <div className="col gap-4" style={{ position: 'sticky', top: 56 + 70 }}>
            {(selected || hovered) ? (() => {
              const s = selected || hovered;
              const ch = CHAINS[s.chain];
              return (
                <>
                  <div className="card col gap-3">
                    <div className="row between">
                      <ChainSwatch chain={ch} size={36} />
                      {view === 'groceries' && <span className="pill save">Cheaper than {100 - s.percentile}%</span>}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em' }}>{s.name}</div>
                      <div className="eyebrow" style={{ marginTop: 4 }}>{s.district || s.city} · {s.distance} km</div>
                    </div>
                    {view === 'groceries' ? (
                      <>
                        <div style={{ paddingTop: 12, borderTop: '1px solid var(--rule)' }}>
                          <div className="eyebrow">Your basket here</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>
                            {s.basketCost.toLocaleString(c.locale)} {c.currency}
                          </div>
                          <div className="row gap-2" style={{ marginTop: 4 }}>
                            <span className={'pill ' + (s.basketDiff < 0 ? 'save' : 'hot')}>
                              {s.basketDiff < 0 ? '−' : '+'}{Math.abs(s.basketDiff)} {c.currency} vs city avg
                            </span>
                          </div>
                          <div className="bar-track" style={{ height: 8, marginTop: 12 }}>
                            <div className="bar-fill" style={{ width: s.percentile + '%', background: 'linear-gradient(90deg, var(--up) 0%, var(--warn) 50%, var(--down) 100%)' }} />
                          </div>
                          <div className="row between" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
                            <span>Cheapest</span><span>Most expensive</span>
                          </div>
                        </div>
                        <button className="btn primary" onClick={() => navigate('store', { slug: s.slug })}>OPEN STORE →</button>
                      </>
                    ) : (
                      <>
                        <div style={{ paddingTop: 12, borderTop: '1px solid var(--rule)' }}>
                          <div className="eyebrow">Bensin 95 · today</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 600, marginTop: 4 }}>
                            {fmtPrice(priceOf(FUEL_PRODUCTS[0], country), country)}
                          </div>
                        </div>
                        <button className="btn primary">DIRECTIONS →</button>
                      </>
                    )}
                  </div>
                  {view === 'groceries' && (
                    <div className="card col gap-3">
                      <div className="eyebrow">Cheapest items here</div>
                      {GROCERY_PRODUCTS.slice(0, 4).map(p => {
                        const chains = chainsOf(p, country);
                        const here = chains[s.chain];
                        if (!here) return null;
                        return (
                          <a key={p.slug} className="row between" style={{ cursor: 'pointer', padding: 6, borderRadius: 4 }}
                            onClick={() => navigate('product', { slug: p.slug })}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}>
                            <div className="row gap-2">
                              <Icon name={iconForProduct(p)} size={16} />
                              <span style={{ fontSize: 12 }}>{p.name}</span>
                            </div>
                            <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 12 }}>{fmtPrice(here, country)}</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })() : (
              <div className="card col gap-3" style={{ padding: 32, alignItems: 'center', textAlign: 'center' }}>
                <div style={{ color: 'var(--ink-3)' }}><Icon name="mapPin" size={34} /></div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500 }}>Pick a {view === 'groceries' ? 'store' : 'station'}</div>
                <div className="eyebrow" style={{ fontSize: 11 }}>Click a pin or list item to see prices</div>
              </div>
            )}

            {/* Summary stats */}
            <div className="card col gap-3">
              <div className="eyebrow">— Area summary</div>
              <div className="col gap-2" style={{ fontSize: 12 }}>
                <StatRow label="Stores tracked" value={items.length.toString()} />
                <StatRow label="Cheapest district" value="Vasastan" />
                <StatRow label="Avg basket" value={fmtPrice(items.reduce((s, x) => s + (x.basketCost || 0), 0) / items.filter(x => x.basketCost > 0).length || 0, country)} />
                <StatRow label="Spread (cheapest vs priciest)" value="−24%" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// STORE PAGE
// ============================================================
function StorePage({ slug }) {
  const { country, navigate } = useApp();
  const c = COUNTRIES[country];
  const s = findStore(slug) || STORES[0];
  const ch = CHAINS[s.chain];
  // Products available here
  const products = (s.country === 'SE' ? GROCERY_PRODUCTS : GROCERY_PRODUCTS).filter(p => {
    const chains = chainsOf(p, s.country);
    return chains[s.chain] != null;
  }).slice(0, 8);

  return (
    <main className="fade-in">
      <div className="container" style={{ padding: '20px 0 64px' }}>
        <Breadcrumb trail={[
          { label: 'Home', route: 'home' },
          { label: 'Stores', route: 'map' },
          { label: s.name },
        ]} />

        {/* HERO */}
        <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 24, marginTop: 20, alignItems: 'flex-start' }}>
          <div>
            <div className="row gap-3" style={{ alignItems: 'center', marginBottom: 12 }}>
              <ChainSwatch chain={ch} size={48} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: ch.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{ch.name}</div>
                <h1 className="page-title" style={{ fontSize: 38 }}>{s.name}</h1>
              </div>
            </div>
            <div className="row gap-2 wrap" style={{ marginBottom: 16 }}>
              <span className="pill">{s.district}</span>
              <span className="pill">{s.distance} km away</span>
              <span className="pill">Open until {s.openTill}</span>
              <span className="pill">{ch.tier}</span>
            </div>
            <p style={{ fontSize: 16, color: 'var(--ink-2)', maxWidth: 540 }}>
              {s.percentile < 25
                ? `One of the cheapest grocery stores in ${c.city}. Worth the trip if you're stocking up.`
                : s.percentile > 70
                  ? `Convenient but pricey. Better for last-minute essentials.`
                  : `A solid all-rounder. Average prices across most categories.`}
            </p>
            <div className="row gap-3" style={{ marginTop: 16 }}>
              <button className="btn primary"><Icon name="mapPin" size={14} /> Get directions</button>
              <button className="btn"><Icon name="heart" size={14} /> Save as favourite</button>
            </div>
          </div>

          <div className="card col gap-3" style={{ background: 'var(--brand-tint)', borderColor: 'oklch(86% 0.04 152)' }}>
            <div className="eyebrow">Your basket here</div>
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {s.basketCost.toLocaleString(c.locale)} {c.currency}
            </div>
            <div className="row gap-2">
              <span className="pill brand">
                {s.basketDiff < 0 ? '−' : '+'}{Math.abs(s.basketDiff)} {c.currency} vs city median
              </span>
              <span className="pill">Cheaper than {100 - s.percentile}% of stores</span>
            </div>
            <div className="bar-track" style={{ height: 10 }}>
              <div className="bar-fill" style={{ width: s.percentile + '%', background: 'linear-gradient(90deg, var(--brand) 0%, var(--save) 50%, var(--hot) 100%)' }} />
            </div>
            <div className="row between" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              <span>Cheapest in {c.city}</span>
              <span>Most expensive</span>
            </div>
            <button className="btn primary">Compare your basket here →</button>
          </div>
        </div>

        {/* STOCKED PRODUCTS */}
        <Section eyebrow="In stock" title="What people buy here" subtitle="Tap any product for full price history and comparison.">
          <div className="grid grid-4">
            {products.map(p => <ProductTile key={p.slug} product={p} />)}
          </div>
        </Section>

        {/* COMPARE NEARBY */}
        <Section eyebrow="Nearby alternatives" title={`Other stores within 4 km of ${s.name}`}>
          <div className="card">
            <BarChart
              w={1200} barH={28} gap={10}
              rows={STORES.filter(st => st.country === s.country).slice().sort((a, b) => a.basketCost - b.basketCost).slice(0, 10).map(st => ({
                label: st.name,
                value: st.basketCost,
                color: st.slug === s.slug ? 'var(--save)' : st.basketCost < s.basketCost ? 'var(--brand)' : 'var(--ink-3)',
                bold: st.slug === s.slug,
              }))}
              format={v => v.toLocaleString(c.locale) + ' ' + c.currency}
              valueColor="solid"
              labelW={220}
            />
          </div>
        </Section>
      </div>
    </main>
  );
}

// ============================================================
// CATEGORY PAGE
// ============================================================
function CategoryPage({ slug }) {
  const { country, navigate, sector, setSector } = useApp();
  const c = COUNTRIES[country];
  const cat = findCategory(slug) || CATEGORIES[0];
  const products = ALL_PRODUCTS.filter(p => p.category === slug && priceOf(p, country));
  const display = products.length ? products : ALL_PRODUCTS.slice(0, 8);
  // sync domain theme with the category's sector
  const catSector = cat.sector || (products[0] && products[0].sector) || 'groceries';
  useEffectO(() => { if (catSector !== sector) setSector(catSector); }, [catSector]);

  return (
    <main className="fade-in">
      <div className="container" style={{ padding: '20px 0 64px' }}>
        <Breadcrumb trail={[
          { label: 'Home', route: 'home' },
          { label: 'Categories', route: 'browse' },
          { label: cat.name },
        ]} />

        <div className="row gap-4" style={{ marginTop: 24, alignItems: 'center' }}>
          <span className="ico-chip" style={{ width: 72, height: 72 }}><Icon name={iconForCategory(cat.slug)} size={40} stroke={1.4} /></span>
          <div>
            <h1 className="page-title" style={{ fontSize: 44 }}>{cat.name}</h1>
            <p style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 6 }}>
              {cat.count} products tracked across {c.city}. Find the best deal in seconds.
            </p>
          </div>
        </div>

        <div className="grid grid-4" style={{ marginTop: 32 }}>
          <KPI label="Cheapest" value={fmtPrice(Math.min(...display.map(p => priceOf(p, country))), country)} sub="In category" color="var(--brand)" />
          <KPI label="Average" value={fmtPrice(display.reduce((s, p) => s + priceOf(p, country), 0) / display.length, country)} sub="Across all chains" />
          <KPI label="On deal now" value={display.filter(p => p.regular?.[country] && priceOf(p, country) < p.regular[country] * 0.9).length.toString()} sub="Active discounts" color="var(--save)" />
          <KPI label="Products tracked" value={cat.count.toString()} sub="Updated daily" />
        </div>

        <Section eyebrow="All products" title={`${display.length} items in ${cat.name}`}>
          <div className="grid grid-4">
            {display.map(p => <ProductTile key={p.slug} product={p} />)}
          </div>
        </Section>
      </div>
    </main>
  );
}

// ============================================================
// WATCHLIST
// ============================================================
function WatchlistPage() {
  const { country, navigate } = useApp();
  const c = COUNTRIES[country];
  // Mock watchlist — a real cross-domain mix (groceries, pharmacy, beauty)
  const watchSlugs = ['zoegas-coffee-450g', 'olaplex-no3-100', 'alvedon-500mg-20', 'cerave-moisturising-cream-340', 'bregott-normalsaltat-600g'];
  const items = watchSlugs.map(findProduct).filter(p => p && priceOf(p, country)).map((p, i) => {
    const price = priceOf(p, country);
    const target = price * (0.85 + i * 0.03);
    return { p, target, hit: price <= target };
  });

  return (
    <main className="fade-in">
      <div className="container" style={{ padding: '20px 0 64px' }}>
        <Breadcrumb trail={[{ label: 'Home', route: 'home' }, { label: 'Watchlist' }]} />
        <div style={{ marginTop: 20 }}>
          <h1 className="page-title row gap-3" style={{ fontSize: 40, alignItems: 'center' }}><Icon name="heart" size={28} /> Your watchlist</h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 8, maxWidth: 560 }}>
            Items you're <strong>tracking for a price drop</strong> — these aren't in your basket.
            Set a target and we'll alert you the moment any of them falls below it.
          </p>
          <div className="row gap-2" style={{ marginTop: 14 }}>
            <span className="pill" style={{ gap: 5 }}><Icon name="bell" size={11} /> {items.filter(i => i.hit).length} ready to buy</span>
            <span className="pill" style={{ gap: 5 }}><Icon name="eye" size={11} /> {items.length} tracked</span>
            <button className="btn sm" onClick={() => navigate('basket')}><Icon name="cart" size={13} /> Go to basket</button>
          </div>
        </div>

        <div className="grid grid-3" style={{ marginTop: 28 }}>
          {items.map(({ p, target, hit }) => {
            const price = priceOf(p, country);
            return (
              <a key={p.slug} className="card col gap-3" onClick={() => navigate('product', { slug: p.slug })} style={{ cursor: 'pointer', borderColor: hit ? 'var(--brand)' : 'var(--rule)', background: hit ? 'var(--brand-tint)' : 'var(--surface)' }}>
                <div className="row between">
                  <div className="row gap-3">
                    <span className="ico-chip" style={{ width: 44, height: 44 }}><Icon name={iconForProduct(p)} size={24} /></span>
                    <div className="col" style={{ gap: 2 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 16, lineHeight: 1.15 }}>{p.brand && p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name.slice(p.brand.length).trim() : p.name}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, lineHeight: 1.15, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {p.brand && <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{p.brand}</span>}
                        {p.brand && p.size && <span style={{ color: 'var(--ink-4)' }}> · </span>}
                        {p.size && <span style={{ color: 'var(--ink-3)' }}>{p.size}</span>}
                      </div>
                    </div>
                  </div>
                  {hit && <span className="pill solid-brand" style={{ gap: 4 }}><Icon name="check" size={11} /> Target hit</span>}
                </div>
                <div className="row between" style={{ alignItems: 'flex-end' }}>
                  <div>
                    <div className="eyebrow">Now</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: hit ? 'var(--brand)' : 'var(--ink)' }}>{fmtPrice(price, country)}</div>
                  </div>
                  <div>
                    <div className="eyebrow">Target</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-2)' }}>{fmtPrice(target, country)}</div>
                  </div>
                </div>
                <Sparkline values={p.sparkline} w={300} h={32} color={hit ? 'var(--brand)' : 'var(--ink-3)'} />
              </a>
            );
          })}
        </div>

        <FavouriteStores country={country} navigate={navigate} />
      </div>
    </main>
  );
}

// ============ FAVOURITE STORES (on watchlist) ============
function FavouriteStores({ country, navigate }) {
  const favs = STORES.filter(s => s.country === country).slice(0, 3);
  const dealsAt = (store) => {
    const onDeal = GROCERY_PRODUCTS.filter(p =>
      p.cheapest?.[country] === store.chain && p.regular?.[country] && priceOf(p, country) < p.regular[country]
    );
    const pool = onDeal.length ? onDeal : GROCERY_PRODUCTS.filter(p => p.regular?.[country] && priceOf(p, country) < p.regular[country]);
    return pool
      .map(p => ({ p, save: 1 - priceOf(p, country) / p.regular[country] }))
      .sort((a, b) => b.save - a.save)
      .slice(0, 3);
  };
  return (
    <div style={{ marginTop: 48 }}>
      <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 16 }}>
        <div>
          <div className="eyebrow">— Favourite stores</div>
          <h2 className="section-title" style={{ marginTop: 6 }}>This week's deals where <em>you actually shop</em></h2>
          <p className="page-sub" style={{ marginTop: 6, fontSize: 13 }}>Current promotions at the stores you've saved. Tap a store to see its full shelf, or a deal to see its price history.</p>
        </div>
        <button className="btn sm ghost" onClick={() => navigate('map')}><Icon name="plus" size={13} /> Add a store</button>
      </div>
      <div className="grid grid-3">
        {favs.map(store => {
          const ch = CHAINS[store.chain];
          const deals = dealsAt(store);
          return (
            <div key={store.slug} className="card no-pad col" style={{ overflow: 'hidden' }}>
              <button className="row between" onClick={() => navigate('store', { slug: store.slug })} style={{
                width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit',
                padding: '14px 16px', borderBottom: '1px solid var(--rule)', background: 'var(--bg-2)', border: 'none',
                alignItems: 'center',
              }}>
                <div className="row gap-3" style={{ alignItems: 'center', minWidth: 0 }}>
                  <ChainSwatch chain={ch} size={26} />
                  <div className="col" style={{ gap: 2, minWidth: 0 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 16, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{store.name}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{store.district} · {store.distance} km</span>
                  </div>
                </div>
                <span style={{ color: 'var(--ink-3)', display: 'inline-flex', flexShrink: 0 }}><Icon name="chevronRight" size={16} /></span>
              </button>
              <div className="col" style={{ flex: 1, padding: '4px 0' }}>
                {deals.map(({ p, save }) => {
                  const price = priceOf(p, country);
                  const reg = p.regular?.[country];
                  return (
                    <button key={p.slug} className="fav-deal" onClick={() => navigate('product', { slug: p.slug })}>
                      <span className="ico-chip" style={{ width: 36, height: 36, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={imageForProduct(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </span>
                      <span className="col" style={{ flex: 1, minWidth: 0, gap: 1 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.brand && p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name.slice(p.brand.length).trim() : p.name}
                        </span>
                        {reg && <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-4)' }}>Reg. <span style={{ textDecoration: 'line-through' }}>{fmtPrice(reg, country)}</span></span>}
                      </span>
                      <span className="col" style={{ alignItems: 'flex-end', flexShrink: 0, gap: 1 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13.5, color: 'var(--brand-deep)' }}>{fmtPrice(price, country)}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, fontWeight: 600, color: 'var(--up)' }}>−{Math.round(save * 100)}%</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// BASKET / DASHBOARD lite
// ============================================================
function BasketPage() {
  const { country, navigate } = useApp();
  const c = COUNTRIES[country];
  const basket = MY_BASKET_DEFAULT.map(b => ({ ...b, p: findProduct(b.slug) })).filter(b => b.p && priceOf(b.p, country));
  const total = basket.reduce((s, b) => s + priceOf(b.p, country) * b.qty, 0);

  return (
    <main className="fade-in">
      <div className="container" style={{ padding: '20px 0 64px' }}>
        <Breadcrumb trail={[{ label: 'Home', route: 'home' }, { label: 'Shopping list' }]} />

        <div className="row between" style={{ marginTop: 24, alignItems: 'flex-end' }}>
          <div>
            <h1 className="page-title row gap-3" style={{ fontSize: 40, alignItems: 'center' }}><Icon name="cart" size={28} /> My shopping list</h1>
            <p style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 8, maxWidth: 580, lineHeight: 1.55 }}>
              Everything you plan to buy this week. We price the whole list at every store and show where it's cheapest overall — so you know exactly where to shop.
              {' '}<span style={{ color: 'var(--ink-3)' }}>{basket.length} items · cheapest total <strong style={{ color: 'var(--ink-2)' }}>{fmtPrice(total, country)}</strong></span>
            </p>
            <p className="row gap-2" style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 10, alignItems: 'center' }}>
              <Icon name="info" size={13} />
              <span>Just keeping an eye on a price? Add it to your <a onClick={() => navigate('watchlist')} style={{ color: 'var(--brand)', fontWeight: 600, cursor: 'pointer' }}>Watchlist</a> instead — that's for tracking and alerts, not buying now.</span>
            </p>
          </div>
          <div className="row gap-2">
            <button className="btn"><Icon name="share" size={14} /> Share</button>
            <button className="btn primary" onClick={() => navigate('compare')}>Compare across stores →</button>
          </div>
        </div>

        <div className="card no-pad" style={{ marginTop: 28, overflow: 'hidden' }}>
          {basket.map(({ p, qty }, i) => {
            const unit = priceOf(p, country);
            const lineTotal = unit * qty;
            const chain = cheapestChainOf(p, country);
            const reg = p.regular?.[country];
            const saved = reg && reg > unit ? (reg - unit) * qty : 0;
            return (
              <div key={p.slug} className="basket-row" style={{ borderTop: i > 0 ? '1px solid var(--rule)' : 'none' }}
                onClick={() => navigate('product', { slug: p.slug })}>
                <span className="ico-chip" style={{ width: 44, height: 44, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={imageForProduct(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, lineHeight: 1.2 }}>
                    {p.brand && p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name.slice(p.brand.length).trim() : p.name}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
                    {p.brand && <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{p.brand}</span>}
                    {p.brand && p.size && <span style={{ color: 'var(--ink-4)' }}> · </span>}
                    {p.size && <span style={{ color: 'var(--ink-3)' }}>{p.size}</span>}
                  </div>
                </div>
                <div className="qty-stepper" onClick={(e) => e.stopPropagation()}>
                  <button aria-label="Decrease"><Icon name="minus" size={12} /></button>
                  <span>{qty}</span>
                  <button aria-label="Increase"><Icon name="plus" size={12} /></button>
                </div>
                <div className="basket-store">
                  {chain && <StoreChip chain={chain} />}
                </div>
                <div style={{ textAlign: 'right', minWidth: 96 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 15, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmtPrice(lineTotal, country)}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                    {qty} × {fmtPrice(unit, country)}
                  </div>
                  {jamforpris(p, country) && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>{jamforpris(p, country)}</div>}
                </div>
              </div>
            );
          })}
          <div className="row between" style={{ padding: '16px 20px', borderTop: '2px solid var(--ink)', background: 'var(--bg-2)' }}>
            <button className="row gap-2" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand)', fontWeight: 600, fontSize: 13, font: 'inherit' }} onClick={() => navigate('search')}>
              <Icon name="plus" size={15} /> Add another item
            </button>
            <div className="row gap-3" style={{ alignItems: 'baseline' }}>
              <span className="eyebrow">Cheapest total</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmtPrice(total, country)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================================
// SEARCH
// ============================================================
function SearchPage() {
  const { country, navigate } = useApp();
  const c = COUNTRIES[country];
  const [q, setQ] = useStateO('');
  const [filter, setFilter] = useStateO('all');

  const results = ALL_PRODUCTS
    .filter(p => priceOf(p, country))
    .filter(p => filter === 'all' || p.sector === filter)
    .filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.brand || '').toLowerCase().includes(q.toLowerCase()));

  const suggested = ['Mjölk', 'Coffee', 'Diesel', 'Alvedon', 'Bröd', 'Smör'];

  return (
    <main className="fade-in">
      <div className="container" style={{ padding: '20px 0 64px' }}>
        <Breadcrumb trail={[{ label: 'Home', route: 'home' }, { label: 'Search' }]} />

        <div style={{ marginTop: 28, maxWidth: 720 }}>
          <div style={{ position: 'relative' }}>
            <input className="input" autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search anything — milk, coffee, gasoline, Alvedon…"
              style={{ height: 64, fontSize: 20, paddingLeft: 56 }} />
            <span style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}><Icon name="search" size={20} /></span>
          </div>
          <div className="row gap-2" style={{ marginTop: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', alignSelf: 'center', marginRight: 4 }}>Try:</span>
            {suggested.map(s => (
              <button key={s} className="pill" style={{ cursor: 'pointer' }} onClick={() => setQ(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div className="row gap-2" style={{ marginTop: 32 }}>
          <div className="tabs">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All ({ALL_PRODUCTS.length})</button>
            <button className={filter === 'groceries' ? 'active' : ''} onClick={() => setFilter('groceries')}><Icon name="cart" size={13} /> Groceries</button>
            <button className={filter === 'fuel' ? 'active' : ''} onClick={() => setFilter('fuel')}><Icon name="fuel" size={13} /> Fuel</button>
            <button className={filter === 'pharmacy' ? 'active' : ''} onClick={() => setFilter('pharmacy')}><Icon name="pillCapsule" size={13} /> Pharmacy</button>
          </div>
        </div>

        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-2)' }}>
          {results.length} result{results.length !== 1 ? 's' : ''} {q && <>for "<strong>{q}</strong>"</>}
        </div>
        <div className="grid grid-4" style={{ marginTop: 16 }}>
          {results.map(p => <ProductTile key={p.slug} product={p} />)}
        </div>
      </div>
    </main>
  );
}

// ============================================================
// ABOUT
// ============================================================
function AboutPage() {
  return (
    <main className="fade-in">
      <div className="container" style={{ padding: '20px 0 80px', maxWidth: 840 }}>
        <Breadcrumb trail={[{ label: 'Home', route: 'home' }, { label: 'About' }]} />

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <span className="ico-chip" style={{ width: 76, height: 76, margin: '0 auto' }}><Icon name="leaf" size={42} stroke={1.4} /></span>
          <h1 className="page-title" style={{ fontSize: 52, marginTop: 20 }}>
            Honest prices, no gimmicks.
          </h1>
          <p style={{ fontSize: 18, color: 'var(--ink-2)', maxWidth: 600, margin: '20px auto 0', lineHeight: 1.5 }}>
            GroceryView is an independent, ad-free price comparison service for the Nordics. We track real prices from real stores so you can find the best deal in seconds.
          </p>
        </div>

        <div className="grid grid-3" style={{ marginTop: 64, gap: 24 }}>
          {[
            { icon: '✓', title: 'Verified prices', text: 'Every figure comes from an actual source — a flyer, a receipt, or a shelf scan. Never invented.' },
            { icon: '⚖️', title: 'No paid placement', text: 'The cheapest option always comes first. Stores can\'t pay us to show up earlier.' },
            { icon: '🇸🇪🇳🇴🇮🇸', title: 'Built for the Nordics', text: 'Sweden first, then Norway and Iceland. Local prices, local currencies, local chains.' },
          ].map(b => (
            <div key={b.title} className="card col gap-3" style={{ padding: 28 }}>
              {b.title === 'Built for the Nordics'
                ? <span className="row gap-1">{['SE','NO','IS'].map(cc => <Flag key={cc} code={cc} size={16} />)}</span>
                : <span className="ico-chip" style={{ width: 44, height: 44 }}><Icon name={b.title === 'Verified prices' ? 'check' : 'scale'} size={24} /></span>}
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 19 }}>{b.title}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>{b.text}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 64 }}>
          <h2 className="section-title" style={{ fontSize: 30 }}>How we check every price</h2>
          <div className="grid grid-3" style={{ marginTop: 20 }}>
            <div className="card col gap-3">
              <span className="ico-chip" style={{ width: 38, height: 38 }}><Icon name="check" size={20} /></span>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 18 }}>Confirmed</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>Seen at two or more sources and checked within the last 48 hours.</div>
            </div>
            <div className="card col gap-3">
              <span className="ico-chip" style={{ width: 38, height: 38 }}><Icon name="clock" size={20} /></span>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 18 }}>Recent</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>From one reliable source, refreshed at some point this week.</div>
            </div>
            <div className="card col gap-3">
              <span className="ico-chip" style={{ width: 38, height: 38 }}><Icon name="info" size={20} /></span>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 18 }}>Reported</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>An older reading or shared by the community — we always flag it as such.</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 64, padding: 36, background: 'var(--brand-tint)', borderRadius: 'var(--r-lg)', border: '1px solid oklch(86% 0.04 38)', textAlign: 'center' }}>
          <h2 className="section-title">Coverage today</h2>
          <div className="grid grid-4" style={{ marginTop: 24 }}>
            <div><div style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand-deep)' }}>5 500</div><div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Products tracked</div></div>
            <div><div style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand-deep)' }}>86</div><div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Stores covered</div></div>
            <div><div style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand-deep)' }}>3</div><div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Countries</div></div>
            <div><div style={{ fontSize: 40, fontWeight: 800, color: 'var(--brand-deep)' }}>~5 800</div><div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Daily price observations</div></div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Aliases for fuel/pharmacy
const FuelPage = function() {
  const { setSector } = useApp();
  React.useEffect(() => { setSector('fuel'); }, []);
  return <HomePage />;
};
const PharmacyPage = function() {
  const { setSector } = useApp();
  React.useEffect(() => { setSector('pharmacy'); }, []);
  return <HomePage />;
};

Object.assign(window, {
  ComparePage, DealsPage, MapPage, StorePage, CategoryPage,
  WatchlistPage, BasketPage, SearchPage, AboutPage, FuelPage, PharmacyPage,
});
