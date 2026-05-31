/* GroceryView v3 — HOME PAGE.
   Bloomberg-Scandi. Live ticker, editorial serif hero, animated counters,
   market board, three-sector summary, top movers, stores near you. */

const { useState: useStateH, useEffect: useEffectH, useMemo: useMemoH, useRef: useRefH } = React;

// ============ LIVE TICKER ============
function LiveTicker() {
  const { country, navigate } = useApp();
  const items = useMemoH(() => {
    const all = [
      ...GROCERY_PRODUCTS.slice(0, 8),
      ...FUEL_PRODUCTS,
      ...PHARMACY_PRODUCTS.slice(0, 4),
    ].filter(p => priceOf(p, country) != null);
    return all.map(p => {
      const trend = p.sparkline[p.sparkline.length - 1] - p.sparkline[0];
      const pct = (trend / p.sparkline[0]) * 100;
      const shortName = p.name.split(' ').slice(0, 2).join(' ');
      const brandPrefix = p.brand && !shortName.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.brand + ' ' : '';
      return {
        slug: p.slug,
        name: brandPrefix + shortName,
        ticker: p.slug.toUpperCase().replace(/-/g, '').slice(0, 8),
        price: priceOf(p, country),
        pct,
      };
    });
  }, [country]);
  const all = [...items, ...items]; // duplicate for seamless loop
  const c = COUNTRIES[country];
  return (
    <div className="ticker">
      <div className="ticker-inner">
        {all.map((it, i) => (
          <a key={i} className="ticker-item" onClick={() => navigate('product', { slug: it.slug })} style={{ cursor: 'pointer' }}>
            <span className="name">{it.name}</span>
            <span className="value">{c.code === 'IS' ? Math.round(it.price) : it.price.toFixed(2)}</span>
            <span className={it.pct >= 0 ? 'delta-down' : 'delta-up'}>
              {it.pct >= 0 ? '▲' : '▼'}{Math.abs(it.pct).toFixed(2)}%
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ============ ANIMATED COUNTER ============
function Counter({ to, duration = 1200, format = v => v.toLocaleString('sv-SE'), suffix = '' }) {
  const [v, setV] = useStateH(0);
  const startedRef = useRefH(false);
  useEffectH(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let start; const from = 0;
    const tick = (now) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to, duration]);
  return <>{format(v)}{suffix}</>;
}

// ============ LIVE DOT ============
function LiveDot() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
        <span style={{
          position: 'absolute', inset: 0, borderRadius: 100, background: 'var(--up)',
          animation: 'pulse 1.8s ease-out infinite',
        }} />
        <span style={{ position: 'absolute', inset: 0, borderRadius: 100, background: 'var(--up)' }} />
      </span>
    </span>
  );
}

// ============ WATCHLIST GLANCE (home) ============
function WatchlistGlance({ country, navigate }) {
  const watchSlugs = ['zoegas-coffee-450g', 'olaplex-no3-100', 'alvedon-500mg-20', 'cerave-moisturising-cream-340', 'bregott-normalsaltat-600g'];
  const items = watchSlugs.map(findProduct).filter(p => p && priceOf(p, country) != null).map((p, i) => {
    const price = priceOf(p, country);
    const tr = p.sparkline ? ((p.sparkline[p.sparkline.length - 1] - p.sparkline[0]) / p.sparkline[0]) * 100 : 0;
    const target = Math.round(price * (0.9 + i * 0.012));
    const hit = price <= target;
    const low = p.low52 && p.low52[country], high = p.high52 && p.high52[country];
    const pos = (low != null && high != null && high > low) ? (price - low) / (high - low) : 0.5;
    return { p, price, tr, target, hit, pos };
  }).filter(Boolean);
  return (
    <div>
      <div className="row between" style={{ marginBottom: 18, alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">— Your watchlist</div>
          <h2 className="section-title" style={{ marginTop: 6 }}>Items you're <em>tracking</em></h2>
          <p className="page-sub" style={{ marginTop: 6, fontSize: 13 }}>Live prices and 7-day moves for everything you watch — no clicking through. Tap an item for history, or manage the full list.</p>
        </div>
        <button className="btn sm" onClick={() => navigate('watchlist')}><Icon name="heart" size={13} /> Manage watchlist</button>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        {items.map(({ p, price, tr, target, hit, pos }) => {
          const down = tr < 0;
          const col = down ? 'var(--up)' : 'var(--down)';
          const name = p.brand && p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name.slice(p.brand.length).trim() : p.name;
          const verdict = hit ? { l: 'Target hit', c: 'var(--brand)' }
            : pos < 0.28 ? { l: 'Great price', c: 'var(--up)' }
            : pos < 0.62 ? { l: 'Fair price', c: 'var(--ink-3)' }
            : { l: 'Above usual', c: 'var(--down)' };
          return (
            <button key={p.slug} className="card col gap-3" onClick={() => navigate('product', { slug: p.slug })}
              style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', borderColor: hit ? 'var(--brand)' : 'var(--rule)', background: hit ? 'var(--brand-tint)' : 'var(--surface)' }}>
              <div className="row between" style={{ alignItems: 'flex-start' }}>
                <span className="ico-chip" style={{ width: 38, height: 38, overflow: 'hidden' }}>
                  <img src={imageForProduct(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </span>
                <span className="pill" style={{ color: verdict.c, borderColor: 'currentColor', background: 'transparent', fontWeight: 600, fontSize: 10 }}>{verdict.l}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 15, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.brand && <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{p.brand}</span>}
                  {p.brand && p.size && ' · '}{p.size}
                </div>
              </div>
              <div className="row between" style={{ alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 17, color: hit ? 'var(--brand-deep)' : 'var(--ink)' }}>{fmtPrice(price, country)}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: col, marginTop: 1 }}>{tr >= 0 ? '▲' : '▼'} {Math.abs(tr).toFixed(1)}% <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}>7d</span></div>
                </div>
                <Sparkline values={p.sparkline} w={58} h={24} color={col} fill={false} />
              </div>
              <div className="row between" style={{ paddingTop: 8, borderTop: '1px solid var(--rule)', fontFamily: 'var(--mono)', fontSize: 10.5 }}>
                <span style={{ color: 'var(--ink-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Target</span>
                <span style={{ fontWeight: 600, color: hit ? 'var(--brand)' : 'var(--ink-2)' }}>{fmtPrice(target, country)}{!hit && <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}> · {Math.round((price / target - 1) * 100)}% to go</span>}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============ PAGE ============
function HomePage() {
  const { country, sector, setSector, navigate, municipality, overview } = useApp();
  const c = COUNTRIES[country];
  const [snapSel, setSnapSel] = useStateH(0);

  // Keep the hero snapshot in sync with the selected sector (and vice-versa)
  const SECTOR_TO_IDX = { groceries: 0, fuel: 1, pharmacy: 2, beauty: 3 };
  const IDX_TO_SECTOR = { 0: 'groceries', 1: 'fuel', 2: 'pharmacy', 3: 'beauty' };
  useEffectH(() => { setSnapSel(SECTOR_TO_IDX[sector] ?? 0); }, [sector]);
  const selectSnap = (i) => { setSnapSel(i); if (IDX_TO_SECTOR[i] && IDX_TO_SECTOR[i] !== sector) setSector(IDX_TO_SECTOR[i]); };

  // Lock the breakdown list height to the snapshot card's bottom (fixed 1440 width)
  useEffectH(() => {
    const updateFade = () => {
      const scroll = document.querySelector('.gv-scroll');
      const fade = document.querySelector('.gv-scroll-fade');
      if (!scroll || !fade) return;
      const more = scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop;
      fade.style.opacity = more > 6 ? '1' : '0';
    };
    const fit = () => {
      const card = document.querySelector('[data-snapshot-card]');
      const scroll = document.querySelector('.gv-scroll');
      if (!card || !scroll) return;
      const h = Math.round(card.getBoundingClientRect().bottom - scroll.getBoundingClientRect().top);
      if (h > 90) scroll.style.height = h + 'px';
      updateFade();
    };
    const raf = requestAnimationFrame(fit);
    const t1 = setTimeout(fit, 250), t2 = setTimeout(fit, 700);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    window.addEventListener('resize', fit);
    const scroll = document.querySelector('.gv-scroll');
    if (scroll) scroll.addEventListener('scroll', updateFade);
    return () => {
      cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener('resize', fit);
      if (scroll) scroll.removeEventListener('scroll', updateFade);
    };
  }, [snapSel, country, municipality]);

  return (
    <main className="fade-in">
      <style>{`
        @keyframes pulse { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(2.6); opacity: 0; } }
      `}</style>

      {(!overview && sector === 'beauty') ? (
        <BeautyHome country={country} navigate={navigate} municipality={municipality} />
      ) : (!overview && sector === 'fuel') ? (
        <FuelHome country={country} navigate={navigate} municipality={municipality} />
      ) : (!overview && sector === 'pharmacy') ? (
        <PharmacyHome country={country} navigate={navigate} municipality={municipality} />
      ) : (!overview && sector === 'groceries') ? (
        <GroceryHome country={country} navigate={navigate} municipality={municipality} />
      ) : (
      <React.Fragment>
      {/* LIVE TICKER */}
      <LiveTicker />

      {/* ============ EDITORIAL HERO ============ */}
      <section style={{ background: 'var(--bg)' }}>
        <div className="container" style={{ paddingTop: 24 }}>
          <PromoBanner icon="flame" tag="Today" hue="38">
            <strong>Grocery prices are down 5.2% year-on-year</strong> — and 47% of staples are cheaper at a different chain than your usual.
          </PromoBanner>
        </div>
        <div className="container" style={{ padding: '28px 0 40px' }}>
          <div className="row between" style={{ marginBottom: 28, alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
              <span className="eyebrow">— GroceryView · The Nordic Pricewatch</span>
              <span className="row gap-2 eyebrow" style={{ color: 'var(--up)' }}><LiveDot /> LIVE · UPDATED 3 MIN AGO</span>
            </div>
            <div className="eyebrow">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}</div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 56, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
              <h1 className="page-title" style={{ fontSize: 'clamp(38px, 4.4vw, 58px)', lineHeight: 1.04 }}>
                The Nordic <em>price index</em>
              </h1>
              <p style={{ fontSize: 17, color: 'var(--ink-2)', maxWidth: 480, marginTop: 20, lineHeight: 1.6 }}>
                Groceries, fuel, pharmacy and beauty — tracked daily across Stockholm, Oslo and Reykjavík.
              </p>
              <div className="row" style={{ marginTop: 30, alignItems: 'center', flexWrap: 'wrap', gap: 28 }}>
                <div className="col" style={{ gap: 5 }}>
                  <span className="eyebrow" style={{ whiteSpace: 'nowrap' }}>Products tracked</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>5 500</span>
                </div>
                <div style={{ width: 1, height: 38, background: 'var(--rule-strong)' }} />
                <div className="col" style={{ gap: 5 }}>
                  <span className="eyebrow" style={{ whiteSpace: 'nowrap' }}>Stores</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>86</span>
                </div>
                <div style={{ width: 1, height: 38, background: 'var(--rule-strong)' }} />
                <div className="col" style={{ gap: 5 }}>
                  <span className="eyebrow" style={{ whiteSpace: 'nowrap' }}>Updated</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em' }}>Daily</span>
                </div>
              </div>
              <div className="row gap-3" style={{ marginTop: 28 }}>
                <button className="btn lg primary" onClick={() => navigate('compare')}>Compare your basket</button>
                <button className="btn lg ghost" onClick={() => navigate('browse')}>Browse all 5 500 products →</button>
              </div>
              <HeroBreakdown country={country} navigate={navigate} sel={snapSel} overview={overview} />
            </div>

            {/* QUICK MARKET SUMMARY */}
            <div className="card no-pad" data-snapshot-card style={{ background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
              <div className="row between" style={{ padding: '14px 18px', borderBottom: '1px solid var(--rule)' }}>
            <span className="eyebrow row gap-2" style={{ alignItems: 'center' }}><Flag code={c.code} size={13} /> {municipality} — Today's snapshot</span>
                <button className="btn ghost sm" onClick={() => navigate('dashboard')}>FULL DATA →</button>
              </div>
              <MarketSnapshot country={country} municipality={municipality} navigate={navigate} sel={snapSel} setSel={selectSnap} />
            </div>
          </div>
        </div>
      </section>

      {/* ============ MASTHEAD RULE ============ */}
      <div className="container"><div className="hero-rule"></div></div>

      {/* ============ SECTOR CONTENT ============ */}
      {/* ============ GROCERY CONTENT (Mat tab only — the cross-domain overview omits it) ============ */}

      {/* ============ WATCHLIST GLANCE ============ */}
      <section style={{ background: 'var(--bg)', borderTop: '1px solid var(--rule)', padding: '40px 0 8px' }}>
        <div className="container">
          <WatchlistGlance country={country} navigate={navigate} />
        </div>
      </section>

      {/* ============ CLOSING: NORDEN + PROMISE (one band) ============ */}
      <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--rule)', padding: '56px 0 72px' }}>
        <div className="container">
          <NordicStrip />
          <div style={{ marginTop: 64 }}>
            <EditorialPromise navigate={navigate} />
          </div>
        </div>
      </section>
      </React.Fragment>
      )}
    </main>
  );
}

// ============ MARKET SNAPSHOT ============
function MarketSnapshot({ country, municipality, navigate, sel, setSel }) {
  const c = COUNTRIES[country];
  const mi = municipalityInfo(country, municipality);
  const baseBasket = c.code === 'IS' ? 24890 : c.code === 'NO' ? 2156 : 1198;
  const basketShape = [1.026,1.024,1.021,1.019,1.016,1.014,1.012,1.010,1.008,1.007,1.006,1.005,1.004,1.0035,1.003,1.0025,1.002,1.0015,1.001,1.0008,1.0005,1.0003,1.0001,1.0];
  const items = [
    { label: 'Grocery index', value: 94.8, delta: -5.2, indexed: true,
      series: [102.9,102.6,102.2,101.9,101.5,101.1,100.8,100.4,100.1,99.6,99.0,98.5,98.0,97.4,96.9,96.3,95.9,95.5,95.2,95.0,94.9,94.8,94.8,94.8],
      caption: 'Everyday groceries are 5.2% cheaper than a year ago.',
      info: 'Tracks a fixed basket of everyday groceries against a year ago. 100 = baseline; below 100 means it is cheaper than last year.' },
    { label: 'Fuel index', value: 96.7, delta: -3.3, indexed: true,
      series: [101.4,101.2,100.9,100.6,100.3,100.1,99.8,99.4,99.0,98.6,98.2,97.9,97.6,97.3,97.1,96.9,96.8,96.7,96.7,96.6,96.6,96.7,96.7,96.7],
      caption: 'Pump prices are 3.3% lower than a year ago.',
      info: 'Average pump price across stations near you vs the yearly baseline of 100. Lower means fuel is cheaper than usual.' },
    { label: 'Pharmacy index', value: 102.7, delta: +2.7, indexed: true,
      series: [99.1,99.3,99.5,99.7,99.9,100.1,100.3,100.6,100.9,101.2,101.5,101.8,102.0,102.2,102.4,102.5,102.6,102.7,102.7,102.6,102.7,102.7,102.7,102.7],
      caption: 'Over-the-counter medicine is 2.7% pricier than a year ago.',
      info: 'Common over-the-counter medicines priced against a 100 baseline. Above 100 means these prices have risen.' },
    { label: 'Beauty index', value: 98.4, delta: -1.6, indexed: true,
      series: [101.2,101.0,100.8,100.6,100.3,100.1,99.9,99.7,99.5,99.3,99.1,98.9,98.8,98.7,98.6,98.6,98.5,98.5,98.4,98.4,98.4,98.4,98.4,98.4],
      caption: 'Skincare, makeup and haircare are 1.6% cheaper than a year ago.',
      info: 'Tracks a fixed set of skincare, makeup, haircare and fragrance against a year ago. 100 = baseline; below 100 means cheaper than last year.' },
    { label: 'Avg basket cost', value: Math.round(baseBasket * mi.index), delta: -2.4, indexed: false,
      format: v => v.toLocaleString(c.locale) + ' ' + c.currency,
      series: basketShape.map(s => Math.round(baseBasket * mi.index * s)),
      caption: `What a typical weekly basket costs in ${municipality} — down 2.4% this month.`,
      info: `What a typical weekly basket costs at the cheapest chain in ${municipality} right now.` },
  ];
  const [selLocal, setSelLocal] = useStateH(0);
  const selIdx = sel != null ? sel : selLocal;
  const setSelIdx = setSel || setSelLocal;
  const s = items[selIdx];
  const up = s.delta < 0;
  const col = up ? 'var(--up)' : 'var(--down)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Featured readout */}
      <div style={{ padding: '15px 18px 4px' }}>
        <div className="row gap-2" style={{ alignItems: 'center' }}>
          <span className="eyebrow">{s.label}{s.indexed ? ' · index vs a year ago' : ` · ${municipality}`}</span>
          <InfoTip text={s.info} align="right" />
        </div>
        <div className="row gap-3" style={{ alignItems: 'baseline', marginTop: 6 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {s.format ? s.format(s.value) : s.value.toFixed(1)}
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: col }}>
            {s.delta >= 0 ? '▲' : '▼'} {Math.abs(s.delta).toFixed(1)}%
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 5, lineHeight: 1.45 }}>{s.caption}</div>
      </div>
      {/* Featured chart */}
      <div style={{ padding: '4px 8px 8px' }}>
        <FeaturedIndexChart series={s.series} color={col} indexed={s.indexed}
          fmt={v => s.format ? s.format(Math.round(v)) : v.toFixed(1)} />
      </div>
      {/* Index selector rows */}
      <div style={{ borderTop: '1px solid var(--rule)' }}>
        {items.map((it, i) => {
          const iu = it.delta < 0;
          const ic = iu ? 'var(--up)' : 'var(--down)';
          const active = i === selIdx;
          return (
            <button key={i} onClick={() => setSelIdx(i)} style={{
              display: 'grid', gridTemplateColumns: '1fr 64px auto 64px', alignItems: 'center', gap: 10,
              width: '100%', textAlign: 'left', cursor: 'pointer', font: 'inherit',
              padding: '9px 18px 9px 15px',
              borderBottom: i < items.length - 1 ? '1px solid var(--rule)' : 'none',
              borderLeft: `3px solid ${active ? col : 'transparent'}`,
              background: active ? 'var(--bg-2)' : 'transparent',
            }}>
              <span style={{ fontWeight: active ? 600 : 500, fontSize: 13 }}>{it.label}</span>
              <Sparkline values={it.series} w={60} h={20} color={ic} strokeWidth={1.5} fill={false} showDot={false} />
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 13, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                {it.format ? it.format(it.value) : it.value.toFixed(1)}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 600, color: ic, textAlign: 'right' }}>
                {it.delta >= 0 ? '▲' : '▼'} {Math.abs(it.delta).toFixed(1)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============ HERO BREAKDOWN (left column, mirrors snapshot selection) ============
function HeroBreakdown({ country, navigate, sel, overview }) {
  const c = COUNTRIES[country];
  const trendOf = (p) => p.sparkline ? ((p.sparkline[p.sparkline.length - 1] - p.sparkline[0]) / p.sparkline[0]) * 100 : 0;

  let eyebrow, hint, rows;
  if (overview) {
    eyebrow = 'Explore by domain';
    hint = 'How each market is moving vs a year ago. Tap to dive in.';
    rows = [
      { label: 'Groceries', sub: 'Mat',       sector: 'groceries', icon: 'cart',        value: '94.8',  delta: -5.2 },
      { label: 'Fuel',      sub: 'Drivmedel',  sector: 'fuel',      icon: 'fuel',        value: '96.7',  delta: -3.3 },
      { label: 'Pharmacy',  sub: 'Apotek',     sector: 'pharmacy',  icon: 'pillCapsule', value: '102.7', delta:  2.7 },
      { label: 'Beauty',    sub: 'Skönhet',    sector: 'beauty',    icon: 'lipstick',    value: '98.4',  delta: -1.6 },
    ].map(r => ({ ...r, onClick: () => navigate('home', { sector: r.sector }) }));
  } else if (sel === 1) {
    eyebrow = 'Fuel index · by grade';
    hint = 'Average pump price per grade near you.';
    rows = FUEL_PRODUCTS.filter(p => priceOf(p, country) != null).map(p => ({
      label: p.name, icon: iconForProduct(p), value: jamforpris(p, country) || fmtPrice(priceOf(p, country), country),
      delta: trendOf(p), onClick: () => navigate('product', { slug: p.slug }),
    }));
  } else if (sel === 2) {
    eyebrow = 'Pharmacy index · by category';
    hint = 'Over-the-counter prices vs a year ago (100 = baseline).';
    rows = [
      { label: 'Cold & flu', icon: 'pillCapsule', value: '104.2', delta: 4.6 },
      { label: 'Pain relief', icon: 'pillCapsule', value: '103.1', delta: 3.4 },
      { label: 'Allergy', icon: 'leaf', value: '102.5', delta: 2.5 },
      { label: 'Vitamins & supplements', icon: 'sun', value: '101.8', delta: 1.9 },
      { label: 'Digestion & gut', icon: 'droplet', value: '101.2', delta: 1.2 },
      { label: 'Skin & body care', icon: 'droplet', value: '100.9', delta: 0.9 },
      { label: 'Oral care', icon: 'tooth', value: '100.6', delta: 0.4 },
      { label: 'First aid', icon: 'plus', value: '100.5', delta: 0.5 },
      { label: 'Eye & ear care', icon: 'eye', value: '99.8', delta: -0.2 },
      { label: 'Baby & child', icon: 'heart', value: '99.4', delta: -0.6 },
    ].map(r => ({ ...r, onClick: () => navigate('browse') }));
  } else if (sel === 3) {
    eyebrow = 'Beauty index · by category';
    hint = 'Skincare, makeup, haircare and fragrance vs a year ago (100 = baseline).';
    rows = [
      { label: 'Skincare', slug: 'skincare', value: '97.2', delta: -2.8 },
      { label: 'Makeup', slug: 'makeup', value: '98.6', delta: -1.4 },
      { label: 'Haircare', slug: 'haircare', value: '96.5', delta: -3.5 },
      { label: 'Bath & body', slug: 'bodycare', value: '99.1', delta: -0.9 },
      { label: 'Fragrance', slug: 'fragrance', value: '101.4', delta: 1.4 },
    ].map(r => ({ ...r, icon: iconForCategory(r.slug), onClick: () => navigate('category', { slug: r.slug }) }));
  } else if (sel === 4) {
    eyebrow = 'Avg basket · cheapest stores';
    hint = 'Where our standard basket costs least near you.';
    rows = STORES.filter(s => s.country === country).sort((a, b) => a.basketCost - b.basketCost).slice(0, 8).map(s => ({
      label: s.name, sub: `${s.district} · ${s.distance} km`, swatch: CHAINS[s.chain],
      value: `${s.basketCost.toLocaleString(c.locale)} ${c.currency}`,
      deltaText: `${s.basketDiff < 0 ? '−' : '+'}${Math.abs(s.basketDiff).toLocaleString(c.locale)} ${c.currency}`,
      deltaGood: s.basketDiff < 0, onClick: () => navigate('store', { slug: s.slug }),
    }));
  } else {
    eyebrow = 'Grocery index · by category';
    hint = 'Each category vs a year ago (100 = baseline).';
    rows = [
      { label: 'Fruit & veg', slug: 'produce', value: '91.0', delta: -7.8 },
      { label: 'Dairy & eggs', slug: 'dairy', value: '92.4', delta: -6.1 },
      { label: 'Pantry', slug: 'pantry', value: '95.5', delta: -4.0 },
      { label: 'Bread & bakery', slug: 'bread', value: '96.1', delta: -3.2 },
      { label: 'Frozen', slug: 'frozen', value: '97.2', delta: -2.1 },
      { label: 'Fish & seafood', slug: 'fish', value: '97.9', delta: -2.0 },
      { label: 'Meat', slug: 'meat', value: '98.7', delta: -1.4 },
      { label: 'Plant-based', slug: 'plant-based', value: '98.1', delta: -1.2 },
      { label: 'Snacks', slug: 'snacks', value: '99.4', delta: -0.6 },
      { label: 'Drinks', slug: 'beverages', value: '100.8', delta: 0.8 },
      { label: 'Coffee & tea', slug: 'coffee', value: '105.2', delta: 5.4 },
    ].map(r => ({ ...r, icon: iconForCategory(r.slug), onClick: () => navigate('category', { slug: r.slug }) }));
  }

  return (
    <div style={{ marginTop: 20, borderTop: '1px solid var(--rule)', paddingTop: 16 }}>
      <div className="row between" style={{ alignItems: 'center' }}>
        <span className="row gap-2" style={{ alignItems: 'center' }}>
          <span className="eyebrow">{eyebrow}</span>
          <InfoTip text={hint} />
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.04em' }}>{rows.length} ITEMS</span>
      </div>
      <div style={{ position: 'relative', marginTop: 8 }}>
        <div className="gv-scroll" style={{ overflowY: 'auto', marginRight: -6, paddingRight: 6 }}>
        {rows.map((r, i) => {
          const num = typeof r.delta === 'number';
          const good = num ? r.delta < 0 : r.deltaGood;
          const col = good ? 'var(--up)' : 'var(--down)';
          return (
            <button key={i} onClick={r.onClick} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer', background: 'transparent',
              border: 'none', borderTop: i > 0 ? '1px solid var(--rule)' : 'none', padding: '0',
              minHeight: 38,
            }}>
              <span className="row gap-3" style={{ alignItems: 'center', minWidth: 0, flex: 1 }}>
                {r.swatch ? <ChainSwatch chain={r.swatch} size={22} />
                  : r.icon ? <span className="ico-chip" style={{ width: 30, height: 30 }}><Icon name={r.icon} size={16} /></span> : null}
                <span className="col" style={{ gap: 0, minWidth: 0 }}>
                  <span style={{ fontWeight: 500, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
                  {r.sub && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>{r.sub}</span>}
                </span>
              </span>
              <span className="row gap-3" style={{ alignItems: 'baseline', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 13, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{r.value}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: col, minWidth: 58, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {num ? `${r.delta >= 0 ? '▲' : '▼'} ${Math.abs(r.delta).toFixed(1)}%` : r.deltaText}
                </span>
              </span>
            </button>
          );
        })}
        </div>
        <div className="gv-scroll-fade" aria-hidden="true"></div>
      </div>
    </div>
  );
}

// ============ FEATURED INDEX CHART ============
function FeaturedIndexChart({ series, color, indexed, fmt }) {
  const W = 480, H = 250, padL = 10, padR = 54, padT = 18, padB = 30;
  const n = series.length;
  const rawLo = Math.min(...series), rawHi = Math.max(...series);
  let lo = indexed ? Math.min(rawLo, 100) : rawLo;
  let hi = indexed ? Math.max(rawHi, 100) : rawHi;
  const padR2 = (hi - lo) * 0.2 || 1;
  lo -= padR2; hi += padR2;
  const x = i => padL + (i / (n - 1)) * (W - padL - padR);
  const y = v => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const line = series.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(n - 1).toFixed(1)} ${(H - padB).toFixed(1)} L${padL.toFixed(1)} ${(H - padB).toFixed(1)} Z`;
  const cur = series[n - 1], curX = x(n - 1), curY = y(cur);
  const months = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
  const gid = 'fg-' + color.replace(/[^a-z]/gi, '');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {indexed && (
        <g>
          <line x1={padL} y1={y(100)} x2={W - padR} y2={y(100)} stroke="var(--rule-strong)" strokeDasharray="3 3" strokeWidth="1" />
          <text x={W - padR + 5} y={y(100) + 3} fontFamily="var(--mono)" fontSize="9.5" fill="var(--ink-4)">100</text>
        </g>
      )}
      <line x1={padL} y1={y(rawHi)} x2={W - padR} y2={y(rawHi)} stroke="var(--rule)" strokeWidth="1" />
      <text x={W - padR + 5} y={y(rawHi) + 3} fontFamily="var(--mono)" fontSize="9.5" fill="var(--ink-3)">{fmt(rawHi)}</text>
      <line x1={padL} y1={y(rawLo)} x2={W - padR} y2={y(rawLo)} stroke="var(--rule)" strokeWidth="1" />
      <text x={W - padR + 5} y={y(rawLo) + 3} fontFamily="var(--mono)" fontSize="9.5" fill="var(--ink-3)">{fmt(rawLo)}</text>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <line x1={curX} y1={padT} x2={curX} y2={H - padB} stroke={color} strokeOpacity="0.25" strokeWidth="1" />
      <circle cx={curX} cy={curY} r="6.5" fill={color} fillOpacity="0.16" />
      <circle cx={curX} cy={curY} r="3.5" fill={color} />
      {months.map((m, i) => (
        <text key={m} x={padL + (i / (months.length - 1)) * (W - padL - padR)} y={H - 12}
          fontFamily="var(--mono)" fontSize="9.5" fill="var(--ink-4)"
          textAnchor={i === 0 ? 'start' : i === months.length - 1 ? 'end' : 'middle'}>{m}</text>
      ))}
    </svg>
  );
}

// ============ SECTOR BOARD ============
function SectorBoard({ country, sector, setSector, navigate }) {
  const items = [
    { id: 'groceries', name: 'Groceries', subname: 'Mat',         icon: 'cart', stats: { items: '3 420', stores: '43', save: '−12%' } },
    { id: 'fuel',      name: 'Fuel',      subname: 'Drivmedel',    icon: 'fuel', stats: { items: '4 grades', stores: '38', save: '−4%' } },
    { id: 'pharmacy',  name: 'Pharmacy',  subname: 'Apotek',       icon: 'pillCapsule', stats: { items: '820', stores: '14', save: '−18%' } },
    { id: 'beauty',    name: 'Beauty',    subname: 'Skönhet',      icon: 'lipstick', stats: { items: '1 260', stores: '22', save: '−24%' } },
  ];
  return (
    <div className="grid grid-4" style={{ gap: 0, borderBottom: '1px solid var(--rule-strong)' }}>
      {items.map((it, i) => (
        <button key={it.id} className="col" onClick={() => setSector(it.id)} style={{
          textAlign: 'left',
          padding: '24px 28px',
          background: sector === it.id ? 'var(--ink)' : 'transparent',
          color: sector === it.id ? 'var(--bg)' : 'var(--ink)',
          border: 'none',
          borderRight: i < 3 ? '1px solid var(--rule)' : 'none',
          cursor: 'pointer',
          transition: 'background 0.18s',
          gap: 12,
          minHeight: 130,
          position: 'relative',
        }}>
          {sector === it.id && (
            <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--brand)' }} />
          )}
          <div className="row between" style={{ alignItems: 'baseline' }}>
            <div className="row gap-3" style={{ alignItems: 'baseline' }}>
              <span style={{ display: 'inline-flex' }}><Icon name={it.icon} size={28} stroke={1.6} /></span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, letterSpacing: '-0.015em' }}>{it.name}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7, marginTop: 2 }}>{it.subname}</div>
              </div>
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em', opacity: 0.7 }}>{sector === it.id ? 'ACTIVE' : 'VIEW →'}</span>
          </div>
          <div className="row gap-6" style={{ marginTop: 4 }}>
            <BoardStat label="Tracked" value={it.stats.items} dark={sector === it.id} />
            <BoardStat label="Stores" value={it.stats.stores} dark={sector === it.id} />
            <BoardStat label="Best vs avg" value={it.stats.save} dark={sector === it.id} highlight />
          </div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.03em',
            textTransform: 'uppercase', marginTop: -2,
            color: sector === it.id ? 'oklch(72% 0.01 78)' : 'var(--ink-4)',
          }}>
            Cheapest of {it.stats.stores} stores vs their average
          </div>
        </button>
      ))}
    </div>
  );
}

function BoardStat({ label, value, dark, highlight }) {
  return (
    <div className="col">
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em',
        textTransform: 'uppercase', whiteSpace: 'nowrap',
        color: dark ? 'oklch(75% 0.01 78)' : 'var(--ink-3)',
      }}>{label}</span>
      <span style={{
        fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        color: highlight ? (dark ? 'oklch(75% 0.18 38)' : 'var(--brand)') : 'inherit',
      }}>{value}</span>
    </div>
  );
}

// ============ GROCERIES OVERVIEW ============
function GroceriesOverview({ country, navigate }) {
  const c = COUNTRIES[country];
  const { municipality, postcode } = useApp();
  const [preview, setPreview] = useStateH(null);
  const groceryProducts = GROCERY_PRODUCTS.filter(p => priceOf(p, country) != null);
  const onDeal = groceryProducts.filter(p => p.regular?.[country] && priceOf(p, country) < p.regular[country] * 0.85);
  const stores = STORES.filter(s => s.country === country);
  const cheapestBasket = stores.length ? Math.min(...stores.map(s => s.basketCost)) : 0;
  const basketSpread = stores.length ? Math.max(...stores.map(s => s.basketCost)) - cheapestBasket : 0;
  const movers = [...groceryProducts].sort((a, b) => {
    const trA = (a.sparkline[a.sparkline.length-1] - a.sparkline[0]) / a.sparkline[0];
    const trB = (b.sparkline[b.sparkline.length-1] - b.sparkline[0]) / b.sparkline[0];
    return trA - trB;
  }).slice(0, 8);

  return (
    <div className="col" style={{ gap: 56 }}>
      <ProductPreview product={preview} onClose={() => setPreview(null)} />

      {/* FRESH MARKET FEATURE — sets the grocery context */}
      <div className="grid" style={{ gridTemplateColumns: '1.1fr 0.9fr', gap: 28, alignItems: 'stretch' }}>
        <div className="card" style={{ background: 'var(--brand-tint)', borderColor: 'oklch(88% 0.03 38)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 34px' }}>
          <div className="eyebrow" style={{ color: 'var(--brand)' }}>This week's shop · {municipality}</div>
          <h2 className="section-title" style={{ marginTop: 10, fontSize: 30, lineHeight: 1.1 }}>A full weekly basket, <em>from {fmtPrice(cheapestBasket, country)}</em></h2>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.6, maxWidth: 420 }}>
            That's our 20-item staple basket at the cheapest chain near you — <strong>{fmtPrice(basketSpread, country)} less</strong> than the priciest. Build yours and we'll route it to the cheapest aisles.
          </p>
          <div className="row gap-3" style={{ marginTop: 20 }}>
            <button className="btn primary" onClick={() => navigate('compare')}>Compare your basket</button>
            <button className="btn ghost" onClick={() => navigate('map')}>Cheapest stores →</button>
          </div>
          <div className="row" style={{ marginTop: 22, gap: 0 }}>
            {['arla-milk-1l', 'zoegas-coffee-450g', 'pagen-jattefralla-500g', 'bregott-normalsaltat-600g', 'felix-ketchup-1kg'].map((slug, i) => {
              const p = findProduct(slug);
              return p ? (
                <span key={slug} style={{ width: 46, height: 46, borderRadius: 'var(--r-pill)', overflow: 'hidden', border: '2px solid var(--brand-tint)', background: 'var(--surface)', marginLeft: i === 0 ? 0 : -12, boxShadow: '0 1px 4px oklch(0% 0 0 / 0.08)' }}>
                  <img src={imageForProduct(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </span>
              ) : null;
            })}
            <span style={{ marginLeft: 12, alignSelf: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>+ 15 more staples</span>
          </div>
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Fresh aisles</div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['produce', 'Fruit & veg', 'leaf'], ['dairy', 'Dairy & eggs', 'milk'], ['meat', 'Meat & fish', 'meat'], ['bread', 'Bread', 'bread'], ['pantry', 'Pantry', 'can'], ['coffee', 'Coffee & tea', 'coffee']].map(([slug, label, img]) => (
              <button key={slug} onClick={() => navigate('category', { slug })} style={{
                position: 'relative', overflow: 'hidden',
                background: 'var(--surface)', border: '1px solid var(--rule)', borderRadius: 'var(--r-md)',
                cursor: 'pointer', font: 'inherit', textAlign: 'left', padding: 0, height: 84,
              }}>
                <img src={`images/ph-${img}.png`} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.92 }} />
                <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, oklch(20% 0.02 250 / 0.62), transparent 62%)' }}></span>
                <span style={{ position: 'absolute', left: 12, bottom: 10, color: 'white', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 15, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MOVERS BOARD */}
      <div>
        <div className="row between" style={{ marginBottom: 20, alignItems: 'flex-end' }}>
          <div>
            <div className="eyebrow">Movers · 7-day</div>
            <h2 className="section-title" style={{ marginTop: 6 }}>The week's biggest <em>price drops</em></h2>
            <p className="page-sub" style={{ marginTop: 6, fontSize: 13 }}>Where each item is cheapest right now, and whether today's price is actually a good one. Tap a row to see the store, the offer source, and full history.</p>
          </div>
          <div className="row gap-2">
            <button className="btn sm" onClick={() => navigate('deals')}>All deals →</button>
          </div>
        </div>
        <div className="card no-pad">
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Cheapest at</th>
                <th className="num">Best price now</th>
                <th>Price check</th>
                <th className="num">7-day</th>
              </tr>
            </thead>
            <tbody>
              {movers.map(p => {
                const price = priceOf(p, country);
                const tr = ((p.sparkline[p.sparkline.length-1] - p.sparkline[0]) / p.sparkline[0]) * 100;
                const cheapest = cheapestChainOf(p, country);
                const reg = p.regular?.[country];
                const savePct = reg && reg > price ? Math.round((1 - price / reg) * 100) : 0;
                const low = p.low52?.[country], high = p.high52?.[country];
                const pos = (low != null && high != null && high > low) ? (price - low) / (high - low) : 0.5;
                const rating = pos < 0.22 ? { l: 'Great price', c: 'var(--up)', note: 'near its 12-mo low' }
                             : pos < 0.45 ? { l: 'Good price', c: 'var(--save-deep)', note: 'cheaper than usual' }
                             : pos < 0.72 ? { l: 'Fair price', c: 'var(--ink-2)', note: 'about average' }
                             : { l: 'Runs cheaper', c: 'var(--down)', note: 'pricey vs the year' };
                return (
                  <tr key={p.slug} style={{ cursor: 'pointer' }} onClick={() => setPreview(p)}>
                    <td>
                      <div className="row gap-3" style={{ alignItems: 'center' }}>
                        <span className="ico-chip" style={{ width: 34, height: 34, overflow: 'hidden' }}>
                          <img src={imageForProduct(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </span>
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 15 }}>{p.brand && p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name.slice(p.brand.length).trim() : p.name}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>
                            {p.brand && <span style={{ color: 'var(--brand)', fontWeight: 600 }}>{p.brand}</span>}
                            {p.brand && p.size && <span style={{ color: 'var(--ink-4)' }}> · </span>}
                            {p.size && <span style={{ color: 'var(--ink-3)' }}>{p.size}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{cheapest && <StoreChip chain={cheapest} />}</td>
                    <td className="num">
                      <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 15 }}>{fmtPrice(price, country)}</div>
                      {jamforpris(p, country) && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', marginTop: 1 }}>{jamforpris(p, country)}</div>}
                      {savePct > 0 && (
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--up)', marginTop: 1 }}>
                          save {savePct}% · was {fmtPrice(reg, country)}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
                        <span className="pill" style={{ color: rating.c, borderColor: 'currentColor', background: 'transparent', fontWeight: 600, alignSelf: 'flex-start' }}>{rating.l}</span>
                        <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>{rating.note}</span>
                      </span>
                    </td>
                    <td className="num">
                      <div className="row gap-2" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                        <span style={{ color: tr < 0 ? 'var(--up)' : 'var(--down)', fontWeight: 600, fontFamily: 'var(--mono)', fontSize: 12 }}>
                          {tr >= 0 ? '▲' : '▼'} {Math.abs(tr).toFixed(1)}%
                        </span>
                        <Sparkline values={p.sparkline} w={56} h={20} color={tr < 0 ? 'var(--up)' : 'var(--down)'} fill={false} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SPLIT: TODAY'S DEALS + NEAR YOU */}
      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        <div>
          <div className="row between" style={{ marginBottom: 16, alignItems: 'flex-end' }}>
            <div>
              <div className="eyebrow">Today's verified deals</div>
              <h2 className="section-title" style={{ marginTop: 6 }}>On promo right now</h2>
            </div>
            <button className="btn sm ghost" onClick={() => navigate('deals')}>SEE ALL →</button>
          </div>
          <div className="card no-pad">
            {onDeal.slice(0, 5).map((p, i) => {
              const price = priceOf(p, country);
              const reg = p.regular?.[country] || price;
              const save = Math.round((1 - price / reg) * 100);
              const cheapest = cheapestChainOf(p, country);
              return (
                <div key={p.slug} className="deal-row" style={{ borderTop: i > 0 ? '1px solid var(--rule)' : 'none' }}
                  onClick={() => navigate('product', { slug: p.slug })}>
                  <span className="deal-save">−{save}%</span>
                  <span className="ico-chip" style={{ width: 38, height: 38, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={imageForProduct(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>
                      {p.brand && p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name.slice(p.brand.length).trim() : p.name}
                    </div>
                    <div className="row gap-2" style={{ marginTop: 3, alignItems: 'center' }}>
                      {cheapest && <StoreChip chain={cheapest} />}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 15, color: 'var(--brand-deep)' }}>{fmtPrice(price, country)}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textDecoration: 'line-through' }}>{fmtPrice(reg, country)}</div>
                    {jamforpris(p, country) && <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-4)' }}>{jamforpris(p, country)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="row between" style={{ marginBottom: 16, alignItems: 'flex-end' }}>
            <div>
              <div className="eyebrow">Near you · {postcode || municipality}</div>
              <h2 className="section-title" style={{ marginTop: 6 }}>Cheapest stores</h2>
            </div>
            <button className="btn sm ghost" onClick={() => navigate('map')}>MAP →</button>
          </div>
          <CheapestStoresList stores={stores} country={country} navigate={navigate} municipality={municipality} postcode={postcode} />
        </div>
      </div>

      {/* BROWSE BY CATEGORY */}
      <div>
        <div className="row between" style={{ marginBottom: 16, alignItems: 'flex-end' }}>
          <div>
            <div className="eyebrow">Browse</div>
            <h2 className="section-title" style={{ marginTop: 6 }}>By category</h2>
          </div>
          <button className="btn sm ghost" onClick={() => navigate('browse')}>VIEW ALL →</button>
        </div>
        <div className="grid grid-6" style={{ gap: 0, border: '1px solid var(--rule)', borderRadius: 6, overflow: 'hidden' }}>
          {CATEGORIES.slice(0, 12).map((cat, i) => (
            <a key={cat.slug} className="col" onClick={() => navigate('category', { slug: cat.slug })} style={{
              padding: '20px 16px',
              cursor: 'pointer',
              borderRight: (i + 1) % 6 !== 0 ? '1px solid var(--rule)' : 'none',
              borderBottom: i < 6 ? '1px solid var(--rule)' : 'none',
              background: 'var(--surface)',
              transition: 'background 0.12s',
              gap: 4,
              alignItems: 'flex-start',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}>
              <span className="ico-chip" style={{ width: 38, height: 38 }}><Icon name={iconForCategory(cat.slug)} size={20} /></span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, marginTop: 6, lineHeight: 1.2, minHeight: '2.4em' }}>{cat.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>{cat.count} items</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function CheapestStoresList({ stores, country, navigate, municipality, postcode }) {
  const c = COUNTRIES[country];
  const sorted = stores.slice().sort((a, b) => a.basketCost - b.basketCost).slice(0, 6);
  const max = Math.max(...sorted.map(s => s.basketCost));
  const openLocation = () => { const el = document.querySelector('.muni-pill'); if (el) el.click(); };
  return (
    <div className="card no-pad">
      <table className="tbl" style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Store</th>
            <th>Distance</th>
            <th className="num">Basket</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => {
            const ch = CHAINS[s.chain];
            return (
              <tr key={s.slug} style={{ cursor: 'pointer' }} onClick={() => navigate('store', { slug: s.slug })}>
                <td style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--ink-3)' }}>{i + 1}</td>
                <td>
                  <div className="row gap-2" style={{ alignItems: 'center' }}>
                    <ChainSwatch chain={ch} size={22} />
                    <div className="col" style={{ gap: 3 }}>
                      <div style={{ fontWeight: 500, lineHeight: 1.15 }}>{s.name}</div>
                      <div style={{ fontSize: 10, lineHeight: 1.15, color: 'var(--ink-3)', fontFamily: 'var(--mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.district}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{s.distance} km</td>
                <td className="num">
                  <div style={{ fontWeight: 600 }}>{s.basketCost.toLocaleString(c.locale)} {c.currency}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: i === 0 ? 'var(--up)' : 'var(--ink-3)' }}>
                    {i === 0 ? 'CHEAPEST' : `+${Math.round(((s.basketCost - sorted[0].basketCost)/sorted[0].basketCost)*100)}%`}
                  </div>
                </td>
                <td style={{ width: 80 }}>
                  <div className="bar-track" style={{ height: 4 }}>
                    <div className="bar-fill" style={{ width: `${(s.basketCost/max)*100}%`, background: i === 0 ? 'var(--up)' : 'var(--ink-3)' }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="source-note" style={{ margin: 0, padding: '12px 16px', borderTop: '1px solid var(--rule)' }}>
        <Icon name="info" size={13} />
        {postcode
          ? <span>Walking/driving distance from <strong>{postcode}</strong>. Basket = our standard 20-item basket priced at each store today.</span>
          : <span>Distances are estimated from {municipality} centre. <a onClick={openLocation} style={{ cursor: 'pointer', color: 'var(--brand)', fontWeight: 600 }}>Add your postcode</a> for exact distances from your door.</span>}
      </div>
    </div>
  );
}

// ============ FUEL OVERVIEW ============
function FuelOverview({ country, navigate }) {
  const c = COUNTRIES[country];
  const { municipality } = useApp();
  const stationCount = Math.max(6, Math.round(municipalityInfo(country, municipality).stores * 0.6));
  const fuelProducts = FUEL_PRODUCTS.filter(p => priceOf(p, country) != null);
  const stations = Object.entries(FUEL_STATIONS).filter(([, s]) => s.country === country);

  return (
    <div className="col" style={{ gap: 48 }}>
      {/* FUEL TYPE GRID */}
      <div>
        <div className="row between" style={{ marginBottom: 20, alignItems: 'flex-end' }}>
          <div>
            <div className="eyebrow">At the pump · today</div>
            <h2 className="section-title" style={{ marginTop: 6 }}>Fuel <em>by type</em></h2>
          </div>
        </div>
        <div className="grid grid-4">
          {fuelProducts.map(p => <FuelTypeCard key={p.slug} product={p} country={country} navigate={navigate} />)}
        </div>
      </div>

      {/* STATIONS TABLE */}
      <div>
        <div className="row between" style={{ marginBottom: 20, alignItems: 'flex-end' }}>
          <div>
            <div className="eyebrow">Stations · {municipality}</div>
            <h2 className="section-title" style={{ marginTop: 6 }}>Cheapest at the pump <em>right now</em></h2>
          </div>
          <button className="btn sm" onClick={() => navigate('map')}>MAP →</button>
        </div>
        <div className="card no-pad">
          <table className="tbl">
            <thead>
              <tr>
                <th>Station</th>
                <th>Chain</th>
                <th>Distance</th>
                <th className="num">Bensin 95</th>
                <th className="num">Diesel</th>
                <th className="num">El (kr/kWh)</th>
                <th className="num">vs avg</th>
              </tr>
            </thead>
            <tbody>
              {stations.map(([slug, s], i) => {
                const ch = CHAINS[s.chain];
                const basePetrol = priceOf(FUEL_PRODUCTS[0], country);
                const stationPetrol = basePetrol + ((slug.charCodeAt(0) + slug.charCodeAt(1)) % 70) / 100 - 0.35;
                const stationDiesel = priceOf(FUEL_PRODUCTS[1], country) + ((slug.charCodeAt(2) % 70)) / 100 - 0.4;
                const stationEl = priceOf(FUEL_PRODUCTS[2], country) + ((slug.charCodeAt(3) % 60)) / 100 - 0.3;
                const vs = ((stationPetrol - basePetrol) / basePetrol) * 100;
                return (
                  <tr key={slug} className={i === 0 ? 'best' : ''} style={{ cursor: 'pointer' }}>
                    <td><strong>{s.name}</strong></td>
                    <td><StoreChip chain={ch} /></td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{s.distance.toFixed(1)} km</td>
                    <td className="num"><strong style={{ fontSize: 15 }}>{fmtPrice(stationPetrol, country)}</strong></td>
                    <td className="num">{fmtPrice(stationDiesel, country)}</td>
                    <td className="num">{fmtPrice(stationEl, country)}</td>
                    <td className="num">
                      <span style={{ color: vs <= 0 ? 'var(--up)' : 'var(--down)', fontWeight: 600 }}>
                        {vs >= 0 ? '+' : ''}{vs.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TREND */}
      <div>
        <div className="row between" style={{ marginBottom: 20, alignItems: 'flex-end' }}>
          <div>
            <div className="eyebrow">Trend</div>
            <h2 className="section-title" style={{ marginTop: 6 }}>Bensin 95 — <em>last 90 days</em></h2>
            <p className="page-sub" style={{ marginTop: 6, fontSize: 13 }}>
              Median pump price across {stationCount} stations we track in {municipality} — not a single forecourt.
            </p>
          </div>
        </div>
        <div className="card">
          <PriceChart
            data={PRICE_HISTORY_LONG.slice(-90).map(d => ({
              date: d.date,
              price: (d.price / 72) * priceOf(FUEL_PRODUCTS[0], country),
            }))}
            w={1340} h={300}
            color="var(--brand)"
            currentMark={priceOf(FUEL_PRODUCTS[0], country)}
            marketBands={true}
          />
          <div className="source-note">
            <Icon name="info" size={13} />
            <span>Source: GroceryView fuel panel — daily median of {stationCount} monitored stations across {municipality}. Individual forecourts vary; see the station table above for live per-station prices.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FuelTypeCard({ product, country, navigate }) {
  const price = priceOf(product, country);
  const low = product.low52[country];
  const high = product.high52[country];
  const pct = ((price - low) / (high - low)) * 100;
  const verdict = pct < 35 ? { txt: 'Cheap', color: 'var(--up)' } :
                   pct < 65 ? { txt: 'Typical', color: 'var(--ink-2)' } :
                              { txt: 'Pricey', color: 'var(--down)' };
  return (
    <a className="card col gap-3" onClick={() => navigate('product', { slug: product.slug })} style={{ cursor: 'pointer' }}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <span className="ico-chip" style={{ width: 40, height: 40 }}><Icon name={iconForProduct(product)} size={22} /></span>
        <span className="pill" style={{ color: verdict.color, borderColor: verdict.color, background: 'transparent' }}>{verdict.txt}</span>
      </div>
      <div>
        <div className="eyebrow">{product.unit}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, marginTop: 4 }}>{product.name}</div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {fmtPrice(price, country)}
      </div>
      <div className="col gap-1">
        <div className="row between" style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
          <span>L {fmtPrice(low, country)}</span>
          <span>H {fmtPrice(high, country)}</span>
        </div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: pct + '%', background: verdict.color }} />
        </div>
      </div>
      <Sparkline values={product.sparkline} w={240} h={24} color="var(--up)" />
    </a>
  );
}

// ============ GROCERY HOME (food market — grocery-only, independent of overview) ============
function GroceryHome({ country, navigate, municipality }) {
  return (
    <div>
      <section style={{ background: 'var(--bg)' }}>
        <div className="container" style={{ padding: '40px 0 8px' }}>
          <div className="row between" style={{ marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
            <span className="eyebrow">Mat · {municipality}</span>
            <span className="row gap-2 eyebrow" style={{ color: 'var(--up)' }}><LiveDot /> Live · updated 3 min ago</span>
          </div>
          <h1 className="page-title" style={{ fontSize: 'clamp(38px, 4.4vw, 58px)', lineHeight: 1.04 }}>
            Groceries, <em>aisle by aisle</em>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--ink-2)', maxWidth: 540, marginTop: 18, lineHeight: 1.6 }}>
            Every staple compared across Willys, ICA, Coop, Lidl and Hemköp in {municipality} — so your weekly shop always lands at the lowest price.
          </p>
        </div>
      </section>
      <section style={{ background: 'var(--bg)', paddingTop: 28, paddingBottom: 48 }}>
        <div className="container">
          <GroceriesOverview country={country} navigate={navigate} />
        </div>
      </section>
      <section style={{ background: 'var(--bg)', borderTop: '1px solid var(--rule)', padding: '40px 0 8px' }}>
        <div className="container"><WatchlistGlance country={country} navigate={navigate} /></div>
      </section>
      <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--rule)', padding: '56px 0 72px' }}>
        <div className="container">
          <NordicStrip />
          <div style={{ marginTop: 64 }}><EditorialPromise navigate={navigate} /></div>
        </div>
      </section>
    </div>
  );
}

// ============ FUEL HOME (energy desk — technical) ============
function FuelHome({ country, navigate, municipality }) {
  const c = COUNTRIES[country];
  const grades = FUEL_PRODUCTS.filter(p => priceOf(p, country) != null);
  const stationCount = Math.max(6, Math.round(municipalityInfo(country, municipality).stores * 0.6));
  const stations = Object.entries(FUEL_STATIONS)
    .filter(([id, s]) => s.country === country)
    .map(([id, s], i) => ({ id, ...s, price: +(priceOf(grades[0], country) + (i % 5) * 0.12 - 0.18).toFixed(2) }))
    .sort((a, b) => a.price - b.price);
  return (
    <div>
      {/* TECHNICAL HERO + PUMP TOTEM */}
      <section style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
        <div className="container" style={{ padding: '40px 0 44px' }}>
          <div className="row between" style={{ marginBottom: 22 }}>
            <span className="eyebrow" style={{ color: 'oklch(78% 0.04 245)' }}>Drivmedel · {municipality}</span>
            <span className="row gap-2 eyebrow" style={{ color: 'oklch(80% 0.10 160)' }}><LiveDot /> Live · {stationCount} stations</span>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1.1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <h1 className="page-title" style={{ fontSize: 'clamp(40px, 4.8vw, 64px)', lineHeight: 1.0, color: 'var(--bg)' }}>
                Every pump,<br />one price board.
              </h1>
              <p style={{ fontSize: 16, color: 'oklch(82% 0.02 245)', maxWidth: 440, marginTop: 20, lineHeight: 1.6 }}>
                Live Bensin, Diesel, EL and Etanol prices across {stationCount} stations near you —
                so you fill up at the cheapest forecourt, every time.
              </p>
              <div className="row gap-3" style={{ marginTop: 28 }}>
                <button className="btn lg primary" onClick={() => navigate('map')}>Open price map</button>
                <button className="btn lg" style={{ background: 'transparent', color: 'var(--bg)', borderColor: 'oklch(40% 0.03 245)' }} onClick={() => navigate('browse')}>All grades →</button>
              </div>
            </div>
            {/* PUMP TOTEM */}
            <div className="grid grid-2" style={{ gap: 10 }}>
              {grades.map(p => {
                const tr = p.sparkline ? ((p.sparkline[p.sparkline.length-1] - p.sparkline[0]) / p.sparkline[0]) * 100 : 0;
                return (
                  <button key={p.slug} onClick={() => navigate('product', { slug: p.slug })} style={{
                    textAlign: 'left', font: 'inherit', cursor: 'pointer',
                    background: 'oklch(24% 0.02 245)', border: '1px solid oklch(34% 0.03 245)', borderRadius: 'var(--r-md)', padding: '16px 18px',
                  }}>
                    <div className="row between" style={{ alignItems: 'center' }}>
                      <span className="row gap-2" style={{ color: 'oklch(82% 0.02 245)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}><Icon name={iconForProduct(p)} size={14} /> {p.name.split(' ')[0]}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: tr < 0 ? 'oklch(80% 0.14 160)' : 'oklch(75% 0.16 25)' }}>{tr >= 0 ? '▲' : '▼'} {Math.abs(tr).toFixed(1)}%</span>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 30, fontWeight: 700, color: 'var(--bg)', marginTop: 10, letterSpacing: '-0.02em' }}>
                      {fmtPrice(priceOf(p, country), country).replace(/\s*kr.*/,'')}
                      <span style={{ fontSize: 12, color: 'oklch(70% 0.02 245)', marginLeft: 4 }}>{p.unit}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CHEAPEST STATIONS BOARD */}
      <section style={{ background: 'var(--bg)', padding: '44px 0' }}>
        <div className="container">
          <div className="row between" style={{ marginBottom: 18, alignItems: 'flex-end' }}>
            <div>
              <div className="eyebrow">Live board</div>
              <h2 className="section-title" style={{ marginTop: 6, fontSize: 30 }}>Cheapest stations now</h2>
            </div>
            <button className="btn ghost sm" onClick={() => navigate('map')}>Map view →</button>
          </div>
          <div className="card no-pad">
            <table className="tbl">
              <thead><tr><th>#</th><th>Station</th><th>Area</th><th className="num">Bensin 95</th><th className="num">Distance</th></tr></thead>
              <tbody>
                {stations.slice(0, 8).map((s, i) => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => navigate('map')}>
                    <td style={{ fontFamily: 'var(--mono)', color: i === 0 ? 'var(--brand)' : 'var(--ink-3)', fontWeight: 700 }}>{i + 1}</td>
                    <td><span className="row gap-2" style={{ alignItems: 'center' }}><ChainSwatch chain={CHAINS[s.chain]} size={20} /> <strong>{s.name}</strong></span></td>
                    <td style={{ color: 'var(--ink-3)' }}>{s.city}</td>
                    <td className="num" style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: i === 0 ? 'var(--brand-deep)' : 'var(--ink)' }}>{s.price.toFixed(2)} {c.currency}/L</td>
                    <td className="num" style={{ fontFamily: 'var(--mono)', color: 'var(--ink-2)' }}>{s.distance} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TREND */}
      <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--rule)', padding: '44px 0' }}>
        <div className="container">
          <div className="eyebrow">90-day trend</div>
          <h2 className="section-title" style={{ marginTop: 6, fontSize: 30 }}>Bensin 95 — where it's heading</h2>
          <div className="card" style={{ marginTop: 18 }}>
            <PriceChart
              data={PRICE_HISTORY_LONG.slice(-90).map(d => ({ date: d.date, price: (d.price / 72) * priceOf(grades[0], country) }))}
              w={1340} h={280} color="var(--brand)" currentMark={priceOf(grades[0], country)} marketBands={true} />
            <div className="source-note"><Icon name="info" size={13} /><span>Daily median across {stationCount} monitored stations in {municipality}. Individual forecourts vary — see the live board above.</span></div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============ PHARMACY HOME (clinical / care — calm) ============
function PharmacyHome({ country, navigate, municipality }) {
  const c = COUNTRIES[country];
  const products = PHARMACY_PRODUCTS.filter(p => priceOf(p, country) != null);
  const onDeal = products.filter(p => p.regular?.[country] && p.regular[country] > priceOf(p, country))
    .sort((a, b) => (1 - priceOf(b, country)/b.regular[country]) - (1 - priceOf(a, country)/a.regular[country]));
  const cats = [
    { id: 'pain', name: 'Pain relief', count: 28 },
    { id: 'vitamins', name: 'Vitamins & supplements', count: 142 },
    { id: 'wellness', name: 'Stop smoking', count: 18 },
    { id: 'oral', name: 'Oral care', count: 64 },
  ];
  return (
    <div>
      {/* CALM HERO */}
      <section style={{ background: 'var(--bg)' }}>
        <div className="container" style={{ padding: '48px 0 44px' }}>
          <div style={{ maxWidth: 720 }}>
            <div className="eyebrow" style={{ color: 'var(--brand)' }}>Apotek · {municipality}</div>
            <h1 className="page-title" style={{ fontSize: 'clamp(38px, 4.4vw, 58px)', lineHeight: 1.08, marginTop: 12 }}>
              Your medicine cabinet, <em>for less</em>
            </h1>
            <p style={{ fontSize: 17, color: 'var(--ink-2)', marginTop: 18, lineHeight: 1.7, maxWidth: 560 }}>
              Over-the-counter prices compared across Apoteket, Hjärtat, Kronans and Apotea —
              so the essentials you reach for cost less, with no guesswork.
            </p>
            <div className="row gap-3" style={{ marginTop: 26 }}>
              <button className="btn lg primary" onClick={() => navigate('browse')}>Browse pharmacy</button>
              <button className="btn lg ghost" onClick={() => navigate('deals')}>Today's savings →</button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', padding: '28px 0' }}>
        <div className="container grid grid-3" style={{ gap: 24 }}>
          {[
            { icon: 'scale', title: 'Every chain, one price', text: 'We compare the same OTC product across all major pharmacies so you see the lowest price at a glance.' },
            { icon: 'bell', title: 'Price-drop alerts', text: 'Follow the essentials you buy often and we\'ll tell you the moment the price falls.' },
            { icon: 'target', title: 'Compare per dose', text: 'We show the price per tablet, so you can tell when a bigger pack is genuinely the better value.' },
          ].map(b => (
            <div key={b.title} className="row gap-3" style={{ alignItems: 'flex-start' }}>
              <span className="ico-chip" style={{ width: 40, height: 40, flexShrink: 0 }}><Icon name={b.icon} size={21} /></span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{b.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, marginTop: 3 }}>{b.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ background: 'var(--bg)', padding: '48px 0 8px' }}>
        <div className="container">
          <div className="eyebrow">Shop by need</div>
          <h2 className="section-title" style={{ marginTop: 6, fontSize: 30 }}>What are you looking for?</h2>
          <div className="grid grid-4" style={{ marginTop: 24 }}>
            {cats.map(cat => (
              <button key={cat.id} onClick={() => navigate('category', { slug: cat.id })} className="card col gap-3" style={{ cursor: 'pointer', textAlign: 'left', font: 'inherit' }}>
                <span className="ico-chip" style={{ width: 48, height: 48 }}><Icon name={iconForCategory(cat.id)} size={26} /></span>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>{cat.name}</div>
                <div className="eyebrow">{cat.count} products</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* VERIFIED SAVINGS */}
      <section style={{ background: 'var(--bg)', padding: '40px 0 56px' }}>
        <div className="container">
          <div className="row between" style={{ marginBottom: 18, alignItems: 'flex-end' }}>
            <div>
              <div className="eyebrow">Today's savings</div>
              <h2 className="section-title" style={{ marginTop: 6, fontSize: 30 }}>Verified OTC deals</h2>
            </div>
            <button className="btn ghost sm" onClick={() => navigate('deals')}>All deals →</button>
          </div>
          <div className="grid grid-3">
            {(onDeal.length ? onDeal : products).slice(0, 6).map(p => <ProductTile key={p.slug} product={p} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

// ============ BEAUTY HOME (magazine layout — not a terminal) ============
function BeautyCard({ p, country, navigate, big }) {
  const price = priceOf(p, country);
  const reg = p.regular?.[country];
  const save = reg && reg > price ? Math.round((1 - price / reg) * 100) : 0;
  const name = p.brand && p.name.toLowerCase().startsWith(p.brand.toLowerCase()) ? p.name.slice(p.brand.length).trim() : p.name;
  return (
    <button onClick={() => navigate('product', { slug: p.slug })} style={{
      display: 'flex', flexDirection: 'column', textAlign: 'left', font: 'inherit',
      background: 'var(--surface)', border: '1px solid oklch(89% 0.012 350)',
      borderRadius: 'var(--r-lg)', overflow: 'hidden', cursor: 'pointer',
    }}>
      <div className="ico-media" style={{ position: 'relative', aspectRatio: big ? '4 / 5' : '1 / 1', background: 'oklch(95% 0.012 350)' }}>
        <img src={imageForProduct(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {save > 0 && <span style={{ position: 'absolute', top: 12, left: 12, background: 'var(--surface)', color: 'var(--brand-deep)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 'var(--r-pill)' }}>−{save}%</span>}
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div className="eyebrow" style={{ color: 'var(--brand)', letterSpacing: '0.18em' }}>{p.brand}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: big ? 22 : 17, fontWeight: 500, lineHeight: 1.18, marginTop: 6 }}>{name}</div>
        <div className="row gap-2" style={{ alignItems: 'baseline', marginTop: 10 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 600 }}>{fmtPrice(price, country)}</span>
          {save > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-4)', textDecoration: 'line-through' }}>{fmtPrice(reg, country)}</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>Best at {CHAINS[cheapestChainOf(p, country)]?.name}</div>
      </div>
    </button>
  );
}

function BeautyHome({ country, navigate, municipality }) {
  const c = COUNTRIES[country];
  const prod = (s) => findProduct(s);
  const heroProduct = prod('loreal-revitalift-serum-30');
  const picks = ['olaplex-no3-100', 'cerave-moisturising-cream-340', 'maybelline-sky-high-mascara', 'lancome-la-vie-est-belle-50'].map(prod).filter(p => p && priceOf(p, country));
  const drops = BEAUTY_PRODUCTS.filter(p => p.regular?.[country] && priceOf(p, country) < p.regular[country])
    .sort((a, b) => (1 - priceOf(a, country)/a.regular[country]) < (1 - priceOf(b, country)/b.regular[country]) ? 1 : -1)
    .slice(0, 3);
  const cats = [
    { id: 'skincare', name: 'Skincare', count: 412 },
    { id: 'makeup', name: 'Makeup', count: 386 },
    { id: 'haircare', name: 'Haircare', count: 214 },
    { id: 'fragrance', name: 'Fragrance', count: 156 },
    { id: 'bodycare', name: 'Bath & Body', count: 92 },
  ];
  return (
    <div>
      {/* EDITORIAL HERO */}
      <section style={{ background: 'var(--bg)' }}>
        <div className="container" style={{ padding: '40px 0 56px' }}>
          <div className="row between" style={{ marginBottom: 32 }}>
            <span className="eyebrow" style={{ letterSpacing: '0.22em' }}>Skönhet · {municipality}</span>
            <span className="eyebrow" style={{ letterSpacing: '0.22em' }}>The Nordic Beauty Pricewatch</span>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1.05fr 0.95fr', gap: 64, alignItems: 'center' }}>
            <div>
              <h1 className="page-title" style={{ fontSize: 'clamp(46px, 5.4vw, 78px)', lineHeight: 1.04 }}>
                Beauty, <em>fairly priced.</em>
              </h1>
              <p style={{ fontSize: 18, color: 'var(--ink-2)', maxWidth: 460, marginTop: 24, lineHeight: 1.7 }}>
                The same skincare, makeup and haircare you already love — with every price
                compared across Lyko, Kicks, Åhléns and Sephora, so you never overpay.
              </p>
              <div className="row gap-3" style={{ marginTop: 32 }}>
                <button className="btn lg primary" style={{ borderRadius: 'var(--r-pill)' }} onClick={() => navigate('browse')}>Shop the edit</button>
                <button className="btn lg ghost" style={{ borderRadius: 'var(--r-pill)' }} onClick={() => navigate('deals')}>This week's drops →</button>
              </div>
              <div className="row gap-6" style={{ marginTop: 36, flexWrap: 'wrap' }}>
                {[['1 260', 'Products'], ['4', 'Retailers'], ['Daily', 'Updated']].map(([v, l]) => (
                  <div key={l} className="col" style={{ gap: 3 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 500 }}>{v}</span>
                    <span className="eyebrow" style={{ letterSpacing: '0.16em' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            {heroProduct && (
              <div style={{ position: 'relative' }}>
                <div className="ico-media" style={{ aspectRatio: '4 / 5', background: 'oklch(93% 0.02 350)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
                  <img src={imageForProduct(heroProduct)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ position: 'absolute', left: -18, bottom: 28, background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: '14px 18px', boxShadow: '0 12px 32px oklch(40% 0.05 350 / 0.16)', maxWidth: 230 }}>
                  <div className="eyebrow" style={{ color: 'var(--brand)' }}>{heroProduct.brand}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, marginTop: 4, lineHeight: 1.2 }}>Revitalift Serum</div>
                  <div className="row gap-2" style={{ alignItems: 'baseline', marginTop: 8 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 700, color: 'var(--brand-deep)' }}>{fmtPrice(priceOf(heroProduct, country), country)}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--up)', fontWeight: 600 }}>−{Math.round((1 - priceOf(heroProduct, country)/heroProduct.regular[country]) * 100)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* EDITOR'S PICKS */}
      <section style={{ background: 'var(--bg)', padding: '8px 0 56px' }}>
        <div className="container">
          <div className="row between" style={{ marginBottom: 24, alignItems: 'flex-end' }}>
            <div>
              <div className="eyebrow" style={{ letterSpacing: '0.22em' }}>The edit</div>
              <h2 className="section-title" style={{ marginTop: 8, fontSize: 32 }}>Editor's picks <em>this week</em></h2>
            </div>
            <button className="btn ghost" style={{ borderRadius: 'var(--r-pill)' }} onClick={() => navigate('browse')}>See all →</button>
          </div>
          <div className="grid grid-4">
            {picks.map(p => <BeautyCard key={p.slug} p={p} country={country} navigate={navigate} />)}
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--rule)', padding: '56px 0' }}>
        <div className="container">
          <div className="eyebrow" style={{ letterSpacing: '0.22em', textAlign: 'center' }}>Browse</div>
          <h2 className="section-title" style={{ marginTop: 8, fontSize: 32, textAlign: 'center' }}>Shop by <em>category</em></h2>
          <div className="grid grid-5" style={{ marginTop: 32 }}>
            {cats.map(cat => (
              <button key={cat.id} onClick={() => navigate('category', { slug: cat.id })} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                background: 'var(--surface)', border: '1px solid oklch(89% 0.012 350)',
                borderRadius: 'var(--r-lg)', padding: '28px 16px', cursor: 'pointer', font: 'inherit',
              }}>
                <span style={{ width: 64, height: 64, borderRadius: 'var(--r-pill)', background: 'oklch(94% 0.025 350)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-deep)' }}>
                  <Icon name={iconForCategory(cat.id)} size={30} stroke={1.4} />
                </span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500 }}>{cat.name}</div>
                <div className="eyebrow" style={{ letterSpacing: '0.14em' }}>{cat.count} items</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* THIS WEEK'S DROPS */}
      <section style={{ background: 'var(--bg)', padding: '56px 0' }}>
        <div className="container">
          <div className="row between" style={{ marginBottom: 24, alignItems: 'flex-end' }}>
            <div>
              <div className="eyebrow" style={{ letterSpacing: '0.22em' }}>Price drops</div>
              <h2 className="section-title" style={{ marginTop: 8, fontSize: 32 }}>Worth grabbing <em>now</em></h2>
            </div>
            <button className="btn ghost" style={{ borderRadius: 'var(--r-pill)' }} onClick={() => navigate('deals')}>All deals →</button>
          </div>
          <div className="grid grid-3">
            {drops.map(p => <BeautyCard key={p.slug} p={p} country={country} navigate={navigate} big />)}
          </div>
        </div>
      </section>

      {/* SOFT VALUE STRIP */}
      <section style={{ background: 'var(--brand-tint)', borderTop: '1px solid oklch(89% 0.02 350)', padding: '52px 0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <h2 className="section-title" style={{ fontSize: 30 }}>Never overpay for your routine</h2>
          <p style={{ fontSize: 16, color: 'var(--ink-2)', marginTop: 14, lineHeight: 1.7 }}>
            We check prices for every product across Lyko, Kicks, Åhléns and Sephora every day,
            and show you the cheapest — plus the comparison price per ml, so the bottle that looks
            dearer is often the better buy. Follow what you love and we'll tell you the moment it drops.
          </p>
          <div className="row gap-3" style={{ justifyContent: 'center', marginTop: 26 }}>
            <button className="btn lg primary" style={{ borderRadius: 'var(--r-pill)' }} onClick={() => navigate('watchlist')}>Start a watchlist</button>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============ BEAUTY OVERVIEW ============
function BeautyOverview({ country, navigate }) {
  const c = COUNTRIES[country];
  const { municipality } = useApp();
  const products = BEAUTY_PRODUCTS.filter(p => priceOf(p, country) != null);
  const cats = [
    { id: 'skincare',  name: 'Skincare',     count: 412 },
    { id: 'makeup',    name: 'Makeup',       count: 386 },
    { id: 'haircare',  name: 'Haircare',     count: 214 },
    { id: 'fragrance', name: 'Fragrance',    count: 156 },
    { id: 'bodycare',  name: 'Bath & Body',  count: 92 },
  ];
  const onDeal = products
    .filter(p => p.regular?.[country] && p.regular[country] > priceOf(p, country))
    .sort((a, b) => (1 - priceOf(a, country) / a.regular[country]) < (1 - priceOf(b, country) / b.regular[country]) ? 1 : -1);

  return (
    <div className="col" style={{ gap: 48 }}>
      <div>
        <div className="row between" style={{ marginBottom: 20, alignItems: 'flex-end' }}>
          <div>
            <div className="eyebrow">Browse · {municipality}</div>
            <h2 className="section-title" style={{ marginTop: 6 }}>By category</h2>
            <p className="page-sub" style={{ marginTop: 6, fontSize: 13 }}>Skincare to fragrance — every product priced across Lyko, Kicks, Åhléns and Sephora.</p>
          </div>
        </div>
        <div className="grid grid-5">
          {cats.map(cat => (
            <a key={cat.id} className="card col gap-3" onClick={() => navigate('category', { slug: cat.id })} style={{ cursor: 'pointer' }}>
              <span className="ico-chip" style={{ width: 44, height: 44 }}><Icon name={iconForCategory(cat.id)} size={24} /></span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500 }}>{cat.name}</div>
              <div className="eyebrow">{cat.count} products</div>
            </a>
          ))}
        </div>
      </div>

      <div>
        <div className="row between" style={{ marginBottom: 16, alignItems: 'flex-end' }}>
          <div>
            <div className="eyebrow">On promo right now</div>
            <h2 className="section-title" style={{ marginTop: 6 }}>Beauty <em>price drops</em></h2>
            <p className="page-sub" style={{ marginTop: 6, fontSize: 13 }}>Where each item is cheapest today, with how much you save versus its regular price.</p>
          </div>
          <button className="btn sm ghost" onClick={() => navigate('deals')}>ALL DEALS →</button>
        </div>
        <div className="card no-pad">
          {onDeal.map((p, i) => {
            const price = priceOf(p, country);
            const reg = p.regular?.[country] || price;
            const save = Math.round((1 - price / reg) * 100);
            const cheapest = cheapestChainOf(p, country);
            return (
              <div key={p.slug} className="deal-row" style={{ borderTop: i > 0 ? '1px solid var(--rule)' : 'none' }}
                onClick={() => navigate('product', { slug: p.slug })}>
                <span className="deal-save">−{save}%</span>
                <span className="ico-chip" style={{ width: 38, height: 38, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={imageForProduct(p)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, lineHeight: 1.2 }}>{p.name}</div>
                  <div className="row gap-2" style={{ marginTop: 3, alignItems: 'center' }}>
                    {p.brand && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--brand)', fontWeight: 600 }}>{p.brand}</span>}
                    {cheapest && <StoreChip chain={cheapest} />}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 15, color: 'var(--brand-deep)' }}>{fmtPrice(price, country)}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', textDecoration: 'line-through' }}>{fmtPrice(reg, country)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-3">
        <PharmacyInsight icon="droplet" title="Routine, not splurge" text="Build a skincare routine for less — the same actives often cost half as much in budget brands." />
        <PharmacyInsight icon="scale" title="Price per ml" text="Big serums look pricey but often win on price-per-ml. We show the comparison price on every item." />
        <PharmacyInsight icon="bell" title="Set a price alert" text="Premium fragrance and Olaplex go on deep promo a few times a year. Watch them and we'll tell you." />
      </div>
    </div>
  );
}

// ============ PHARMACY OVERVIEW ============
function PharmacyOverview({ country, navigate }) {
  const c = COUNTRIES[country];
  const products = PHARMACY_PRODUCTS.filter(p => priceOf(p, country) != null);
  const cats = [
    { id: 'pain',     name: 'Pain relief', emoji: '💊', count: 28 },
    { id: 'vitamins', name: 'Vitamins',    emoji: '💛', count: 142 },
    { id: 'wellness', name: 'Stop smoking',emoji: '🟢', count: 18 },
    { id: 'oral',     name: 'Oral care',   emoji: '🦷', count: 64 },
  ];

  return (
    <div className="col" style={{ gap: 48 }}>
      <div>
        <div className="row between" style={{ marginBottom: 20, alignItems: 'flex-end' }}>
          <div>
            <div className="eyebrow">Browse · OTC</div>
            <h2 className="section-title" style={{ marginTop: 6 }}>By category</h2>
          </div>
        </div>
        <div className="grid grid-4">
          {cats.map(cat => (
            <a key={cat.id} className="card col gap-3" onClick={() => navigate('category', { slug: cat.id })} style={{ cursor: 'pointer' }}>
          <span className="ico-chip" style={{ width: 44, height: 44 }}><Icon name={iconForCategory(cat.id)} size={24} /></span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500 }}>{cat.name}</div>
              <div className="eyebrow">{cat.count} products</div>
              <button className="btn sm" style={{ alignSelf: 'flex-start' }}>BROWSE →</button>
            </a>
          ))}
        </div>
      </div>

      <div>
        <div className="row between" style={{ marginBottom: 16, alignItems: 'flex-end' }}>
          <div>
            <div className="eyebrow">Top deals</div>
            <h2 className="section-title" style={{ marginTop: 6 }}>OTC <em>verified savings</em></h2>
          </div>
          <button className="btn sm ghost" onClick={() => navigate('deals')}>ALL DEALS →</button>
        </div>
        <div className="grid grid-3">
          {products.slice(0, 6).map(p => <ProductTile key={p.slug} product={p} />)}
        </div>
      </div>

      <div className="grid grid-3">
        <PharmacyInsight icon="truck" title="Free pickup" text="Apotea ships orders to any partner pharmacy in 24 hours — at no cost." />
        <PharmacyInsight icon="clipboard" title="Fixed prescription prices" text="Prescription items have regulated prices. Only OTC differs across chains." />
        <PharmacyInsight icon="scale" title="Compare per dose" text="Check tablet count vs box price. Bigger boxes are usually disproportionately cheaper." />
      </div>
    </div>
  );
}

function PharmacyInsight({ icon, title, text }) {
  return (
    <div className="card col gap-3">
      <span className="ico-chip" style={{ width: 40, height: 40 }}><Icon name={icon} size={22} /></span>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>{text}</div>
    </div>
  );
}

// ============ NORDIC STRIP ============
function NordicStrip() {
  const { country, setCountry } = useApp();
  const data = [
    { code: 'SE', flag: '🇸🇪', name: 'Sverige', city: 'Stockholm', basket: 1198, save: 340, stores: 43 },
    { code: 'NO', flag: '🇳🇴', name: 'Norge',   city: 'Oslo',      basket: 2156, save: 540, stores: 28 },
    { code: 'IS', flag: '🇮🇸', name: 'Ísland',  city: 'Reykjavík', basket: 24890,save: 5100, stores: 15 },
  ];
  return (
    <div>
      <div className="row between" style={{ marginBottom: 28, alignItems: 'flex-end' }}>
        <div>
          <div className="eyebrow">— Norden</div>
          <h2 className="section-title" style={{ marginTop: 6, fontSize: 40 }}>Three countries, <em>one comparison engine</em></h2>
        </div>
      </div>
      <div className="grid grid-3" style={{ gap: 0, border: '1px solid var(--rule-strong)', borderRadius: 6 }}>
        {data.map((d, i) => {
          const c = COUNTRIES[d.code];
          const active = country === d.code;
          return (
            <button key={d.code} onClick={() => setCountry(d.code)} style={{
              textAlign: 'left',
              padding: '28px 32px',
              background: active ? 'var(--ink)' : 'transparent',
              color: active ? 'var(--bg)' : 'var(--ink)',
              border: 'none',
              borderRight: i < 2 ? '1px solid var(--rule)' : 'none',
              cursor: 'pointer',
              position: 'relative',
            }}>
              {active && <span style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--brand)' }} />}
              <div className="row between" style={{ alignItems: 'flex-start' }}>
                <div className="row gap-3">
                  <Flag code={d.code} size={34} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, lineHeight: 1 }}>{d.name}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4, opacity: 0.7 }}>{d.city} · {c.currencyCode}</div>
                  </div>
                </div>
                {active && <span className="eyebrow" style={{ color: 'var(--brand)' }}>● ACTIVE</span>}
              </div>
              <div className="col gap-1" style={{ marginTop: 30 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7, whiteSpace: 'nowrap' }}>Cheapest basket</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', lineHeight: 1.05 }}>
                  {d.basket.toLocaleString(c.locale)} <span style={{ fontSize: 15, fontFamily: 'var(--mono)', opacity: 0.7 }}>{c.currency}</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, marginTop: 6, fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', color: active ? 'oklch(78% 0.16 38)' : 'var(--brand)', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ opacity: 0.7, fontWeight: 500 }}>Save up to</span> {d.save.toLocaleString(c.locale)} {c.currency}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============ EDITORIAL PROMISE ============
function EditorialPromise({ navigate }) {
  return (
    <div>
      <div className="row gap-8" style={{ borderTop: '1px solid var(--rule-strong)', paddingTop: 32, alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 240px' }}>
          <div className="eyebrow">— The promise</div>
        </div>
        <div style={{ flex: 1, maxWidth: 760 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Honest prices. <em>No paid placement.</em> Every figure traces back to a real source — a receipt, a flyer or a shelf scan — with the date we last checked it.
          </h2>
          <div className="grid grid-3" style={{ gap: 32, marginTop: 40, borderTop: '1px solid var(--rule)', paddingTop: 24 }}>
            {[
              { num: '01', title: 'Verified', text: 'Every price is matched against an actual receipt, flyer or shelf scan. Never invented.' },
              { num: '02', title: 'Independent', text: 'No store can pay to rank higher. The cheapest option is always first.' },
              { num: '03', title: 'Transparent', text: 'Every price links back to its source and when we last checked it. No black boxes.' },
            ].map(it => (
              <div key={it.num} className="col gap-3">
                <span className="eyebrow">{it.num}</span>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em' }}>{it.title}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{it.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomePage, LiveTicker, Counter, LiveDot });
