/* GroceryView v2 — DASHBOARD PAGE
   PowerBI-style. Filters on left, KPIs + charts grid right.
   Cross-sector confidence-building visualizations. */

const { useState: useStateD, useMemo: useMemoD } = React;

function DashboardPage() {
  const { country, navigate, sector: activeSector } = useApp();
  const c = COUNTRIES[country];
  const [timeframe, setTimeframe] = useStateD('90d');
  const [selectedSector, setSelectedSector] = useStateD(activeSector || 'all');
  const [selectedCategory, setSelectedCategory] = useStateD('all');
  const setSectorAndReset = (s) => { setSelectedSector(s); setSelectedCategory('all'); };
  const sec = SECTORS[selectedSector];
  const sectorName = sec ? sec.name : 'All sectors';
  const sectorProducts = ALL_PRODUCTS.filter(p => (selectedSector === 'all' || p.sector === selectedSector) && priceOf(p, country) != null);
  const avgPrice = sectorProducts.length ? sectorProducts.reduce((s, p) => s + priceOf(p, country), 0) / sectorProducts.length : 0;
  const bestDeal = sectorProducts.reduce((mx, p) => { const r = p.regular?.[country]; const d = r && r > priceOf(p, country) ? (1 - priceOf(p, country) / r) * 100 : 0; return Math.max(mx, d); }, 0);
  const kpiCount = { all: '5 500', groceries: '3 420', fuel: '4', pharmacy: '820', beauty: '1 260' }[selectedSector];
  const avgLabel = { all: 'Average product price', groceries: 'Average grocery item', fuel: 'Average pump price', pharmacy: 'Average OTC item', beauty: 'Average beauty item' }[selectedSector];

  return (
    <main className="fade-in" style={{ background: 'var(--bg-2)', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '28px 0 64px' }}>
        <Breadcrumb trail={[{ label: 'Home', route: 'home' }, { label: 'Price Dashboard' }]} />

        {/* Header */}
        <div className="row between" style={{ marginTop: 16, marginBottom: 24, alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="row gap-2" style={{ marginBottom: 10 }}>
              <span className="pill brand" style={{ gap: 6 }}>{sec ? <Icon name={iconForSector(selectedSector)} size={12} /> : <Flag code={c.code} size={12} />} {sectorName} · {c.city}</span>
              <span className="pill" style={{ background: 'var(--bg)', borderColor: 'var(--rule)' }}>● Live · updated 3 min ago</span>
            </div>
            <h1 className="page-title" style={{ fontSize: 40 }}>{sec ? `${sectorName} dashboard` : 'Price dashboard'}</h1>
            <p style={{ color: 'var(--ink-2)', fontSize: 14, marginTop: 6, maxWidth: 540 }}>
              Real-time {sec ? sectorName.toLowerCase() : 'price'} intelligence in {c.name} — indices, cheapest sellers and the biggest movers.
            </p>
          </div>
          <div className="row gap-2">
            <div className="tabs">
              {['7d', '30d', '90d', '1y'].map(tf => (
                <button key={tf} className={timeframe === tf ? 'active' : ''} onClick={() => setTimeframe(tf)}>{tf}</button>
              ))}
            </div>
            <button className="btn"><Icon name="download" size={14} /> Export</button>
            <button className="btn primary"><Icon name="plus" size={14} /> Add widget</button>
          </div>
        </div>

        {/* DASHBOARD LAYOUT */}
        <div className="grid" style={{ gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'flex-start' }}>
          {/* SIDEBAR FILTERS */}
          <DashboardSidebar
            sector={selectedSector} setSector={setSectorAndReset}
            category={selectedCategory} setCategory={setSelectedCategory}
            country={country}
          />

          {/* MAIN GRID */}
          <div className="col gap-4" style={{ minWidth: 0 }}>
            {/* KPI ROW */}
            <div className="grid grid-4">
              <KPI label={`${sectorName} tracked`} value={kpiCount} sub="updated daily" change={-3.0}
                sparkline={[4112, 4140, 4162, 4180, 4195, 4210, 4225, 4232, 4240]} />
              <KPI label={avgLabel} value={fmtPrice(avgPrice, country)}
                sub={`across ${sectorProducts.length} items`} change={-2.4}
                sparkline={[1400, 1390, 1395, 1380, 1370, 1360, 1355, 1348, 1342]} color="var(--brand)" />
              <KPI label="Biggest discount now" value={`−${Math.round(bestDeal)}%`}
                sub="vs regular price" change={-2.4}
                sparkline={[18.7, 18.5, 18.3, 18.2, 18.0, 17.95, 17.92, 17.9, 17.89]} color="var(--brand)" />
              <KPI label="Active price alerts" value="312"
                sub="34 hit this week" change={9.4}
                sparkline={[245, 258, 270, 281, 290, 298, 302, 308, 312]} color="var(--save)" />
            </div>

            {/* BIG CHART + DONUT */}
            <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <PriceIndexCard country={country} activeSector={selectedSector} />
              <SectorMixCard sector={selectedSector} />
            </div>

            {/* CHAIN COMPARISON BAR + HEATMAP */}
            <div className="grid" style={{ gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
              <ChainRankingCard country={country} sector={selectedSector} />
              <CategoryHeatmapCard country={country} sector={selectedSector} />
            </div>

            {/* MOVERS + TOP DEALS */}
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <TopMoversCard country={country} navigate={navigate} sector={selectedSector} />
              <TopDealsCard country={country} navigate={navigate} sector={selectedSector} />
            </div>

            {/* FOOTER WIDGETS */}
            <div className="grid grid-3">
              <RegionInflationCard sectorName={sectorName} />
              {(selectedSector === 'fuel' || selectedSector === 'all')
                ? <FuelTrendCard country={country} />
                : <BestSellersWidget country={country} navigate={navigate} sector={selectedSector} />}
              {(selectedSector === 'groceries' || selectedSector === 'all')
                ? <CheapestStoresWidget country={country} navigate={navigate} />
                : <BestSellersWidget country={country} navigate={navigate} sector={selectedSector} mode="deals" />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ============ SIDEBAR FILTERS ============
function DashboardSidebar({ sector, setSector, category, setCategory, country }) {
  const catsBySector = {
    pharmacy: [
      { slug: 'pain', name: 'Pain relief', count: 28 },
      { slug: 'vitamins', name: 'Vitamins', count: 142 },
      { slug: 'wellness', name: 'Wellness', count: 18 },
      { slug: 'oral', name: 'Oral care', count: 64 },
    ],
    fuel: [],
    beauty: CATEGORIES.filter(c => c.sector === 'beauty'),
    groceries: CATEGORIES.filter(c => !c.sector),
  };
  const cats = sector === 'all' ? CATEGORIES.filter(c => !c.sector) : (catsBySector[sector] || []);
  return (
    <aside className="card" style={{ padding: 16, position: 'sticky', top: 130 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Filters</div>
      <div className="col gap-1" style={{ marginBottom: 18 }}>
        {[
          { id: 'all',       name: 'All sectors', icon: 'box' },
          { id: 'groceries', name: 'Groceries',   icon: 'cart' },
          { id: 'fuel',      name: 'Fuel',        icon: 'fuel' },
          { id: 'pharmacy',  name: 'Pharmacy',    icon: 'pillCapsule' },
          { id: 'beauty',    name: 'Beauty',      icon: 'lipstick' },
        ].map(s => (
          <button key={s.id} onClick={() => setSector(s.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 8,
            background: sector === s.id ? 'var(--brand-tint)' : 'transparent',
            color: sector === s.id ? 'var(--brand-deep)' : 'var(--ink-2)',
            border: 'none', font: 'inherit', textAlign: 'left',
            fontWeight: sector === s.id ? 700 : 500, fontSize: 13, cursor: 'pointer'
          }}>
            <Icon name={s.icon} size={15} /><span>{s.name}</span>
          </button>
        ))}
      </div>
      {cats.length > 0 && <div className="eyebrow" style={{ marginBottom: 10 }}>Category</div>}
      {cats.length > 0 && <div className="col gap-1" style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 18 }}>
        <button onClick={() => setCategory('all')} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8,
          background: category === 'all' ? 'var(--brand-tint)' : 'transparent',
          border: 'none', font: 'inherit', textAlign: 'left', fontSize: 12, color: 'var(--ink-2)',
          fontWeight: category === 'all' ? 700 : 500, cursor: 'pointer'
        }}>All categories</button>
        {cats.map(cat => (
          <button key={cat.slug} onClick={() => setCategory(cat.slug)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8,
            background: category === cat.slug ? 'var(--brand-tint)' : 'transparent',
            color: category === cat.slug ? 'var(--brand-deep)' : 'var(--ink-2)',
            border: 'none', font: 'inherit', textAlign: 'left', fontSize: 12,
            fontWeight: category === cat.slug ? 700 : 500, cursor: 'pointer'
          }}>
            <Icon name={iconForCategory(cat.slug)} size={14} /><span>{cat.name}</span>
            {cat.count != null && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--ink-3)' }}>{cat.count}</span>}
          </button>
        ))}
      </div>}
      <div className="eyebrow" style={{ marginBottom: 10 }}>Show</div>
      <div className="col gap-2" style={{ marginBottom: 18, fontSize: 13 }}>
        <label className="row gap-2"><input type="checkbox" defaultChecked /> On deal now</label>
        <label className="row gap-2"><input type="checkbox" defaultChecked /> In stock nearby</label>
      </div>
      <button className="btn ghost" style={{ width: '100%' }}>Clear filters</button>
    </aside>
  );
}

// ============ Price Index Card ============
function PriceIndexCard({ country, activeSector }) {
  const allSeries = [
    { key: 'groceries', name: 'Groceries', values: [100, 99.4, 98.9, 98.2, 97.6, 97.1, 97.4, 96.8, 96.3, 95.8, 95.4, 95.1, 94.8], color: 'var(--brand)' },
    { key: 'fuel', name: 'Fuel',      values: [100, 101.2, 100.8, 100.4, 99.8, 99.2, 98.6, 98.0, 97.6, 97.2, 97.0, 96.8, 96.7], color: 'var(--save)' },
    { key: 'pharmacy', name: 'Pharmacy',  values: [100, 100.4, 100.8, 101.0, 101.4, 101.6, 101.8, 102.0, 102.2, 102.4, 102.5, 102.6, 102.7], color: 'var(--info)' },
    { key: 'beauty', name: 'Beauty',    values: [100, 100.1, 99.8, 99.6, 99.3, 99.1, 98.9, 98.8, 98.7, 98.6, 98.5, 98.4, 98.4], color: 'oklch(45% 0.13 350)' },
  ];
  const series = (activeSector && activeSector !== 'all')
    ? allSeries.map(s => s.key === activeSector ? { ...s, color: 'var(--brand)' } : { ...s, color: 'oklch(82% 0.01 240)', muted: true })
    : allSeries;
  return (
    <div className="card col gap-3">
      <div className="row between">
        <div>
          <div className="eyebrow">Price index · {COUNTRIES[country].city}</div>
          <h3 style={{ fontSize: 18, marginTop: 4 }}>Compared to January 2026 (=100)</h3>
        </div>
        <div className="explain">
          <span className="q">?</span><span>Lower = cheaper than January</span>
        </div>
      </div>
      <MultiLineChart series={series} w={760} h={260} baseline={100} />
      <div className="row gap-4" style={{ fontSize: 13, color: 'var(--ink-2)' }}>
        {series.map(s => (
          <div key={s.name} className="row gap-2">
            <span style={{ width: 10, height: 10, background: s.color, borderRadius: 100 }}></span>
            <strong>{s.name}</strong>
            <span style={{ fontFamily: 'var(--mono)' }}>{s.values[s.values.length - 1].toFixed(1)}</span>
            <span className={s.values[s.values.length - 1] < 100 ? 'pill brand' : 'pill hot'} style={{ fontSize: 10 }}>
              {s.values[s.values.length - 1] < 100 ? '↓' : '↑'}{Math.abs(s.values[s.values.length - 1] - 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Sector mix donut ============
function SectorMixCard({ sector }) {
  const mixes = {
    groceries: [
      { label: 'Dairy & eggs', value: 26, color: 'oklch(56% 0.18 152)' },
      { label: 'Pantry',       value: 18, color: 'oklch(64% 0.16 80)' },
      { label: 'Meat & fish',  value: 14, color: 'oklch(58% 0.18 25)' },
      { label: 'Bread',        value: 12, color: 'oklch(62% 0.14 60)' },
      { label: 'Beverages',    value: 10, color: 'oklch(56% 0.16 230)' },
      { label: 'Other',        value: 20, color: 'oklch(70% 0.06 240)' },
    ],
    beauty: [
      { label: 'Skincare',   value: 33, color: 'oklch(50% 0.13 350)' },
      { label: 'Makeup',     value: 31, color: 'oklch(58% 0.12 350)' },
      { label: 'Haircare',   value: 17, color: 'oklch(46% 0.10 350)' },
      { label: 'Fragrance',  value: 12, color: 'oklch(64% 0.09 350)' },
      { label: 'Bath & body',value: 7,  color: 'oklch(72% 0.06 350)' },
    ],
    pharmacy: [
      { label: 'Pain relief', value: 28, color: 'oklch(48% 0.12 162)' },
      { label: 'Vitamins',    value: 34, color: 'oklch(58% 0.12 162)' },
      { label: 'Wellness',    value: 16, color: 'oklch(64% 0.10 162)' },
      { label: 'Oral care',   value: 14, color: 'oklch(70% 0.08 162)' },
      { label: 'Other',       value: 8,  color: 'oklch(74% 0.05 162)' },
    ],
    fuel: [
      { label: 'Bensin 95', value: 46, color: 'oklch(46% 0.10 245)' },
      { label: 'Diesel',    value: 34, color: 'oklch(56% 0.10 245)' },
      { label: 'El-charge', value: 14, color: 'oklch(64% 0.09 245)' },
      { label: 'Etanol',    value: 6,  color: 'oklch(72% 0.06 245)' },
    ],
  };
  const data = mixes[sector] || mixes.groceries;
  return (
    <div className="card col gap-3">
      <div>
        <div className="eyebrow">Category coverage</div>
        <h3 style={{ fontSize: 18, marginTop: 4 }}>What we track</h3>
      </div>
      <div className="row gap-4" style={{ alignItems: 'center' }}>
        <Donut data={data} size={180} thickness={28} />
        <div className="col gap-2" style={{ flex: 1 }}>
          {data.map(d => (
            <div key={d.label} className="row between" style={{ fontSize: 12 }}>
              <div className="row gap-2">
                <span style={{ width: 10, height: 10, background: d.color, borderRadius: 3 }} />
                <span>{d.label}</span>
              </div>
              <strong style={{ fontFamily: 'var(--mono)' }}>{d.value}%</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ Chain ranking ============
function ChainRankingCard({ country, sector }) {
  const secKey = sector === 'all' ? 'groceries' : sector;
  const chains = Object.values(CHAINS).filter(c => c.country === country && c.sector === secKey);
  // Mock index per chain
  const rows = chains.map((ch, i) => {
    const tierAdj = { discount: -6, social: -10, 'big-box': -3, standard: 3, convenience: 8 }[ch.tier] || 0;
    const noise = (ch.name.length * 7 + i * 3) % 10 - 5;
    const idx = 100 + tierAdj + noise;
    return { label: ch.name, value: Math.round((100 - idx) * 10) / 10, color: ch.color };
  }).sort((a, b) => b.value - a.value);
  return (
    <div className="card col gap-3">
      <div>
        <div className="eyebrow">Chain comparison</div>
        <h3 style={{ fontSize: 18, marginTop: 4 }}>Cheaper than average by…</h3>
      </div>
      <BarChart rows={rows} w={420} barH={26} gap={10} valueColor="savings" labelW={120}
        format={v => (v > 0 ? '−' : '+') + Math.abs(v).toFixed(1) + '%'} />
    </div>
  );
}

// ============ Category × chain heatmap ============
function CategoryHeatmapCard({ country, sector }) {
  const secKey = sector === 'all' ? 'groceries' : sector;
  const chains = Object.values(CHAINS).filter(c => c.country === country && c.sector === secKey).slice(0, 5);
  const catsBySector = {
    groceries: ['Dairy', 'Bread', 'Coffee', 'Meat', 'Snacks', 'Pantry', 'Beverages'],
    beauty: ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Bath'],
    pharmacy: ['Pain', 'Vitamins', 'Wellness', 'Oral', 'First aid'],
    fuel: ['Bensin 95', 'Diesel', 'El-charge', 'Etanol'],
  };
  const cats = catsBySector[secKey] || catsBySector.groceries;
  const data = cats.map((cat, ri) => chains.map((ch, ci) => {
    const tierAdj = { discount: -7, social: -12, 'big-box': -3, standard: 3, convenience: 8 }[ch.tier] || 0;
    return Math.round((100 + tierAdj + ((cat.charCodeAt(0) + ch.name.charCodeAt(0) + ri * 7 + ci * 3) % 12) - 6) * 10) / 10;
  }));
  return (
    <div className="card col gap-3">
      <div>
        <div className="eyebrow">Heatmap</div>
        <h3 style={{ fontSize: 18, marginTop: 4 }}>Which chain is cheapest for what?</h3>
      </div>
      <Heatmap rows={cats} cols={chains.map(c => c.name)} data={data} w={620} cellH={32} centerAt={100} />
    </div>
  );
}

// ============ Top movers ============
function TopMoversCard({ country, navigate, sector }) {
  const pool = ALL_PRODUCTS.filter(p => (sector === 'all' || p.sector === sector) && p.sparkline);
  const drops = pool
    .map(p => ({ ...p, change: ((p.sparkline[p.sparkline.length-1] - p.sparkline[0]) / p.sparkline[0]) * 100 }))
    .filter(p => priceOf(p, country) != null)
    .sort((a, b) => a.change - b.change)
    .slice(0, 6);
  return (
    <div className="card col gap-3">
      <div className="row between">
        <div>
          <div className="eyebrow">Biggest price drops</div>
          <h3 style={{ fontSize: 18, marginTop: 4 }}>Now's the time</h3>
        </div>
        <button className="btn ghost sm" onClick={() => navigate('deals')}>See all</button>
      </div>
      <div className="col" style={{ gap: 8 }}>
        {drops.map(p => (
          <a key={p.slug} className="row between" style={{ padding: 10, borderRadius: 10, cursor: 'pointer' }}
            onClick={() => navigate('product', { slug: p.slug })}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <div className="row gap-3">
              <span className="ico-chip" style={{ width: 32, height: 32 }}><Icon name={iconForProduct(p)} size={17} /></span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.brand} · {p.size}</div>
              </div>
            </div>
            <div className="row gap-3" style={{ alignItems: 'center' }}>
              <Sparkline values={p.sparkline} w={60} h={24} fill={false} color="var(--brand)" />
              <div className="col" style={{ alignItems: 'flex-end' }}>
                <div style={{ fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                  {fmtPrice(priceOf(p, country), country)}
                </div>
                <span className="pill brand" style={{ fontSize: 10 }}>{p.change.toFixed(1)}%</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ============ Top deals ============
function TopDealsCard({ country, navigate, sector }) {
  const deals = ALL_PRODUCTS
    .filter(p => (sector === 'all' || p.sector === sector) && priceOf(p, country) && p.regular?.[country])
    .map(p => {
      const price = priceOf(p, country);
      const regular = p.regular[country];
      return { ...p, savings: regular - price, pct: ((regular - price) / regular) * 100 };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 6);
  return (
    <div className="card col gap-3">
      <div className="row between">
        <div>
          <div className="eyebrow">Best deals right now</div>
          <h3 style={{ fontSize: 18, marginTop: 4 }}>Biggest discounts</h3>
        </div>
        <button className="btn ghost sm" onClick={() => navigate('deals')}>See all</button>
      </div>
      <div className="col" style={{ gap: 8 }}>
        {deals.map(p => (
          <a key={p.slug} className="row between" style={{ padding: 10, borderRadius: 10, cursor: 'pointer' }}
            onClick={() => navigate('product', { slug: p.slug })}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <div className="row gap-3">
              <span className="ico-chip" style={{ width: 32, height: 32 }}><Icon name={iconForProduct(p)} size={17} /></span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  <span style={{ textDecoration: 'line-through' }}>{fmtPrice(p.regular[country], country)}</span>
                  <strong style={{ color: 'var(--brand)', marginLeft: 6 }}>{fmtPrice(priceOf(p, country), country)}</strong>
                </div>
              </div>
            </div>
            <div className="row gap-2" style={{ alignItems: 'center' }}>
              <span className="pill solid-save" style={{ fontSize: 11 }}>−{p.pct.toFixed(0)}%</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ============ Region inflation gauge ============
function RegionInflationCard() {
  return (
    <div className="card col gap-3">
      <div className="eyebrow">Your monthly inflation</div>
      <h3 style={{ fontSize: 18 }}>Your basket vs national</h3>
      <div className="row gap-4" style={{ alignItems: 'center' }}>
        <Gauge value={94} max={120} label="You" color="var(--brand)" w={180} h={110} />
        <div className="col gap-2" style={{ flex: 1 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>YOUR INDEX</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>94 <span style={{ fontSize: 12, color: 'var(--brand)' }}>↓ 6.0%</span></div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>NATIONAL</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>102 <span style={{ fontSize: 12, color: 'var(--hot)' }}>↑ 1.9%</span></div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4 }}>
            You're <strong style={{ color: 'var(--brand-deep)' }}>8 pts better</strong> than national.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Fuel mini trend ============
function FuelTrendCard({ country }) {
  const c = COUNTRIES[country];
  const data = FUEL_PRODUCTS.filter(p => priceOf(p, country) != null);
  return (
    <div className="card col gap-3">
      <div className="eyebrow">Fuel</div>
      <h3 style={{ fontSize: 18 }}>Today's pump price</h3>
      <div className="col gap-3" style={{ marginTop: 4 }}>
        {data.map(p => (
          <div key={p.slug} className="col gap-1">
            <div className="row between" style={{ fontSize: 13 }}>
              <span className="row gap-2" style={{ fontWeight: 600 }}><Icon name={iconForProduct(p)} size={14} /> {p.name}</span>
              <strong style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--mono)' }}>{fmtPrice(priceOf(p, country), country)}</strong>
            </div>
            <Sparkline values={p.sparkline} w={250} h={20} fill={false} color="var(--brand)" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Best sellers / sector deals widget ============
function BestSellersWidget({ country, navigate, sector, mode }) {
  let list = ALL_PRODUCTS.filter(p => p.sector === sector && priceOf(p, country) != null);
  if (mode === 'deals') {
    list = list.filter(p => p.regular?.[country] && p.regular[country] > priceOf(p, country))
      .sort((a, b) => (1 - priceOf(b, country)/b.regular[country]) - (1 - priceOf(a, country)/a.regular[country]));
  }
  list = list.slice(0, 5);
  const title = mode === 'deals' ? 'Biggest savers' : 'Most tracked';
  const eyebrow = mode === 'deals' ? `${SECTORS[sector]?.name} deals` : `${SECTORS[sector]?.name} popular`;
  return (
    <div className="card col gap-3">
      <div className="eyebrow">{eyebrow}</div>
      <h3 style={{ fontSize: 18 }}>{title}</h3>
      <div className="col gap-2">
        {list.map(p => {
          const price = priceOf(p, country);
          const reg = p.regular?.[country];
          const save = reg && reg > price ? Math.round((1 - price / reg) * 100) : 0;
          return (
            <a key={p.slug} className="row between" style={{ cursor: 'pointer', padding: '4px 0' }} onClick={() => navigate('product', { slug: p.slug })}>
              <div className="row gap-2" style={{ minWidth: 0 }}>
                <span className="ico-chip" style={{ width: 28, height: 28, overflow: 'hidden', flexShrink: 0 }}><img src={imageForProduct(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></span>
                <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
              </div>
              <span className="row gap-2" style={{ flexShrink: 0, alignItems: 'baseline' }}>
                <strong style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{fmtPrice(price, country)}</strong>
                {save > 0 && <span className="pill solid-save" style={{ fontSize: 9 }}>−{save}%</span>}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ============ Cheapest stores widget ============
function CheapestStoresWidget({ country, navigate }) {
  const stores = STORES.filter(s => s.country === country).sort((a, b) => a.basketCost - b.basketCost).slice(0, 5);
  const c = COUNTRIES[country];
  const max = Math.max(...stores.map(s => s.basketCost));
  return (
    <div className="card col gap-3">
      <div className="eyebrow">Stores near you</div>
      <h3 style={{ fontSize: 18 }}>Cheapest 5 near you</h3>
      <div className="col gap-2">
        {stores.map((s, i) => {
          const ch = CHAINS[s.chain];
          const w = (s.basketCost / max) * 100;
          return (
            <a key={s.slug} className="col gap-1" style={{ cursor: 'pointer' }} onClick={() => navigate('store', { slug: s.slug })}>
              <div className="row between" style={{ fontSize: 12 }}>
                <div className="row gap-2">
                  <ChainSwatch chain={ch} size={14} />
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                </div>
                <strong style={{ fontFamily: 'var(--mono)' }}>{s.basketCost.toLocaleString(c.locale)} {c.currency}</strong>
              </div>
              <div className="bar-track" style={{ height: 6 }}>
                <div className="bar-fill" style={{ width: w + '%', background: i === 0 ? 'var(--brand)' : 'var(--ink-3)' }} />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { DashboardPage });
