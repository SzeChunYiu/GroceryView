/* GroceryView — pages part 1: Home, Product, Store, Category, Compare */

const { useState: useStateP1, useMemo: useMemoP1 } = React;

// ============================================================
// HOME / MARKETS
// ============================================================
function HomePage({ navigate }) {
  const groceryIndex = useMemoP1(() => {
    const avg = CHAIN_INDICES.reduce((a, b) => a + b.index, 0) / CHAIN_INDICES.length;
    return avg;
  }, []);
  const topMoversDown = useMemoP1(() =>
    [...PRODUCTS].sort((a, b) => a.vsUsual - b.vsUsual).slice(0, 6), []);
  const topMoversUp = useMemoP1(() =>
    [...PRODUCTS].sort((a, b) => b.vsUsual - a.vsUsual).slice(0, 4), []);
  const cheapestChain = CHAIN_INDICES.slice().sort((a, b) => a.index - b.index)[0];
  const priciestChain = CHAIN_INDICES.slice().sort((a, b) => b.index - a.index)[0];

  return (
    <div>
      {/* HERO */}
      <div className="container" style={{ padding: '40px var(--container-pad) 16px' }}>
        <Breadcrumbs trail={[{ label: 'Markets' }]} navigate={navigate} />
        <div className="grid cols-12" style={{ marginTop: 16, gap: 24, alignItems: 'end' }}>
          <div style={{ gridColumn: 'span 8' }}>
            <h1 className="page-title" style={{ fontSize: 64 }}>
              Stockholm grocery market, <em>at a glance.</em>
            </h1>
            <p className="ink-2" style={{ fontSize: 16, maxWidth: 640, marginTop: 12 }}>
              Every product is a ticker. Every chain is an index. Every figure traces to a real source — never invented.
              Pick a cheaper basket today, or follow a price until it drops.
            </p>
          </div>
          <div style={{ gridColumn: 'span 4' }}>
            <div className="col gap-3">
              <div className="eyebrow">Grocery Index · Stockholm · 100 = 2026-01-01</div>
              <div className="row gap-4" style={{ alignItems: 'baseline' }}>
                <span className="big-num">{groceryIndex.toFixed(1)}</span>
                <span className="pill down dot">▼ 1.4% wk</span>
              </div>
              <Sparkline
                values={[100, 100.2, 99.8, 99.5, 99.1, 98.8, 98.5, 98.7, 98.4, 98.2, 97.9, 97.6, groceryIndex]}
                w={300} h={48} stroke="var(--ink)" fill="var(--bg-sunken)" />
              <div className="ink-3" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                LAST OBS · 2026-05-21 08:14 CET · 19 stores · 13 chains · coverage 84%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>

        {/* 4 stat cards */}
        <div className="grid cols-4" style={{ marginTop: 8 }}>
          <StatCard
            eyebrow="Biggest cross-chain gap"
            value="47%"
            sub="Eldorado Basmati Rice 1kg — Matmissionen vs Coop"
            movement={null}
            conf="medium" />
          <StatCard
            eyebrow="Cheapest chain (CPI)"
            value={cheapestChain.index.toFixed(1)}
            sub={`${cheapestChain.name} · ${cheapestChain.coverage}% coverage`}
            movement={cheapestChain.movement}
            sparkline={cheapestChain.history}
            conf="high" />
          <StatCard
            eyebrow="Priciest chain (CPI)"
            value={priciestChain.index.toFixed(1)}
            sub={`${priciestChain.name} · ${priciestChain.coverage}% coverage`}
            movement={priciestChain.movement}
            sparkline={priciestChain.history}
            conf="medium" />
          <StatCard
            eyebrow="Your basket (10 items)"
            value="1 198"
            unit="kr"
            sub="Cheapest at Lidl Sveavägen · save 233 kr"
            movement={-3.2}
            conf="high" />
        </div>

        <Rule />

        {/* MOVERS BOARD */}
        <SectionHead
          eyebrow="Movers board"
          title="Biggest weekly drops"
          hint="Sorted by current price vs. each product's own 1-year typical price. Cross-chain spread only — confidence labelled."
          action={
            <div className="tabs">
              <button className="active">7d</button>
              <button>30d</button>
              <button>90d</button>
              <button>1y</button>
            </div>
          }
        />
        <div className="card nopad">
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Cheapest at</th>
                <th className="num">Price</th>
                <th className="num">Unit price</th>
                <th className="num">vs. usual</th>
                <th>30-day</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {topMoversDown.map(p => (
                <ProductRow key={p.slug} p={p} onClick={() => navigate('product', { slug: p.slug })} />
              ))}
            </tbody>
          </table>
        </div>

        <Rule />

        {/* 2-COLUMN: deals + cpi */}
        <div className="grid" style={{ gridTemplateColumns: '1.4fr 1fr', gap: 32 }}>
          {/* Today's best deals */}
          <div>
            <SectionHead
              eyebrow="Today's best deals"
              title="Real-deal screener"
              hint="Discount % off each item's regular price, gated by 70%+ source confidence and 75+ Deal Score."
              action={<a className="btn sm ghost" onClick={() => navigate('deals')} style={{cursor:'pointer'}}>Open screener →</a>}
            />
            <div className="grid cols-2">
              {DEAL_SCREENER.slice(0, 6).map(d => {
                const p = findProduct(d.slug);
                if (!p) return null;
                return (
                  <a key={d.slug} className="card col gap-3" onClick={() => navigate('product', { slug: p.slug })} style={{ cursor: 'pointer' }}>
                    <div className="row between" style={{ alignItems: 'flex-start' }}>
                      <div className="img-ph" style={{ width: 44, height: 44, fontSize: 22, border: 'none', background: 'var(--bg-sunken)' }}>{p.emoji}</div>
                      <span className="pill up">−{d.discount.toFixed(0)}%</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.name}</div>
                      <div className="ink-3" style={{ fontSize: 12 }}>{d.store}</div>
                    </div>
                    <div className="row between" style={{ alignItems: 'baseline' }}>
                      <div className="display tnum" style={{ fontSize: 26 }}>{fmtSEK(p.price)}</div>
                      <ConfBadge level={d.conf >= 85 ? 'high' : d.conf >= 70 ? 'medium' : 'low'} label={`${d.conf}%`} />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Personal CPI */}
          <div>
            <SectionHead
              eyebrow="Your personal inflation"
              title="Basket CPI vs. national"
              hint="Your basket has actually become cheaper since January, while the national index keeps rising."
            />
            <div className="card col gap-4">
              <MultiLineChart
                w={460} h={220}
                series={[
                  { name: 'You',      values: PERSONAL_CPI.map(p => p.personal), color: 'var(--accent)' },
                  { name: 'National', values: PERSONAL_CPI.map(p => p.national), color: 'var(--ink-3)', dim: true },
                ]}
                baseline={100}
                xLabels={PERSONAL_CPI.map((p, i) => ({ idx: i, label: p.month.split(' ')[0] }))}
              />
              <div className="row between">
                <div className="col gap-1">
                  <div className="eyebrow">You · May</div>
                  <div className="row gap-2" style={{ alignItems: 'baseline' }}>
                    <span className="display tnum" style={{ fontSize: 28 }}>98.4</span>
                    <span className="pill up">▼ 1.6%</span>
                  </div>
                </div>
                <div className="col gap-1">
                  <div className="eyebrow">National · May</div>
                  <div className="row gap-2" style={{ alignItems: 'baseline' }}>
                    <span className="display tnum" style={{ fontSize: 28 }}>101.9</span>
                    <span className="pill down">▲ 1.9%</span>
                  </div>
                </div>
              </div>
              <a className="btn" onClick={() => navigate('dashboard')} style={{ alignSelf: 'flex-start' }}>
                Open my dashboard →
              </a>
            </div>
          </div>
        </div>

        <Rule />

        {/* SECTORS */}
        <SectionHead
          eyebrow="Categories"
          title="Sector indices — what's cooling, what's heating"
          hint="Each category index is 100-centred on 2026-01-01. Index = volume-weighted average price of category staples across all chains."
          action={<a className="btn sm ghost" onClick={() => navigate('chain-index')} style={{cursor:'pointer'}}>Full breakdown →</a>}
        />
        <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {CATEGORIES.slice(0, 10).map(c => (
            <a key={c.slug} className="card col gap-2" onClick={() => navigate('category', { slug: c.slug })} style={{ cursor: 'pointer' }}>
              <div className="row between">
                <span style={{ fontSize: 20 }}>{c.emoji}</span>
                <span className={'pill ' + (c.movement >= 0 ? 'down' : 'up') + ' dot'}>
                  {c.movement >= 0 ? '▲' : '▼'} {Math.abs(c.movement).toFixed(1)}%
                </span>
              </div>
              <div style={{ fontWeight: 500 }}>{c.name}</div>
              <div className="row between" style={{ alignItems: 'baseline' }}>
                <span className="display tnum" style={{ fontSize: 22 }}>{c.index.toFixed(1)}</span>
                <span className="ink-3 mono" style={{ fontSize: 11 }}>{c.products} SKUs</span>
              </div>
            </a>
          ))}
        </div>

        <Rule />

        {/* HEATMAP */}
        <SectionHead
          eyebrow="Heatmap"
          title="Where each chain is cheapest"
          hint="Index value per chain × category. Green = cheaper than overall 100. Red = pricier. Same scale across the grid."
        />
        <div className="card">
          <Heatmap
            rows={CHAIN_CATEGORY_HEATMAP.map(r => CATEGORIES.find(c => c.slug === r.cat)?.name || r.cat)}
            cols={CHAIN_CATEGORY_HEATMAP[0].cells.map(c => CHAINS[c.chain].name)}
            data={CHAIN_CATEGORY_HEATMAP.map(r => r.cells.map(c => c.v))}
            w={1380}
            cellH={36}
          />
        </div>

        <Rule />

        {/* STORE FINDER */}
        <SectionHead
          eyebrow="Find cheapest near you"
          title="Stores by price percentile"
          hint="Lower percentile = cheaper. Computed over your basket of 10 items, across 19 Stockholm stores."
          action={<a className="btn sm ghost" onClick={() => navigate('map')} style={{cursor:'pointer'}}>Open map →</a>}
        />
        <div className="card">
          <BarChart
            w={1380}
            barH={22}
            gap={6}
            rows={STORES.slice().sort((a, b) => a.percentile - b.percentile).map(s => ({
              label: s.name,
              value: -s.basketDiff, // negative diff = savings = bar goes positive (cheaper)
              color: s.basketDiff < -100 ? 'var(--up)' : s.basketDiff < 0 ? 'oklch(70% 0.10 145)' : 'var(--down)',
            }))}
            format={v => `${v >= 0 ? '−' : '+'}${Math.abs(v).toFixed(0)} kr`}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT (TICKER) PAGE
// ============================================================
function ProductPage({ slug, navigate }) {
  const p = findProduct(slug) || PRODUCTS[0];
  const [tf, setTf] = useStateP1('3M');
  const tfDays = { '1W': 7, '1M': 30, '3M': 90, '6M': 182, '1Y': 365, 'ALL': 365 };
  const history = PRICE_HISTORY_LONG.slice(-tfDays[tf]);

  // Build cross-chain rows
  const chainRows = Object.entries(p.chains).map(([cid, price]) => {
    const ch = CHAINS[cid];
    const allPrices = Object.values(p.chains);
    const cheapest = Math.min(...allPrices);
    const pct = ((price - cheapest) / cheapest) * 100;
    return {
      chain: ch,
      price,
      vsCheapest: pct,
      isCheapest: price === cheapest,
      unitPrice: (price / parseFloat(p.size)) * (p.unit === 'kr/kg' ? 1000 / parseFloat(p.size) : 1),
    };
  }).sort((a, b) => a.price - b.price);

  // Percentile of current price vs full history
  const sorted = [...PRICE_HISTORY_LONG.map(x => x.price)].sort((a, b) => a - b);
  const pctIdx = sorted.findIndex(v => v >= p.price);
  const percentile = Math.round((pctIdx / sorted.length) * 100);

  return (
    <div>
      <div className="container" style={{ padding: '24px var(--container-pad)' }}>
        <Breadcrumbs trail={[
          { label: 'Markets', route: 'home' },
          { label: 'Category · ' + CATEGORIES.find(c => c.slug === p.category)?.name, route: 'category', params: { slug: p.category } },
          { label: p.name },
        ]} navigate={navigate} />

        {/* HEADER STRIP */}
        <div className="row between" style={{ marginTop: 16, alignItems: 'flex-end' }}>
          <div className="row gap-4" style={{ alignItems: 'center' }}>
            <div className="img-ph" style={{ width: 72, height: 72, fontSize: 38, border: 'none', background: 'var(--bg-sunken)' }}>{p.emoji}</div>
            <div className="col gap-2">
              <div className="row gap-3" style={{ alignItems: 'center' }}>
                <span className="pill mono">{p.ticker}</span>
                <span className="pill">{p.brand}</span>
                <span className="pill">{p.size}</span>
                <ConfBadge level={p.confidence} />
              </div>
              <h1 className="page-title" style={{ fontSize: 44 }}>{p.name}</h1>
            </div>
          </div>
          <div className="row gap-3">
            <button className="btn">＋ Watchlist</button>
            <button className="btn">＋ Add to basket</button>
          </div>
        </div>

        {/* PRICE STRIP */}
        <div className="grid cols-12" style={{ marginTop: 28, gap: 20, alignItems: 'flex-start' }}>
          <div style={{ gridColumn: 'span 4' }}>
            <div className="col gap-2">
              <div className="eyebrow">Cheapest right now · {CHAINS[p.cheapestChain].name}</div>
              <div className="row gap-3" style={{ alignItems: 'baseline' }}>
                <span className="big-num">{fmtSEK(p.price)}</span>
                <span className="ink-3 mono" style={{ fontSize: 14 }}>{p.unitPrice.toFixed(2)} {p.unit}</span>
              </div>
              <div className="row gap-2">
                <span className={'pill ' + (p.vsUsual < 0 ? 'up' : 'down')}>
                  {p.vsUsual < 0 ? '▼' : '▲'} {Math.abs(p.vsUsual)}% vs usual
                </span>
                <span className="pill">Regular {fmtSEK(p.regularPrice)}</span>
                {p.price <= p.low52 && <span className="pill up dot">52-week low</span>}
              </div>
            </div>
          </div>
          <div style={{ gridColumn: 'span 4' }}>
            <Verdict verdict={p.verdict} />
          </div>
          <div style={{ gridColumn: 'span 4' }}>
            <div className="col gap-2">
              <div className="eyebrow">Deal score</div>
              <Gauge value={p.dealScore} label={p.verdict === 'buy' ? 'Excellent — buy now' : p.verdict === 'wait' ? 'Pass for now' : 'OK price'} w={240} h={120} />
            </div>
          </div>
        </div>

        <Rule />

        {/* MAIN CHART */}
        <SectionHead
          eyebrow="Price chart"
          title="History"
          hint={`Shows the cheapest available price across all chains, per day. The shaded band is this product's typical range (mean ± 1σ over 1y).`}
          action={
            <div className="tabs">
              {['1W','1M','3M','6M','1Y','ALL'].map(k => (
                <button key={k} className={tf === k ? 'active' : ''} onClick={() => setTf(k)}>{k}</button>
              ))}
            </div>
          }
        />
        <div className="card">
          <PriceChart
            data={history}
            w={1380}
            h={320}
            color="var(--accent)"
            lowMark={p.low52}
            highMark={p.high52}
            currentMark={p.price}
            showBands={true}
          />
          <div className="row gap-6" style={{ marginTop: 12, flexWrap: 'wrap' }}>
            <div className="kv" style={{ minWidth: 200 }}>
              <span className="k">52-week low</span>
              <span className="l" /> <span className="v up-text">{fmtSEK(p.low52)}</span>
            </div>
            <div className="kv" style={{ minWidth: 200 }}>
              <span className="k">52-week high</span>
              <span className="l" /> <span className="v down-text">{fmtSEK(p.high52)}</span>
            </div>
            <div className="kv" style={{ minWidth: 200 }}>
              <span className="k">Current percentile</span>
              <span className="l" /> <span className="v">{percentile}th</span>
            </div>
            <div className="kv" style={{ minWidth: 200 }}>
              <span className="k">Volatility (90d σ)</span>
              <span className="l" /> <span className="v">3.41 kr</span>
            </div>
            <div className="kv" style={{ minWidth: 200 }}>
              <span className="k">Last observed</span>
              <span className="l" /> <span className="v">2026-05-21 08:14</span>
            </div>
          </div>
        </div>

        <Rule />

        {/* CROSS-CHAIN COMPARISON */}
        <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
          <div>
            <SectionHead
              eyebrow="Cross-chain comparison"
              title="Who has it cheapest"
              hint="Same product, same week, across every chain that stocked it."
            />
            <div className="card nopad">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Chain</th>
                    <th className="num">Price</th>
                    <th className="num">Unit price</th>
                    <th className="num">vs cheapest</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chainRows.map(r => (
                    <tr key={r.chain.id} className={r.isCheapest ? 'cheapest' : ''}>
                      <td>
                        <div className="row gap-3" style={{ alignItems: 'center' }}>
                          <span style={{ width: 8, height: 8, borderRadius: 100, background: r.chain.color, display: 'inline-block' }} />
                          <span style={{ fontWeight: 500 }}>{r.chain.name}</span>
                          <span className="ink-3" style={{ fontSize: 11 }}>{r.chain.tier}</span>
                        </div>
                      </td>
                      <td className="num"><span className="display tnum" style={{ fontSize: 20 }}>{fmtSEK(r.price)}</span></td>
                      <td className="num"><span className="ink-3 mono" style={{ fontSize: 11 }}>{(r.price * (p.unit === 'kr/kg' ? 1000 / parseFloat(p.size) : 1)).toFixed(2)} {p.unit}</span></td>
                      <td className="num">
                        {r.isCheapest
                          ? <span className="pill up">cheapest</span>
                          : <span className="down-text mono">+{r.vsCheapest.toFixed(1)}%</span>}
                      </td>
                      <td>
                        {r.isCheapest && <span className="pill up dot">Member promo</span>}
                        {!r.isCheapest && r.vsCheapest < 8 && <span className="pill">close</span>}
                        {r.vsCheapest > 15 && <span className="pill down">avoid for this</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SMART SWAPS */}
          <div>
            <SectionHead
              eyebrow="Smart swaps"
              title="Cheaper substitutes"
              hint="Comparable products in the same category."
            />
            <div className="card col gap-3">
              {(SMART_SWAPS[p.slug] || [
                { name: 'Gevalia Mellanrost 450g', price: 44.90, savings: 5.00, equiv: '88%' },
                { name: 'ICA Selection Filter 450g', price: 42.50, savings: 7.40, equiv: '82%' },
                { name: 'Löfbergs Mellanrost 450g', price: 46.90, savings: 3.00, equiv: '90%' },
              ]).map((s, i) => (
                <div key={i} className="row between" style={{ paddingBottom: i < 2 ? 12 : 0, borderBottom: i < 2 ? '1px solid var(--rule)' : 'none' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{s.name}</div>
                    <div className="ink-3" style={{ fontSize: 11 }}>{s.equiv} equivalent · same category</div>
                  </div>
                  <div className="col" style={{ alignItems: 'flex-end' }}>
                    <span className="display tnum" style={{ fontSize: 18 }}>{fmtSEK(s.price)}</span>
                    <span className="up-text mono" style={{ fontSize: 11 }}>−{s.savings.toFixed(2)} kr</span>
                  </div>
                </div>
              ))}
              <button className="btn ghost" style={{ alignSelf: 'flex-start' }}>See all 9 swaps →</button>
            </div>

            {/* Price event log */}
            <div style={{ marginTop: 24 }}>
              <SectionHead
                eyebrow="Why did it move"
                title="Price events"
                hint="Real events behind every change > ±2%."
              />
              <div className="card col gap-3">
                {PRICE_EVENTS.map((e, i) => (
                  <div key={i} className="row gap-3" style={{ alignItems: 'flex-start' }}>
                    <span className="mono ink-3" style={{ fontSize: 11, width: 80, flexShrink: 0 }}>{e.date}</span>
                    <span className={'pill ' + (e.type === 'rise' ? 'down' : e.type === 'low' ? 'up' : '')} style={{ flexShrink: 0 }}>
                      {e.type === 'promo' ? '◆ Promo' : e.type === 'drop' ? '▼ Drop' : e.type === 'rise' ? '▲ Rise' : '★ Low'}
                    </span>
                    <div style={{ fontSize: 12 }}>
                      <div>{e.note}</div>
                      {e.delta !== 0 && (
                        <div className={'mono ' + (e.delta > 0 ? 'down-text' : 'up-text')} style={{ fontSize: 11 }}>
                          {e.delta > 0 ? '+' : ''}{e.delta.toFixed(2)} kr
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Rule />

        {/* PRICE DISTRIBUTION */}
        <SectionHead
          eyebrow="Across branches"
          title="Branch-level price distribution"
          hint={`This product is sold at ${Object.keys(p.chains).length} chains and ~${Object.keys(p.chains).length * 3} branches in Stockholm. Each dot is one branch — the orange dot is your nearest.`}
        />
        <div className="card">
          <BoxPlot
            w={1380}
            h={120}
            items={[
              ...Object.entries(p.chains).flatMap(([cid, base]) => [
                { name: CHAINS[cid].name + ' #1', value: base },
                { name: CHAINS[cid].name + ' #2', value: base + (Math.random() * 4 - 2) },
                { name: CHAINS[cid].name + ' #3', value: base + (Math.random() * 4 - 2) },
              ]),
              { name: 'Willys Odenplan (you)', value: p.price, highlight: true },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STORE PAGE
// ============================================================
function StorePage({ slug, navigate }) {
  const s = findStore(slug) || STORES[0];
  const ch = CHAINS[s.chain];

  // Sample stocked items
  const stocked = PRODUCTS.slice(0, 8);

  return (
    <div className="container" style={{ padding: '24px var(--container-pad)' }}>
      <Breadcrumbs trail={[
        { label: 'Markets', route: 'home' },
        { label: 'Stores', route: 'map' },
        { label: s.name },
      ]} navigate={navigate} />

      {/* HEADER */}
      <div className="row between" style={{ marginTop: 16, alignItems: 'flex-end' }}>
        <div className="col gap-2">
          <div className="row gap-3">
            <span className="pill mono" style={{ background: ch.color + '22', color: ch.color, borderColor: 'transparent' }}>● {ch.name}</span>
            <span className="pill">{s.format}</span>
            <span className="pill">{s.district}</span>
            <span className="pill">{s.distance} km</span>
            <span className="pill">Open till {s.openTill}</span>
          </div>
          <h1 className="page-title" style={{ fontSize: 44 }}>{s.name}</h1>
        </div>
        <div className="row gap-3">
          <button className="btn">★ Set as my store</button>
          <button className="btn">Open directions</button>
        </div>
      </div>

      {/* PERCENTILE SUMMARY */}
      <div className="grid cols-4" style={{ marginTop: 28 }}>
        <div className="card col gap-3">
          <div className="eyebrow">Price percentile (Stockholm)</div>
          <div className="row gap-3" style={{ alignItems: 'baseline' }}>
            <span className="big-num">{s.percentile}<span className="unit">th</span></span>
          </div>
          <div style={{ height: 8, background: 'var(--bg-sunken)', borderRadius: 100, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${s.percentile}%`, background: 'var(--accent)', borderRadius: 100 }} />
          </div>
          <div className="ink-2" style={{ fontSize: 12 }}>
            Cheaper than <strong>{100 - s.percentile}%</strong> of Stockholm grocery stores on the 50-item staple basket.
          </div>
        </div>
        <StatCard
          eyebrow="Basket cost (10 items)"
          value={s.basketCost.toLocaleString('sv-SE')}
          unit="kr"
          sub={`${s.basketDiff < 0 ? '−' : '+'}${Math.abs(s.basketDiff)} kr vs Stockholm median`}
          movement={null}
          conf="high"
        />
        <StatCard
          eyebrow="Best category"
          value="Coffee"
          sub="91.6 index · -8.4% vs baseline"
          movement={-8.4}
          conf="high"
        />
        <StatCard
          eyebrow="Worst category"
          value="Butter"
          sub="106.9 index · pricier vs nearby Lidl"
          movement={6.9}
          conf="medium"
        />
      </div>

      <Rule />

      {/* COMPARE WITH NEIGHBOURS */}
      <SectionHead
        eyebrow="Vs. nearby stores"
        title="Basket cost at 8 stores within 4 km"
        hint="Same 10-item basket priced at every store within walking / short-cycle distance."
      />
      <div className="card">
        <BarChart
          w={1380}
          barH={26}
          gap={8}
          rows={STORES
            .slice()
            .sort((a, b) => a.basketCost - b.basketCost)
            .slice(0, 10)
            .map(st => ({
              label: st.name,
              value: st.basketCost,
              color: st.slug === s.slug ? 'var(--accent)' : st.basketCost < 1300 ? 'var(--up)' : 'var(--ink-2)',
            }))}
          highlight={s.name}
          format={v => `${v.toLocaleString('sv-SE')} kr`}
          neutral
        />
      </div>

      <Rule />

      {/* STOCKED PRODUCTS */}
      <SectionHead
        eyebrow="Stocked here"
        title="What's cheap, what isn't"
        hint="For each stocked item, where this branch ranks among all chains stocking it."
      />
      <div className="card nopad">
        <table className="tbl">
          <thead>
            <tr>
              <th>Product</th>
              <th className="num">Price here</th>
              <th className="num">vs cheapest</th>
              <th>Where cheaper</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {stocked.map(p => {
              const cheap = Math.min(...Object.values(p.chains));
              const here = p.chains[s.chain] ?? p.price;
              const vs = ((here - cheap) / cheap) * 100;
              return (
                <tr key={p.slug} onClick={() => navigate('product', { slug: p.slug })} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="row gap-3" style={{ alignItems: 'center' }}>
                      <div className="img-ph" style={{ width: 32, height: 32, fontSize: 16, border: 'none' }}>{p.emoji}</div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div className="ink-3 mono" style={{ fontSize: 11 }}>{p.size}</div>
                      </div>
                    </div>
                  </td>
                  <td className="num">{fmtSEK(here)}</td>
                  <td className="num">
                    {vs < 0.5 ? <span className="pill up">cheapest</span> : <span className="down-text mono">+{vs.toFixed(1)}%</span>}
                  </td>
                  <td><span className="ink-2" style={{ fontSize: 12 }}>{CHAINS[p.cheapestChain].name}</span></td>
                  <td>
                    {vs < 0.5
                      ? <span className="pill up dot">Buy here</span>
                      : vs > 10
                        ? <span className="pill down dot">Buy elsewhere</span>
                        : <span className="pill">OK</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Rule />

      {/* HEATMAP OF NEARBY BRANCHES */}
      <SectionHead
        eyebrow="Your kommun · Vasastan"
        title="Branches in your neighborhood"
        hint="Each square is a branch; colour = basket cost. Map view is also available."
      />
      <div className="card">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
          {STORES.slice(0, 12).map(st => (
            <a key={st.slug} className="card" style={{
              background: st.percentile < 20 ? 'oklch(80% 0.10 145 / 0.4)' :
                          st.percentile < 40 ? 'oklch(86% 0.06 145 / 0.4)' :
                          st.percentile < 60 ? 'var(--bg-elev)' :
                          st.percentile < 80 ? 'oklch(88% 0.05 25 / 0.4)' :
                                               'oklch(82% 0.10 25 / 0.4)',
              cursor: 'pointer'
            }} onClick={() => navigate('store', { slug: st.slug })}>
              <div className="row between" style={{ alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{st.name}</div>
                <span className="mono tnum" style={{ fontSize: 11 }}>{st.percentile}th</span>
              </div>
              <div className="display tnum" style={{ fontSize: 22, marginTop: 6 }}>{st.basketCost.toLocaleString('sv-SE')}<span className="unit">kr</span></div>
              <div className="ink-3" style={{ fontSize: 11 }}>{st.district} · {st.distance} km</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CATEGORY PAGE
// ============================================================
function CategoryPage({ slug, navigate }) {
  const c = findCategory(slug) || CATEGORIES[0];
  const inCategory = PRODUCTS.filter(p => p.category === slug);
  const display = inCategory.length ? inCategory : PRODUCTS.slice(0, 6);

  // Brand-tier rollup
  const brands = useMemoP1(() => {
    const tiers = [
      { tier: 'Budget / store brand', avg: 18.20, items: 12, vs: -28 },
      { tier: 'Standard',              avg: 25.50, items: 24, vs:  0 },
      { tier: 'Premium',               avg: 39.90, items: 8,  vs: 56 },
    ];
    return tiers;
  }, []);

  return (
    <div className="container" style={{ padding: '24px var(--container-pad)' }}>
      <Breadcrumbs trail={[
        { label: 'Markets', route: 'home' },
        { label: 'Categories' },
        { label: c.name },
      ]} navigate={navigate} />

      <div className="grid cols-12" style={{ marginTop: 16, gap: 24, alignItems: 'end' }}>
        <div style={{ gridColumn: 'span 8' }}>
          <div className="row gap-3" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 36 }}>{c.emoji}</span>
            <span className="pill mono">{c.products} SKUs tracked</span>
          </div>
          <h1 className="page-title" style={{ fontSize: 56 }}>{c.name} <em>index</em></h1>
          <p className="ink-2" style={{ marginTop: 8, fontSize: 14, maxWidth: 640 }}>
            Volume-weighted average price of {c.products} {c.name.toLowerCase()} staples across 13 chains, 100-centred on 1 Jan 2026.
          </p>
        </div>
        <div style={{ gridColumn: 'span 4' }}>
          <div className="row gap-4" style={{ alignItems: 'baseline' }}>
            <span className="big-num">{c.index.toFixed(1)}</span>
            <span className={'pill ' + (c.movement >= 0 ? 'down' : 'up')}>
              {c.movement >= 0 ? '▲' : '▼'} {Math.abs(c.movement).toFixed(1)}% vs Jan
            </span>
          </div>
          <Sparkline values={[100, 100.5, 100.2, 99.8, 99.0, 97.5, 96.0, 94.5, 93.2, 92.5, 92.0, 91.8, c.index]}
            w={400} h={48} stroke={c.movement < 0 ? 'var(--up)' : 'var(--down)'} />
        </div>
      </div>

      <Rule />

      {/* CHART */}
      <SectionHead
        eyebrow="Index history"
        title="The category's own price tape"
        hint="One line per chain. Notice the discounter / standard / convenience tier gap widening."
        action={
          <div className="tabs">
            <button>1M</button><button className="active">3M</button><button>1Y</button><button>ALL</button>
          </div>
        }
      />
      <div className="card">
        <MultiLineChart
          w={1380} h={300}
          series={CHAIN_INDICES.slice(0, 6).map(ch => ({
            name: ch.name,
            values: ch.history,
            color: CHAINS[ch.id].color,
          }))}
          baseline={100}
        />
      </div>

      <Rule />

      {/* DEAL LEADERS */}
      <SectionHead
        eyebrow="Today's deal leaders"
        title={`Cheapest ${c.name.toLowerCase()} right now`}
        hint="Best deal per chain · all gated by 70%+ source confidence."
      />
      <div className="card nopad">
        <table className="tbl">
          <thead>
            <tr>
              <th>Product</th>
              <th>Cheapest at</th>
              <th className="num">Price</th>
              <th className="num">Unit price</th>
              <th className="num">vs. usual</th>
              <th>30-day</th>
              <th>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {display.map(p => (
              <ProductRow key={p.slug} p={p} onClick={() => navigate('product', { slug: p.slug })} />
            ))}
          </tbody>
        </table>
      </div>

      <Rule />

      {/* BRAND TIER */}
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <SectionHead
            eyebrow="Budget vs premium"
            title="Brand-tier breakdown"
            hint="Average price per tier across the category."
          />
          <div className="card">
            <BarChart
              w={620} barH={36} gap={12}
              rows={brands.map(b => ({ label: b.tier, value: b.vs }))}
              format={v => `${v > 0 ? '+' : ''}${v}%`}
            />
            <div className="ink-2" style={{ fontSize: 12, marginTop: 12 }}>
              <strong>Save 28%</strong> by buying store brand vs standard, on average.
              Premium tier is on average +56% over standard — usually the brand is what you're paying for.
            </div>
          </div>
        </div>
        <div>
          <SectionHead
            eyebrow="Distribution"
            title={`Price spread inside ${c.name.toLowerCase()}`}
            hint={`From cheapest SKU to priciest, in kr/${c.name === 'Beverages' ? 'l' : 'kg'}.`}
          />
          <div className="card">
            <BoxPlot
              w={620} h={80}
              items={display.map(p => ({ name: p.name, value: p.unitPrice }))}
              range={[Math.min(...display.map(p=>p.unitPrice)) * 0.9, Math.max(...display.map(p=>p.unitPrice)) * 1.1]}
            />
            <div className="row between" style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              <span>cheapest: <strong>{Math.min(...display.map(p=>p.unitPrice)).toFixed(2)}</strong></span>
              <span>median</span>
              <span>priciest: <strong>{Math.max(...display.map(p=>p.unitPrice)).toFixed(2)}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPARE PAGE
// ============================================================
function ComparePage({ navigate }) {
  const [strategy, setStrategy] = useStateP1('single');
  const basketProducts = MY_BASKET.map(b => ({ ...b, product: findProduct(b.slug) })).filter(x => x.product);

  // Compute per-store basket total
  const storeTotals = STORES.map(s => {
    let total = 0, covered = 0;
    basketProducts.forEach(({ qty, product }) => {
      const price = product.chains[s.chain];
      if (price != null) { total += price * qty; covered++; }
      else { total += product.price * qty * 1.1; } // estimate w/ penalty
    });
    return { ...s, total: Math.round(total), coverage: covered, totalItems: basketProducts.length };
  }).sort((a, b) => a.total - b.total);

  const splitShop = useMemoP1(() => {
    // Pick cheapest store per item
    const assignments = basketProducts.map(({ qty, product }) => {
      const best = Object.entries(product.chains).sort(([, a], [, b]) => a - b)[0];
      return { product, qty, chain: best[0], price: best[1] };
    });
    const total = assignments.reduce((s, a) => s + a.price * a.qty, 0);
    const stores = [...new Set(assignments.map(a => a.chain))];
    return { assignments, total: Math.round(total), stops: stores.length };
  }, []);

  const singleBest = storeTotals[0];

  return (
    <div className="container" style={{ padding: '24px var(--container-pad)' }}>
      <Breadcrumbs trail={[{ label: 'Markets', route: 'home' }, { label: 'Compare' }]} navigate={navigate} />

      <div className="row between" style={{ marginTop: 16, alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Compare your basket <em>across every chain.</em></h1>
          <p className="ink-2" style={{ fontSize: 14, maxWidth: 640, marginTop: 8 }}>
            Same 10 items, priced everywhere. One trip vs. an optimal split shop.
            Coverage is shown — missing items are estimated with a transparent penalty.
          </p>
        </div>
        <div className="row gap-3">
          <button className="btn">Edit basket (10)</button>
          <button className="btn primary">Save comparison</button>
        </div>
      </div>

      {/* STRATEGY TOGGLE */}
      <div className="grid cols-2" style={{ marginTop: 28, gap: 16 }}>
        <div className={'card col gap-3'} style={{ borderColor: strategy === 'single' ? 'var(--ink)' : 'var(--rule)', borderWidth: 2, cursor: 'pointer' }} onClick={() => setStrategy('single')}>
          <div className="row between">
            <div className="eyebrow">Single-stop strategy</div>
            <span className="pill">1 trip</span>
          </div>
          <div className="display tnum" style={{ fontSize: 42 }}>{singleBest.total.toLocaleString('sv-SE')} <span className="unit">kr</span></div>
          <div className="ink-2" style={{ fontSize: 13 }}>
            All 10 items at <strong>{singleBest.name}</strong> · {singleBest.distance} km · saves
            <span className="up-text mono"> −{(1432 - singleBest.total).toLocaleString('sv-SE')} kr</span> vs the Stockholm median.
          </div>
        </div>
        <div className={'card col gap-3'} style={{ borderColor: strategy === 'split' ? 'var(--ink)' : 'var(--rule)', borderWidth: 2, cursor: 'pointer' }} onClick={() => setStrategy('split')}>
          <div className="row between">
            <div className="eyebrow">Split-shop strategy</div>
            <span className="pill">{splitShop.stops} trips</span>
          </div>
          <div className="display tnum" style={{ fontSize: 42 }}>{splitShop.total.toLocaleString('sv-SE')} <span className="unit">kr</span></div>
          <div className="ink-2" style={{ fontSize: 13 }}>
            Cheapest possible · saves an extra <span className="up-text mono">−{(singleBest.total - splitShop.total).toLocaleString('sv-SE')} kr</span> vs. single stop,
            but you visit {splitShop.stops} stores.
          </div>
        </div>
      </div>

      <Rule />

      {/* STORE LADDER */}
      <SectionHead
        eyebrow="Single-stop ladder"
        title="Every store, your basket"
        hint="Sorted cheapest first. Coverage shows how many of your 10 items each store actually stocks."
      />
      <div className="card nopad">
        <table className="tbl">
          <thead>
            <tr>
              <th>Store</th>
              <th>Chain</th>
              <th className="num">Distance</th>
              <th className="num">Coverage</th>
              <th className="num">Basket cost</th>
              <th className="num">vs cheapest</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {storeTotals.map((s, i) => (
              <tr key={s.slug} onClick={() => navigate('store', { slug: s.slug })}
                style={{ cursor: 'pointer' }} className={i === 0 ? 'cheapest' : ''}>
                <td><strong>{s.name}</strong> <span className="ink-3" style={{ fontSize: 11 }}>· {s.district}</span></td>
                <td><span className="pill" style={{ background: CHAINS[s.chain].color + '22', color: CHAINS[s.chain].color, borderColor: 'transparent' }}>{CHAINS[s.chain].name}</span></td>
                <td className="num">{s.distance} km</td>
                <td className="num">{s.coverage}/{s.totalItems}</td>
                <td className="num"><span className="display tnum" style={{ fontSize: 18 }}>{s.total.toLocaleString('sv-SE')} <span className="ink-3" style={{ fontSize: 11 }}>kr</span></span></td>
                <td className="num">
                  {i === 0 ? <span className="pill up">cheapest</span> : <span className="down-text mono">+{(s.total - storeTotals[0].total)} kr</span>}
                </td>
                <td><ConfBadge level={s.coverage >= 8 ? 'high' : s.coverage >= 5 ? 'medium' : 'low'} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Rule />

      {/* SPLIT SHOP DETAILS */}
      <SectionHead
        eyebrow="Split-shop plan"
        title={`Where to buy each item to save ${(singleBest.total - splitShop.total).toLocaleString('sv-SE')} kr`}
        hint="Grouped by chain. Most savings come from a single second stop."
      />
      <div className="grid cols-3">
        {Array.from(new Set(splitShop.assignments.map(a => a.chain))).map(cid => {
          const items = splitShop.assignments.filter(a => a.chain === cid);
          const subtotal = items.reduce((s, a) => s + a.price * a.qty, 0);
          const ch = CHAINS[cid];
          return (
            <div key={cid} className="card col gap-3">
              <div className="row between">
                <div className="row gap-2">
                  <span style={{ width: 10, height: 10, background: ch.color, borderRadius: 100, display: 'inline-block' }} />
                  <strong>{ch.name}</strong>
                </div>
                <span className="pill">{items.length} items</span>
              </div>
              <div className="col gap-2">
                {items.map((a, i) => (
                  <div key={i} className="row between" style={{ fontSize: 13 }}>
                    <span>{a.product.name} <span className="ink-3 mono" style={{ fontSize: 11 }}>×{a.qty}</span></span>
                    <span className="mono tnum">{fmtSEK(a.price * a.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="row between" style={{ borderTop: '1px solid var(--rule)', paddingTop: 10 }}>
                <span className="eyebrow">Subtotal</span>
                <span className="display tnum" style={{ fontSize: 22 }}>{fmtSEK(subtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { HomePage, ProductPage, StorePage, CategoryPage, ComparePage });
