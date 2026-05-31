/* GroceryView — pages part 2: Chain Index, Map, Deals, Watchlist, Dashboard, Meal Planner, Search, About */

const { useState: useStateP2, useMemo: useMemoP2 } = React;

// ============================================================
// CHAIN INDEX PAGE
// ============================================================
function ChainIndexPage({ navigate }) {
  const [selected, setSelected] = useStateP2(['willys','ica','lidl','coop','hemkop']);
  const sorted = [...CHAIN_INDICES].sort((a, b) => a.index - b.index);

  return (
    <div className="container" style={{ padding: '24px var(--container-pad)' }}>
      <Breadcrumbs trail={[{ label: 'Markets', route: 'home' }, { label: 'Indices' }]} navigate={navigate} />

      <div className="row between" style={{ marginTop: 16, alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Chain Price Index <em>· who's cheapest, charted.</em></h1>
          <p className="ink-2" style={{ fontSize: 14, maxWidth: 720, marginTop: 8 }}>
            Each chain's index is built from a fixed 50-item Stockholm staple basket repriced weekly.
            100 = the basket on 1 Jan 2026, averaged across all chains. Lower = cheaper.
          </p>
        </div>
        <div className="tabs">
          <button>1M</button><button>3M</button><button className="active">6M</button><button>1Y</button>
        </div>
      </div>

      {/* INDEX RANKING */}
      <div className="grid cols-4" style={{ marginTop: 28 }}>
        {sorted.slice(0, 4).map((ch, i) => (
          <div key={ch.id} className="card col gap-3">
            <div className="row between">
              <div className="eyebrow">#{i + 1} cheapest · {ch.name}</div>
              <span className={'pill ' + (ch.movement >= 0 ? 'down' : 'up')}>
                {ch.movement >= 0 ? '▲' : '▼'} {Math.abs(ch.movement).toFixed(1)}%
              </span>
            </div>
            <div className="display tnum" style={{ fontSize: 44 }}>{ch.index.toFixed(1)}</div>
            <Sparkline values={ch.history} w={220} h={32}
              stroke={ch.movement < 0 ? 'var(--up)' : 'var(--down)'}
              fill={ch.movement < 0 ? 'var(--up-soft)' : 'var(--down-soft)'} />
            <div className="ink-3" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
              COVERAGE {ch.coverage}% · {Math.round(ch.coverage * 0.5)} stores
            </div>
          </div>
        ))}
      </div>

      <Rule />

      {/* MAIN CHART */}
      <SectionHead
        eyebrow="Index history"
        title="All chains, 6 months"
        hint="Click a chain to toggle. Below 100 = cheaper than the baseline; above 100 = more expensive."
        action={<button className="btn sm ghost">Download CSV</button>}
      />
      <div className="card">
        <MultiLineChart
          w={1380} h={360}
          series={CHAIN_INDICES.map(ch => ({
            name: ch.name,
            values: ch.history,
            color: CHAINS[ch.id].color,
            dim: !selected.includes(ch.id),
          }))}
          baseline={100}
        />
        <div className="row gap-3" style={{ marginTop: 16, flexWrap: 'wrap' }}>
          {CHAIN_INDICES.map(ch => {
            const isOn = selected.includes(ch.id);
            return (
              <button key={ch.id}
                className={'btn sm ' + (isOn ? '' : 'ghost')}
                onClick={() => setSelected(s => isOn ? s.filter(x => x !== ch.id) : [...s, ch.id])}>
                <span style={{ width: 8, height: 8, background: CHAINS[ch.id].color, borderRadius: 100, display: 'inline-block', opacity: isOn ? 1 : 0.3 }} />
                {ch.name} <span className="ink-3 mono" style={{ marginLeft: 4 }}>{ch.index.toFixed(1)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Rule />

      {/* DEEP TABLE */}
      <SectionHead
        eyebrow="Full table"
        title="Every chain · every category"
        hint="Lower = cheaper. Reads as a giant store-format matrix: which format wins where."
      />
      <div className="card">
        <Heatmap
          rows={CHAIN_CATEGORY_HEATMAP.map(r => findCategory(r.cat)?.name || r.cat)}
          cols={CHAIN_CATEGORY_HEATMAP[0].cells.map(c => CHAINS[c.chain].name)}
          data={CHAIN_CATEGORY_HEATMAP.map(r => r.cells.map(c => c.v))}
          w={1380}
          cellH={36}
        />
      </div>

      <Rule />

      {/* METHODOLOGY CALLOUT */}
      <SectionHead eyebrow="Methodology" title="How we compute the index" />
      <div className="grid cols-3">
        <div className="card col gap-2">
          <span className="eyebrow">1 · The basket</span>
          <div className="ink-2" style={{ fontSize: 13 }}>
            50 staples — dairy, bread, pantry, butter, meat, produce, hygiene — picked to represent a real Stockholm weekly shop.
          </div>
        </div>
        <div className="card col gap-2">
          <span className="eyebrow">2 · The math</span>
          <div className="ink-2" style={{ fontSize: 13 }}>
            For each chain, sum the basket priced at the chain's median branch. Divide by the same basket on 1 Jan 2026. ×100.
          </div>
        </div>
        <div className="card col gap-2">
          <span className="eyebrow">3 · Coverage</span>
          <div className="ink-2" style={{ fontSize: 13 }}>
            If a chain doesn't stock an item, we substitute the category median + a flag. Coverage % is shown for every chain.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAP PAGE
// ============================================================
function MapPage({ navigate }) {
  const [view, setView] = useStateP2('basket'); // basket | product | density
  const [selected, setSelected] = useStateP2(null);
  const [hovered, setHovered] = useStateP2(null);

  // Color per store by basket percentile
  const colorFor = (pct) => {
    if (pct < 20) return 'oklch(60% 0.16 145)';
    if (pct < 40) return 'oklch(72% 0.13 145)';
    if (pct < 60) return 'oklch(76% 0.05 80)';
    if (pct < 80) return 'oklch(72% 0.14 30)';
    return 'oklch(60% 0.17 25)';
  };

  return (
    <div>
      <div className="container" style={{ padding: '24px var(--container-pad) 0' }}>
        <Breadcrumbs trail={[{ label: 'Markets', route: 'home' }, { label: 'Map' }]} navigate={navigate} />
        <div className="row between" style={{ marginTop: 16, alignItems: 'flex-end' }}>
          <div>
            <h1 className="page-title">Price map <em>· Stockholm</em></h1>
            <p className="ink-2" style={{ fontSize: 14, maxWidth: 640, marginTop: 8 }}>
              Each pin is a real branch. Colour shows basket cost vs the area median.
              Click a pin for store details — green saves you money, red costs more.
            </p>
          </div>
          <div className="tabs">
            <button className={view === 'basket' ? 'active' : ''} onClick={() => setView('basket')}>Basket cost</button>
            <button className={view === 'product' ? 'active' : ''} onClick={() => setView('product')}>Single product</button>
            <button className={view === 'density' ? 'active' : ''} onClick={() => setView('density')}>Heat overlay</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24 }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 360px', gap: 24 }}>
          {/* MAP */}
          <div className="card map-ph" style={{ height: 660, position: 'relative', overflow: 'hidden', padding: 0 }}>
            {/* fake roads */}
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path d="M 80 0 L 0 0 0 80" fill="none" stroke="var(--rule)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* major roads */}
              <path d="M 0 280 Q 300 240 600 300 T 1200 280" stroke="var(--rule-2)" strokeWidth="6" fill="none" opacity="0.5" />
              <path d="M 400 0 Q 420 200 480 380 T 520 700" stroke="var(--rule-2)" strokeWidth="6" fill="none" opacity="0.5" />
              <path d="M 0 480 L 1200 460" stroke="var(--rule-2)" strokeWidth="4" fill="none" opacity="0.4" />
              {/* water */}
              <path d="M 0 380 Q 200 360 380 420 T 800 420 Q 1000 410 1200 430 L 1200 500 Q 1000 480 800 500 T 380 500 Q 200 460 0 470 Z"
                fill="oklch(70% 0.05 240 / 0.18)" />
              {/* density heat overlay */}
              {view === 'density' && STORES.map((s, i) => (
                <circle key={i} cx={s.coords[0] * 1200} cy={s.coords[1] * 660} r={70}
                  fill={colorFor(s.percentile)} opacity="0.10" />
              ))}
            </svg>
            {/* Pins */}
            {STORES.map((s, i) => {
              const x = s.coords[0] * 1200;
              const y = s.coords[1] * 660;
              const isSel = selected?.slug === s.slug;
              const isHov = hovered?.slug === s.slug;
              return (
                <div key={i}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(s)}
                  style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -100%)', cursor: 'pointer', zIndex: isSel || isHov ? 10 : 1 }}>
                  <div style={{
                    background: colorFor(s.percentile),
                    color: 'white',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    padding: '3px 7px',
                    borderRadius: 4,
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    border: isSel ? '2px solid var(--ink)' : '2px solid white',
                    whiteSpace: 'nowrap',
                    transform: isHov || isSel ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.12s',
                  }}>
                    {s.basketCost.toLocaleString('sv-SE')}
                  </div>
                  <div style={{ width: 1, height: 8, background: 'var(--ink)', margin: '0 auto', opacity: 0.4 }} />
                </div>
              );
            })}
            {/* Your location */}
            <div style={{ position: 'absolute', left: 360, top: 280, transform: 'translate(-50%, -50%)' }}>
              <div style={{ width: 14, height: 14, background: 'var(--accent)', borderRadius: 100, border: '3px solid var(--bg-elev)', boxShadow: '0 0 0 4px var(--accent-soft)' }} />
            </div>
            {/* Legend */}
            <div style={{ position: 'absolute', left: 16, bottom: 16, background: 'var(--bg-elev)', border: '1px solid var(--rule)', borderRadius: 8, padding: 12, fontSize: 11 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>Basket cost</div>
              <div className="row gap-2" style={{ alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', gap: 1 }}>
                  {[0, 20, 40, 60, 80].map(p => (
                    <span key={p} style={{ width: 16, height: 10, background: colorFor(p) }} />
                  ))}
                </span>
                <span className="ink-3 mono">cheap → pricey</span>
              </div>
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className="col gap-4">
            <div className="card col gap-3">
              <div className="eyebrow">Your area · Vasastan</div>
              <div className="display tnum" style={{ fontSize: 36 }}>1 247 <span className="unit">kr</span></div>
              <div className="ink-2" style={{ fontSize: 13 }}>
                Median basket of 10 items across 19 stores within 5 km.
              </div>
              <div className="row gap-2">
                <span className="pill up">▼ 12% vs Stockholm median</span>
              </div>
            </div>

            {(selected || hovered) && (() => {
              const s = selected || hovered;
              return (
                <div className="card col gap-3">
                  <div className="row between">
                    <span className="pill" style={{ background: CHAINS[s.chain].color + '22', color: CHAINS[s.chain].color, borderColor: 'transparent' }}>{CHAINS[s.chain].name}</span>
                    <span className="ink-3 mono" style={{ fontSize: 11 }}>{s.percentile}th pct</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 16 }}>{s.name}</div>
                    <div className="ink-3" style={{ fontSize: 12 }}>{s.district} · {s.distance} km · open till {s.openTill}</div>
                  </div>
                  <div className="row between" style={{ alignItems: 'baseline' }}>
                    <div>
                      <div className="eyebrow">Basket</div>
                      <div className="display tnum" style={{ fontSize: 22 }}>{s.basketCost.toLocaleString('sv-SE')} <span className="unit">kr</span></div>
                    </div>
                    <span className={'pill ' + (s.basketDiff < 0 ? 'up' : 'down')}>
                      {s.basketDiff < 0 ? '−' : '+'}{Math.abs(s.basketDiff)} kr
                    </span>
                  </div>
                  <button className="btn primary" onClick={() => navigate('store', { slug: s.slug })}>Open store →</button>
                </div>
              );
            })()}

            <div className="card col gap-3">
              <div className="eyebrow">Cheapest near me · top 5</div>
              {STORES.slice().sort((a,b) => a.basketCost - b.basketCost).slice(0, 5).map((s, i) => (
                <div key={s.slug} className="row between" style={{ cursor: 'pointer', fontSize: 13 }} onClick={() => setSelected(s)}>
                  <div className="row gap-3" style={{ alignItems: 'center' }}>
                    <span className="ink-3 mono" style={{ fontSize: 11, width: 16 }}>{i + 1}</span>
                    <span style={{ width: 6, height: 6, borderRadius: 100, background: CHAINS[s.chain].color }} />
                    <span>{s.name}</span>
                  </div>
                  <span className="mono tnum">{s.basketCost.toLocaleString('sv-SE')} kr</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DEALS SCREENER PAGE
// ============================================================
function DealsPage({ navigate }) {
  const [minScore, setMinScore] = useStateP2(70);
  const [minConf, setMinConf] = useStateP2(60);
  const [cat, setCat] = useStateP2('all');

  const filtered = DEAL_SCREENER
    .map(d => ({ ...d, product: findProduct(d.slug) }))
    .filter(d => d.product && d.product.dealScore >= minScore && d.conf >= minConf)
    .filter(d => cat === 'all' || d.product.category === cat);

  return (
    <div className="container" style={{ padding: '24px var(--container-pad)' }}>
      <Breadcrumbs trail={[{ label: 'Markets', route: 'home' }, { label: 'Deals' }]} navigate={navigate} />

      <div className="row between" style={{ marginTop: 16, alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Real-deal screener.</h1>
          <p className="ink-2" style={{ fontSize: 14, maxWidth: 640, marginTop: 8 }}>
            Filter to find deals that are actually deals. Discounts are computed off each product's <em>own</em> 1-year typical price,
            not against an inflated "regular" price the retailer set last week.
          </p>
        </div>
        <div className="row gap-2">
          <button className="btn">Save filters</button>
          <button className="btn primary">Alert me on new matches</button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="grid cols-4" style={{ gap: 24 }}>
          <div className="col gap-2">
            <div className="eyebrow">Min deal score</div>
            <div className="row gap-3" style={{ alignItems: 'center' }}>
              <input type="range" min="50" max="100" value={minScore} onChange={e => setMinScore(+e.target.value)} style={{ flex: 1 }} />
              <span className="display tnum" style={{ fontSize: 22, width: 40 }}>{minScore}</span>
            </div>
          </div>
          <div className="col gap-2">
            <div className="eyebrow">Min source confidence</div>
            <div className="row gap-3" style={{ alignItems: 'center' }}>
              <input type="range" min="40" max="100" value={minConf} onChange={e => setMinConf(+e.target.value)} style={{ flex: 1 }} />
              <span className="display tnum" style={{ fontSize: 22, width: 50 }}>{minConf}%</span>
            </div>
          </div>
          <div className="col gap-2">
            <div className="eyebrow">Category</div>
            <select className="input" value={cat} onChange={e => setCat(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div className="col gap-2">
            <div className="eyebrow">Sort by</div>
            <select className="input">
              <option>Discount % (high → low)</option>
              <option>Savings (kr)</option>
              <option>Deal score</option>
              <option>Confidence</option>
            </select>
          </div>
        </div>
      </div>

      {/* RESULTS COUNT */}
      <div className="row between" style={{ marginTop: 24, marginBottom: 12 }}>
        <div className="eyebrow">{filtered.length} matches · {filtered.reduce((a, b) => a + b.savings, 0).toFixed(2)} kr potential savings</div>
        <div className="row gap-2">
          <span className="pill">12 categories</span>
          <span className="pill">19 stores</span>
        </div>
      </div>

      {/* DEAL CARDS */}
      <div className="grid cols-3" style={{ gap: 16 }}>
        {filtered.map(d => {
          const p = d.product;
          return (
            <a key={d.slug} className="card col gap-3" onClick={() => navigate('product', { slug: p.slug })} style={{ cursor: 'pointer' }}>
              <div className="row between" style={{ alignItems: 'flex-start' }}>
                <div className="row gap-3" style={{ alignItems: 'center' }}>
                  <div className="img-ph" style={{ width: 48, height: 48, fontSize: 24, border: 'none', background: 'var(--bg-sunken)' }}>{p.emoji}</div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div className="ink-3" style={{ fontSize: 11 }}>{d.store}</div>
                  </div>
                </div>
                <span className="pill up" style={{ fontSize: 14, padding: '4px 10px' }}>−{d.discount.toFixed(0)}%</span>
              </div>
              <div className="row between" style={{ alignItems: 'baseline' }}>
                <div>
                  <span className="display tnum" style={{ fontSize: 28 }}>{fmtSEK(p.price)}</span>
                  <span className="ink-3 mono" style={{ marginLeft: 8, textDecoration: 'line-through', fontSize: 12 }}>{fmtSEK(p.regularPrice)}</span>
                </div>
                <span className="up-text mono" style={{ fontSize: 13 }}>−{d.savings.toFixed(2)} kr</span>
              </div>
              <div className="row between">
                <ConfBadge level={d.conf >= 85 ? 'high' : d.conf >= 70 ? 'medium' : 'low'} label={`${d.conf}% confidence`} />
                <span className="pill">Score {p.dealScore}</span>
              </div>
              <Sparkline values={p.sparkline} w={280} h={28} stroke="var(--up)" fill="var(--up-soft)" />
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// WATCHLIST
// ============================================================
function WatchlistPage({ navigate }) {
  const items = WATCHLIST.map(w => ({ ...w, product: findProduct(w.slug) })).filter(x => x.product);
  const hits = items.filter(i => i.status === 'hit');

  return (
    <div className="container" style={{ padding: '24px var(--container-pad)' }}>
      <Breadcrumbs trail={[{ label: 'Markets', route: 'home' }, { label: 'Watchlist' }]} navigate={navigate} />

      <div className="row between" style={{ marginTop: 16, alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Watchlist <em>· {items.length} products</em></h1>
          <p className="ink-2" style={{ fontSize: 14, maxWidth: 640, marginTop: 8 }}>
            Track any product until it hits your target price. Get an email or push the moment a chain drops below it.
          </p>
        </div>
        <button className="btn primary">＋ Add product</button>
      </div>

      {/* Alerts banner */}
      {hits.length > 0 && (
        <div className="card" style={{ marginTop: 24, background: 'var(--up-soft)', border: '1px solid var(--up)' }}>
          <div className="row between" style={{ alignItems: 'center' }}>
            <div className="row gap-3" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>🔔</span>
              <div>
                <div style={{ fontWeight: 500, fontSize: 15, color: 'var(--up)' }}>{hits.length} price alert{hits.length > 1 ? 's' : ''} triggered</div>
                <div className="ink-2" style={{ fontSize: 13 }}>
                  {hits.map(h => h.product.name).join(', ')} hit your target this week.
                </div>
              </div>
            </div>
            <button className="btn">Review hits</button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="card nopad" style={{ marginTop: 24 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">Current</th>
              <th className="num">Your target</th>
              <th className="num">Gap</th>
              <th className="num">7d change</th>
              <th className="num">52-week low</th>
              <th>30-day</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => {
              const p = it.product;
              const gap = p.price - it.alertAt;
              const hit = gap <= 0;
              return (
                <tr key={it.slug} onClick={() => navigate('product', { slug: p.slug })} style={{ cursor: 'pointer' }} className={hit ? 'cheapest' : ''}>
                  <td>
                    <div className="row gap-3" style={{ alignItems: 'center' }}>
                      <div className="img-ph" style={{ width: 32, height: 32, fontSize: 16, border: 'none' }}>{p.emoji}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div className="ink-3 mono" style={{ fontSize: 11 }}>{p.size} · {CHAINS[p.cheapestChain].name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num"><span className="display tnum" style={{ fontSize: 16 }}>{fmtSEK(p.price)}</span></td>
                  <td className="num">{fmtSEK(it.alertAt)}</td>
                  <td className="num">
                    {hit
                      ? <span className="pill up">✓ Hit</span>
                      : <span className="mono">+{gap.toFixed(2)} kr</span>}
                  </td>
                  <td className={'num ' + (it.change7d >= 0 ? 'down-text' : 'up-text')}>{fmtPct(it.change7d)}</td>
                  <td className="num"><span className="ink-3 mono">{fmtSEK(p.low52)}</span></td>
                  <td><Sparkline values={p.sparkline} w={100} h={24} stroke={p.sparkline[p.sparkline.length - 1] < p.sparkline[0] ? 'var(--up)' : 'var(--down)'} /></td>
                  <td>
                    {hit
                      ? <span className="pill up dot">Buy now</span>
                      : <span className="pill">Waiting</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* WEEKLY DIGEST PREVIEW */}
      <Rule />
      <SectionHead eyebrow="Weekly digest" title="What you'll see Sunday 18:00 CET" hint="Personalised email — preview." />
      <div className="card" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="row between" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 12, marginBottom: 16 }}>
          <span className="brand"><span className="dot"></span><span>GroceryView</span></span>
          <span className="ink-3 mono" style={{ fontSize: 11 }}>Week of 18 May 2026</span>
        </div>
        <h3 className="display" style={{ fontSize: 28, margin: '0 0 12px', fontWeight: 400 }}>1 watchlist hit, 3 movers</h3>
        <div className="ink-2" style={{ fontSize: 14, lineHeight: 1.6 }}>
          <strong>Zoégas Coffee 450g</strong> hit your 49.90 target at Willys Odenplan (member promo).
          Lindahls Kvarg is at a 52-week low. Marabou Mjölkchoklad is up 6% this week — you may want to wait.
        </div>
        <div className="row gap-3" style={{ marginTop: 16 }}>
          <button className="btn primary">Open watchlist →</button>
          <button className="btn">Plan a basket</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PERSONAL DASHBOARD (CPI)
// ============================================================
function DashboardPage({ navigate }) {
  const basketCost = MY_BASKET.reduce((s, b) => {
    const p = findProduct(b.slug);
    return s + (p ? p.price * b.qty : 0);
  }, 0);

  return (
    <div className="container" style={{ padding: '24px var(--container-pad)' }}>
      <Breadcrumbs trail={[{ label: 'Markets', route: 'home' }, { label: 'My basket' }]} navigate={navigate} />

      <div className="row between" style={{ marginTop: 16, alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Your grocery dashboard.</h1>
          <p className="ink-2" style={{ fontSize: 14, maxWidth: 640, marginTop: 8 }}>
            Your own basket, your own inflation. Built from what you've actually been buying — never the national average.
          </p>
        </div>
        <div className="row gap-2">
          <button className="btn">Upload receipt</button>
          <button className="btn primary">Optimize basket</button>
        </div>
      </div>

      {/* HERO STATS */}
      <div className="grid cols-4" style={{ marginTop: 28 }}>
        <StatCard
          eyebrow="Your CPI (May)"
          value="98.4"
          movement={-1.6}
          sub="Cheaper than December 2025."
          sparkline={PERSONAL_CPI.map(p => p.personal)}
          conf="high"
        />
        <StatCard
          eyebrow="National (May)"
          value="101.9"
          movement={1.9}
          sub="Stockholm wide. You beat it by 3.5 points."
          sparkline={PERSONAL_CPI.map(p => p.national)}
          conf="high"
        />
        <StatCard
          eyebrow="This week's basket"
          value={basketCost.toFixed(0)}
          unit="kr"
          movement={-3.2}
          sub="At Lidl Sveavägen (cheapest)."
          conf="high"
        />
        <StatCard
          eyebrow="Saved this year"
          value="2 184"
          unit="kr"
          movement={null}
          sub="Vs. shopping at your nearest store every week."
          conf="medium"
        />
      </div>

      <Rule />

      {/* MAIN CHART */}
      <SectionHead
        eyebrow="Your basket vs national"
        title="6-month inflation comparison"
        hint="You picked up smart swaps — cheaper coffee, kvarg, oats — in March. That's where the gap opens."
      />
      <div className="card">
        <MultiLineChart
          w={1380} h={300}
          series={[
            { name: 'You',      values: PERSONAL_CPI.map(p => p.personal), color: 'var(--accent)' },
            { name: 'National', values: PERSONAL_CPI.map(p => p.national), color: 'var(--ink-3)' },
          ]}
          baseline={100}
          xLabels={PERSONAL_CPI.map((p, i) => ({ idx: i, label: p.month }))}
        />
      </div>

      <Rule />

      {/* BASKET LIST */}
      <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
        <div>
          <SectionHead eyebrow="My basket" title="10 items · weekly" />
          <div className="card nopad">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Item</th>
                  <th className="num">Qty</th>
                  <th className="num">Best price</th>
                  <th className="num">Subtotal</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {MY_BASKET.map(b => {
                  const p = findProduct(b.slug);
                  if (!p) return null;
                  return (
                    <tr key={b.slug} onClick={() => navigate('product', { slug: p.slug })} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="row gap-3" style={{ alignItems: 'center' }}>
                          <div className="img-ph" style={{ width: 28, height: 28, fontSize: 14, border: 'none' }}>{p.emoji}</div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                            <div className="ink-3 mono" style={{ fontSize: 10 }}>{CHAINS[p.cheapestChain].name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="num">×{b.qty}</td>
                      <td className="num">{fmtSEK(p.price)}</td>
                      <td className="num"><strong>{fmtSEK(p.price * b.qty)}</strong></td>
                      <td><Sparkline values={p.sparkline} w={70} h={20} stroke={p.sparkline[p.sparkline.length - 1] < p.sparkline[0] ? 'var(--up)' : 'var(--down)'} /></td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan="3" style={{ textAlign: 'right', fontWeight: 500 }}>Basket total</td>
                  <td className="num"><span className="display tnum" style={{ fontSize: 22 }}>{fmtSEK(basketCost)}</span></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <SectionHead eyebrow="Coach" title="Three ways to save" />
          <div className="col gap-3">
            <div className="card col gap-2">
              <div className="row gap-2">
                <span className="pill up">−54 kr</span>
                <span className="eyebrow">Smart swap</span>
              </div>
              <div style={{ fontWeight: 500 }}>Switch from Bregott to Lurpak's basic line</div>
              <div className="ink-2" style={{ fontSize: 13 }}>Comparable butter, 32% cheaper at Lidl. Same fat content.</div>
              <button className="btn sm">Apply swap →</button>
            </div>
            <div className="card col gap-2">
              <div className="row gap-2">
                <span className="pill up">−87 kr</span>
                <span className="eyebrow">Stop change</span>
              </div>
              <div style={{ fontWeight: 500 }}>Add a quick stop at Lidl Sveavägen</div>
              <div className="ink-2" style={{ fontSize: 13 }}>5 of your items are notably cheaper there. 1.6 km from your main store.</div>
              <button className="btn sm">See split plan →</button>
            </div>
            <div className="card col gap-2">
              <div className="row gap-2">
                <span className="pill warn">Wait 2 weeks</span>
                <span className="eyebrow">Timing</span>
              </div>
              <div style={{ fontWeight: 500 }}>Marabou Mjölkchoklad is overdue for a promo</div>
              <div className="ink-2" style={{ fontSize: 13 }}>It's gone on member promo every ~4 weeks. Last one was 3 weeks ago.</div>
              <button className="btn sm">Add to watchlist →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MEAL PLANNER
// ============================================================
function MealPlannerPage({ navigate }) {
  const meals = [
    { name: 'Köttbullar middag', emoji: '🍝', servings: 4, cost: 84.50, perServ: 21.13, ingredients: [
      { name: 'Scan Köttbullar 450g', qty: '1 pkg', price: 49.90 }, { name: 'Felix Potatismos 33p', qty: '1 pkg', price: 39.90 / 4 },
      { name: 'Lingonsylt', qty: '50g', price: 12.50 }, { name: 'Garant Gurka 300g', qty: '1', price: 8.90 },
    ], category: 'budget'},
    { name: 'Laxfilé + grönsaker', emoji: '🐟', servings: 2, cost: 142.00, perServ: 71.00, ingredients: [
      { name: 'Fiskeriet Laxfilé 500g', qty: '500g', price: 119.00 }, { name: 'Garant Körsbärstomater', qty: '250g', price: 19.90 },
      { name: 'Zeta Olivolja', qty: '20ml', price: 3.20 },
    ], category: 'premium' },
    { name: 'Kycklinggratäng', emoji: '🍗', servings: 4, cost: 156.50, perServ: 39.13, ingredients: [
      { name: 'Kronfågel Kyckling 1kg', qty: '1kg', price: 109.00 }, { name: 'Eldorado Basmati 1kg', qty: '300g', price: 18.90 * 0.3 },
      { name: 'Arla Hushållsost 500g', qty: '150g', price: 54.90 * 0.3 }, { name: 'Mjölk + grädde', qty: '300ml', price: 12.50 },
    ], category: 'family' },
    { name: 'Vegetarisk chili', emoji: '🌱', servings: 4, cost: 64.30, perServ: 16.08, ingredients: [
      { name: 'Anamma Formbar Färs 850g', qty: '500g', price: 64.90 * 0.6 }, { name: 'Zeta Kikärtor', qty: '380g', price: 14.90 },
      { name: 'Krossade tomater', qty: '400g', price: 8.50 }, { name: 'Lök, vitlök, kryddor', qty: '—', price: 6.00 },
    ], category: 'plant' },
    { name: 'Pyttipanna', emoji: '🍳', servings: 4, cost: 58.20, perServ: 14.55, ingredients: [
      { name: 'Felix Pyttipanna 720g', qty: '1 pkg', price: 34.90 }, { name: 'Egg', qty: '4 st', price: 39.95 * 0.27 },
      { name: 'Inlagda rödbetor', qty: '150g', price: 12.50 },
    ], category: 'budget' },
    { name: 'Pasta carbonara', emoji: '🍝', servings: 3, cost: 78.40, perServ: 26.13, ingredients: [
      { name: 'Barilla Spaghetti 1kg', qty: '300g', price: 27.90 * 0.3 }, { name: 'Bacon', qty: '200g', price: 45.00 },
      { name: 'Egg + parmesan', qty: '3 + 50g', price: 25.00 },
    ], category: 'classic' },
  ];

  return (
    <div className="container" style={{ padding: '24px var(--container-pad)' }}>
      <Breadcrumbs trail={[{ label: 'Markets', route: 'home' }, { label: 'Meals' }]} navigate={navigate} />

      <div className="row between" style={{ marginTop: 16, alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Meal planner <em>· cost per serving.</em></h1>
          <p className="ink-2" style={{ fontSize: 14, maxWidth: 640, marginTop: 8 }}>
            Every meal is priced from real ingredients at the cheapest available chain. Plan a week, see total cost, generate a shopping list.
          </p>
        </div>
        <div className="row gap-2">
          <button className="btn">＋ Add meal</button>
          <button className="btn primary">Generate shopping list</button>
        </div>
      </div>

      {/* WEEK GRID */}
      <div className="card" style={{ marginTop: 28 }}>
        <div className="row between" style={{ marginBottom: 16 }}>
          <div className="eyebrow">Week of 25 May — 31 May 2026</div>
          <div className="row gap-3" style={{ alignItems: 'baseline' }}>
            <div className="ink-3 mono" style={{ fontSize: 11 }}>WEEKLY TOTAL</div>
            <span className="display tnum" style={{ fontSize: 28 }}>584,10 <span className="unit">kr</span></span>
            <span className="pill up">▼ 12% vs avg week</span>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
            const m = meals[i] || meals[i - meals.length];
            return (
              <div key={day} className="card" style={{ padding: 14, background: 'var(--bg-sunken)' }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>{day}</div>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{m.emoji}</div>
                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{m.name}</div>
                <div className="ink-3 mono" style={{ fontSize: 10 }}>{m.servings} servings</div>
                <div className="display tnum" style={{ fontSize: 18, marginTop: 6 }}>{m.perServ.toFixed(0)}<span className="unit" style={{ fontSize: 10 }}>kr/serv</span></div>
              </div>
            );
          })}
        </div>
      </div>

      <Rule />

      {/* MEAL LIBRARY */}
      <SectionHead
        eyebrow="Meal library"
        title="Six meals priced today"
        hint="Tap a meal to see ingredients, cost breakdown, and cheapest store to cook it."
      />
      <div className="grid cols-3">
        {meals.map((m, i) => (
          <div key={i} className="card col gap-3">
            <div className="row between" style={{ alignItems: 'flex-start' }}>
              <span style={{ fontSize: 36 }}>{m.emoji}</span>
              <span className="pill">{m.servings} servings</span>
            </div>
            <div>
              <div style={{ fontWeight: 500, fontSize: 15 }}>{m.name}</div>
              <div className="row gap-3" style={{ alignItems: 'baseline', marginTop: 4 }}>
                <span className="display tnum" style={{ fontSize: 28 }}>{m.perServ.toFixed(2).replace('.', ',')} <span className="unit">kr/serv</span></span>
                <span className="ink-3 mono" style={{ fontSize: 11 }}>{m.cost.toFixed(2).replace('.', ',')} total</span>
              </div>
            </div>
            <div className="col gap-1">
              {m.ingredients.slice(0, 4).map((ing, j) => (
                <div key={j} className="row between" style={{ fontSize: 12 }}>
                  <span className="ink-2">{ing.name} <span className="ink-3 mono" style={{ fontSize: 10 }}>· {ing.qty}</span></span>
                  <span className="mono tnum ink-2">{ing.price.toFixed(2)} kr</span>
                </div>
              ))}
            </div>
            <button className="btn sm ghost" style={{ alignSelf: 'flex-start' }}>＋ Add to week</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SEARCH
// ============================================================
function SearchPage({ navigate }) {
  const [q, setQ] = useStateP2('');
  const [filters, setFilters] = useStateP2({ category: '', maxPrice: '', priceType: '', confidence: '' });
  const results = PRODUCTS.filter(p =>
    (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase())) &&
    (!filters.category || p.category === filters.category) &&
    (!filters.maxPrice || p.price <= +filters.maxPrice)
  );

  return (
    <div className="container" style={{ padding: '24px var(--container-pad)' }}>
      <Breadcrumbs trail={[{ label: 'Markets', route: 'home' }, { label: 'Search' }]} navigate={navigate} />

      <div className="row gap-3" style={{ marginTop: 24, alignItems: 'center' }}>
        <input className="input" autoFocus style={{ flex: 1, height: 56, fontSize: 18 }}
          placeholder="Search any product, brand, store, or category…"
          value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn" style={{ height: 56 }}>Filters</button>
      </div>

      <div className="grid" style={{ marginTop: 24, gridTemplateColumns: '240px 1fr', gap: 32 }}>
        {/* FILTERS */}
        <aside className="col gap-4">
          <div className="col gap-2">
            <div className="eyebrow">Category</div>
            {CATEGORIES.slice(0, 8).map(c => (
              <label key={c.slug} className="row gap-2" style={{ fontSize: 13, cursor: 'pointer' }}>
                <input type="radio" name="cat" checked={filters.category === c.slug} onChange={() => setFilters({...filters, category: c.slug})} />
                <span>{c.name}</span>
                <span className="ink-3 mono" style={{ marginLeft: 'auto', fontSize: 10 }}>{c.products}</span>
              </label>
            ))}
          </div>
          <div className="col gap-2">
            <div className="eyebrow">Max price</div>
            <select className="input" value={filters.maxPrice} onChange={e => setFilters({...filters, maxPrice: e.target.value})}>
              <option value="">Any</option>
              <option value="25">≤ 25 kr</option>
              <option value="50">≤ 50 kr</option>
              <option value="100">≤ 100 kr</option>
              <option value="200">≤ 200 kr</option>
            </select>
          </div>
          <div className="col gap-2">
            <div className="eyebrow">Price type</div>
            <label className="row gap-2" style={{ fontSize: 13 }}><input type="checkbox" /> Shelf</label>
            <label className="row gap-2" style={{ fontSize: 13 }}><input type="checkbox" /> Member promo</label>
            <label className="row gap-2" style={{ fontSize: 13 }}><input type="checkbox" /> Weekly deal</label>
            <label className="row gap-2" style={{ fontSize: 13 }}><input type="checkbox" /> Clearance</label>
          </div>
          <div className="col gap-2">
            <div className="eyebrow">Min confidence</div>
            <label className="row gap-2" style={{ fontSize: 13 }}><input type="checkbox" defaultChecked /> High ●●●</label>
            <label className="row gap-2" style={{ fontSize: 13 }}><input type="checkbox" defaultChecked /> Medium ●●○</label>
            <label className="row gap-2" style={{ fontSize: 13 }}><input type="checkbox" /> Low ●○○</label>
          </div>
          <div className="col gap-2">
            <div className="eyebrow">Labels</div>
            <label className="row gap-2" style={{ fontSize: 13 }}><input type="checkbox" /> Ekologisk</label>
            <label className="row gap-2" style={{ fontSize: 13 }}><input type="checkbox" /> Nyckelhål</label>
            <label className="row gap-2" style={{ fontSize: 13 }}><input type="checkbox" /> Svenskt</label>
            <label className="row gap-2" style={{ fontSize: 13 }}><input type="checkbox" /> Vegan</label>
          </div>
        </aside>

        {/* RESULTS */}
        <div>
          <div className="row between" style={{ marginBottom: 16 }}>
            <div className="eyebrow">{results.length} results {q && <>· for "{q}"</>}</div>
            <div className="tabs">
              <button className="active">Cheapest unit price</button>
              <button>Best deal</button>
              <button>Most tracked</button>
            </div>
          </div>
          <div className="grid cols-3">
            {results.map(p => (
              <a key={p.slug} className="card col gap-2" onClick={() => navigate('product', { slug: p.slug })} style={{ cursor: 'pointer' }}>
                <div className="row between" style={{ alignItems: 'flex-start' }}>
                  <div className="img-ph" style={{ width: 56, height: 56, fontSize: 28, border: 'none', background: 'var(--bg-sunken)' }}>{p.emoji}</div>
                  <ConfBadge level={p.confidence} />
                </div>
                <div>
                  <div className="ink-3 mono" style={{ fontSize: 11 }}>{p.ticker} · {p.brand}</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</div>
                  <div className="ink-3" style={{ fontSize: 11 }}>{p.size}</div>
                </div>
                <div className="row between" style={{ alignItems: 'baseline', marginTop: 4 }}>
                  <div>
                    <div className="display tnum" style={{ fontSize: 22 }}>{fmtSEK(p.price)}</div>
                    <div className="ink-3 mono" style={{ fontSize: 10 }}>{p.unitPrice.toFixed(2)} {p.unit}</div>
                  </div>
                  <Sparkline values={p.sparkline} w={64} h={24} stroke={p.sparkline[p.sparkline.length - 1] < p.sparkline[0] ? 'var(--up)' : 'var(--down)'} />
                </div>
                <span className="pill" style={{ background: CHAINS[p.cheapestChain].color + '22', color: CHAINS[p.cheapestChain].color, borderColor: 'transparent', alignSelf: 'flex-start' }}>
                  Cheapest: {CHAINS[p.cheapestChain].name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ABOUT / METHODOLOGY
// ============================================================
function AboutPage({ navigate }) {
  return (
    <div className="container" style={{ padding: '24px var(--container-pad)', maxWidth: 880 }}>
      <Breadcrumbs trail={[{ label: 'Markets', route: 'home' }, { label: 'About the data' }]} navigate={navigate} />

      <h1 className="page-title" style={{ fontSize: 64, marginTop: 24 }}>About the data.</h1>
      <p className="ink-2" style={{ fontSize: 17, lineHeight: 1.6, marginTop: 16, maxWidth: 680 }}>
        GroceryView is a financial terminal for groceries. Every figure on this site is computed from a real source —
        a retailer flyer, an online shelf scrape, an in-store observation, or a verified shopper receipt — never invented.
      </p>

      <Rule />

      <h2 className="display" style={{ fontSize: 32, fontWeight: 400, marginTop: 24, marginBottom: 16 }}>What's a confidence badge?</h2>
      <div className="grid cols-3" style={{ marginBottom: 24 }}>
        <div className="card col gap-3">
          <ConfBadge level="high" />
          <div className="ink-2" style={{ fontSize: 13 }}>EAN-matched, observed in the last 48h, verified at ≥2 sources. The price you see is the price you pay.</div>
        </div>
        <div className="card col gap-3">
          <ConfBadge level="medium" />
          <div className="ink-2" style={{ fontSize: 13 }}>Matched by EAN or commodity name, observed in the last 7 days, single source. Reliable but worth checking at the shelf.</div>
        </div>
        <div className="card col gap-3">
          <ConfBadge level="low" />
          <div className="ink-2" style={{ fontSize: 13 }}>Older observation, or community-reported only. We surface it but flag it. Treat as a starting hypothesis.</div>
        </div>
      </div>

      <h2 className="display" style={{ fontSize: 32, fontWeight: 400, marginTop: 32, marginBottom: 16 }}>What we don't do.</h2>
      <ul className="ink-2" style={{ fontSize: 14, lineHeight: 1.9 }}>
        <li>We don't <strong>predict</strong> prices. We show what a product's <em>own</em> 1-year history says about whether today's price is unusual.</li>
        <li>We don't pad missing data with averages and hope. If a chain doesn't stock an item, we say so.</li>
        <li>We don't accept paid placement. The cheapest item is always shown first.</li>
        <li>We don't display "regular price" theatre. The discount % is computed off each product's <em>own</em> typical price.</li>
      </ul>

      <h2 className="display" style={{ fontSize: 32, fontWeight: 400, marginTop: 32, marginBottom: 16 }}>Coverage today.</h2>
      <div className="grid cols-4">
        <div className="card col gap-2">
          <div className="eyebrow">Stockholm stores</div>
          <div className="display tnum" style={{ fontSize: 32 }}>19</div>
        </div>
        <div className="card col gap-2">
          <div className="eyebrow">Tracked SKUs</div>
          <div className="display tnum" style={{ fontSize: 32 }}>1 246</div>
        </div>
        <div className="card col gap-2">
          <div className="eyebrow">Chains covered</div>
          <div className="display tnum" style={{ fontSize: 32 }}>8</div>
        </div>
        <div className="card col gap-2">
          <div className="eyebrow">Daily observations</div>
          <div className="display tnum" style={{ fontSize: 32 }}>~3 800</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ChainIndexPage, MapPage, DealsPage, WatchlistPage, DashboardPage,
  MealPlannerPage, SearchPage, AboutPage,
});
