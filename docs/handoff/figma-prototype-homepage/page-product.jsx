/* GroceryView v2 — PRODUCT DETAIL PAGE
   Friendly, photo-first, plain language, every related product clickable. */

const { useState: useStateP, useMemo: useMemoP, useEffect: useEffectP } = React;

function ProductPage({ slug }) {
  const { country, navigate, sector, setSector } = useApp();
  const p = findProduct(slug) || GROCERY_PRODUCTS[0];
  const [tf, setTf] = useStateP('90d');
  const c = COUNTRIES[country];

  // keep the domain theme in sync with the product being viewed
  useEffectP(() => { if (p.sector && p.sector !== sector) setSector(p.sector); }, [p.sector]);

  const price = priceOf(p, country);
  const regular = p.regular?.[country];
  const low52 = p.low52?.[country];
  const high52 = p.high52?.[country];
  const chains = chainsOf(p, country);
  const cheapestChainId = cheapestChainOf(p, country);

  if (!price) return <div className="container" style={{ padding: 48 }}>This product is not tracked in {c.name} yet.</div>;

  // Verdict
  const pct = ((price - low52) / (high52 - low52)) * 100;
  const verdict = pct < 30 ? { txt: 'GREAT TIME TO BUY', color: 'var(--brand)', icon: 'target', desc: `This is among the cheapest prices we've seen all year.` } :
                   pct < 70 ? { txt: 'NORMAL PRICE',      color: 'var(--save-deep)', icon: 'thumbsUp', desc: `Typical price right now. Buy if you need it.` } :
                              { txt: 'WAIT FOR A DEAL',   color: 'var(--hot)', icon: 'pause', desc: `Priced near the year's high. We'd wait.` };

  // 90-day history scaled for this product
  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 180, 'all': 180 }[tf];
  const history = PRICE_HISTORY_LONG.slice(-days).map(d => ({
    date: d.date,
    price: (d.price / 72) * price,
  }));

  // Sort chain rows
  const chainRows = Object.entries(chains).map(([chainId, p]) => {
    const ch = CHAINS[chainId];
    const cheapest = Math.min(...Object.values(chains));
    return { chainId, ch, price: p, vsCheapest: ((p - cheapest) / cheapest) * 100, isCheapest: p === cheapest };
  }).sort((a, b) => a.price - b.price);

  // Smart swaps - same category
  const swaps = ALL_PRODUCTS.filter(x => x.category === p.category && x.slug !== p.slug && priceOf(x, country) != null).slice(0, 4);

  // Related products
  const related = ALL_PRODUCTS.filter(x => x.sector === p.sector && x.slug !== p.slug && priceOf(x, country) != null).slice(0, 6);

  return (
    <main className="fade-in" style={{ background: 'var(--bg)' }}>
      <div className="container" style={{ padding: '20px 0 64px' }}>
        <Breadcrumb trail={[
          { label: 'Home', route: 'home' },
          { label: SECTORS[p.sector]?.name || 'Groceries', route: 'home', params: { sector: p.sector } },
          { label: findCategory(p.category)?.name || p.category, route: 'category', params: { slug: p.category } },
          { label: p.name },
        ]} />

        {/* HERO */}
        <div className="grid" style={{ gridTemplateColumns: '1fr 1.2fr', gap: 32, marginTop: 24, alignItems: 'start' }}>
          {/* IMAGE */}
          <div>
            <div className="ico-media" style={{ borderRadius: 'var(--r-lg)', border: '1px solid var(--rule)', aspectRatio: '1 / 1', position: 'relative', overflow: 'hidden' }}>
              <img src={imageForProduct(p)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {regular > price && (
                <span className="tile-badge" style={{ top: 16, left: 16, fontSize: 13, padding: '5px 11px' }}>
                  Save −{Math.round((1 - price/regular) * 100)}%
                </span>
              )}
            </div>
            <div className="row gap-2" style={{ marginTop: 12, justifyContent: 'center' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="ico-media" style={{
                  width: 56, height: 56, borderRadius: 'var(--r-sm)', overflow: 'hidden',
                  border: i === 1 ? '1.5px solid var(--ink)' : '1px solid var(--rule)',
                  cursor: 'pointer', opacity: i === 1 ? 1 : 0.5,
                }}>
                  <img src={imageForProduct(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>

          {/* INFO */}
          <div className="col gap-4">
            <div className="row gap-2">
              {p.brand && <span className="pill">{p.brand}</span>}
              {p.size && <span className="pill">{p.size}</span>}
              {p.otc && <span className="pill info">Receptfri (OTC)</span>}
              <span className="verified"><Icon name="check" size={13} /> Verified today</span>
            </div>
            <h1 className="page-title" style={{ fontSize: 40 }}>{p.name}</h1>

            {/* PRICE */}
            <div className="card brand">
              <div className="row between" style={{ alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand-deep)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Cheapest right now at
                  </div>
                  <div className="row gap-2" style={{ marginTop: 6 }}>
                    {cheapestChainId && <StoreChip chain={cheapestChainId} />}
                  </div>
                  <div style={{ fontSize: 50, fontWeight: 700, fontFamily: 'var(--mono)', letterSpacing: '-0.02em', lineHeight: 1, marginTop: 12, color: 'var(--brand-deep)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtPrice(price, country)}
                  </div>
                  {jamforpris(p, country) && (
                    <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-2)' }}>
                      <span style={{ color: 'var(--ink-3)' }}>Comparison price</span> {jamforpris(p, country)}
                    </div>
                  )}
                  {regular > price && (
                    <div style={{ marginTop: 4, fontSize: 14, color: 'var(--ink-2)' }}>
                      Reg. <span style={{ textDecoration: 'line-through' }}>{fmtPrice(regular, country)}</span>
                      <strong style={{ color: 'var(--brand)', marginLeft: 8 }}>− {fmtPrice(regular - price, country)}</strong>
                    </div>
                  )}
                </div>
                <div className="col gap-2">
                  <button className="btn lg primary"><Icon name="plus" size={15} /> Add to basket</button>
                  <button className="btn lg"><Icon name="heart" size={15} /> Watch price</button>
                </div>
              </div>
            </div>

            {/* VERDICT */}
            <div className="row gap-4" style={{ padding: 18, background: 'var(--bg-2)', borderRadius: 'var(--r-md)', border: '1px solid var(--rule)' }}>
              <span className="ico-chip" style={{ width: 48, height: 48, color: verdict.color, borderColor: verdict.color, background: 'var(--surface)' }}><Icon name={verdict.icon} size={26} /></span>
              <div style={{ flex: 1 }}>
                <div className="eyebrow">Our take</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: verdict.color, marginTop: 2 }}>{verdict.txt}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 4 }}>{verdict.desc}</div>
                {/* range */}
                <div style={{ marginTop: 12 }}>
                  <div className="row between" style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>
                    <span>52-week low {fmtPrice(low52, country)}</span>
                    <span>52-week high {fmtPrice(high52, country)}</span>
                  </div>
                  <div className="bar-track" style={{ position: 'relative', height: 10 }}>
                    <div className="bar-fill" style={{ width: '100%', background: 'linear-gradient(90deg, var(--brand) 0%, var(--save) 50%, var(--hot) 100%)', opacity: 0.5 }} />
                    <div style={{ position: 'absolute', top: -3, left: `${pct}%`, transform: 'translateX(-50%)', width: 16, height: 16, background: 'white', border: '3px solid var(--ink)', borderRadius: 100, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRICE TREND */}
        <Section
          eyebrow="Price trend"
          title="How the price has moved"
          subtitle="Lowest available price across all chains each day. The shaded zones show where this price is great vs expensive."
          action={
            <div className="tabs">
              {['7d', '30d', '90d', '1y', 'all'].map(t => (
                <button key={t} className={tf === t ? 'active' : ''} onClick={() => setTf(t)}>{t.toUpperCase()}</button>
              ))}
            </div>
          }>
          <div className="card">
            <PriceChart
              data={history}
              w={1240} h={320}
              color="var(--brand)"
              lowMark={low52}
              highMark={high52}
              currentMark={price}
              marketBands={true}
            />
            <div className="row gap-8" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
              <ProductStatTile label="Today" value={fmtPrice(price, country)} color="var(--brand)" />
              <ProductStatTile label="Last week"  value={fmtPrice(price * 1.08, country)} sub={fmtPct(-7.4)} />
              <ProductStatTile label="52-week low" value={fmtPrice(low52, country)} />
              <ProductStatTile label="52-week high" value={fmtPrice(high52, country)} />
              <ProductStatTile label="Typical"     value={fmtPrice((low52 + high52) / 2, country)} sub="average" />
              <ProductStatTile label="Updated"     value="3 min ago" sub="● live" />
            </div>
          </div>
        </Section>

        {/* CHAIN COMPARISON */}
        <Section
          eyebrow="Where to buy"
          title="Same product, every chain compared"
          subtitle="Click a chain to see all branches that stock it.">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Chain</th>
                  <th className="num">Price</th>
                  <th className="num">vs cheapest</th>
                  <th>Bar comparison</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {chainRows.map(r => (
                  <tr key={r.chainId} className={r.isCheapest ? 'best' : ''}>
                    <td>
                      <div className="row gap-3">
                        <ChainSwatch chain={r.ch} size={32} />
                        <div>
                          <strong style={{ fontSize: 15 }}>{r.ch.name}</strong>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.ch.tier}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num">
                      <div style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{fmtPrice(r.price, country)}</div>
                    </td>
                    <td className="num">
                      {r.isCheapest
                        ? <span className="pill brand">CHEAPEST</span>
                        : <span className="pill hot">+{r.vsCheapest.toFixed(1)}%</span>}
                    </td>
                    <td>
                      <div className="bar-track" style={{ height: 8, maxWidth: 280 }}>
                        <div className="bar-fill" style={{ width: `${(r.price / Math.max(...chainRows.map(x => x.price))) * 100}%`, background: r.ch.color }} />
                      </div>
                    </td>
                    <td>
                      <div className="row gap-2">
                        <button className="btn sm primary">＋ Add</button>
                        <button className="btn sm ghost">Map</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* TWO COLUMN: SWAPS + ALERT */}
        <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 24, marginTop: 48 }}>
          {/* SMART SWAPS */}
          <div>
            <div className="row between" style={{ marginBottom: 20, alignItems: 'flex-end' }}>
              <div>
                <div className="eyebrow">Similar &amp; cheaper</div>
                <h2 className="section-title" style={{ marginTop: 6 }}>You might also like</h2>
                <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 4 }}>Same category, often cheaper.</div>
              </div>
            </div>
            <div className="grid grid-2">
              {swaps.map(s => <ProductTile key={s.slug} product={s} />)}
            </div>
          </div>

          {/* PRICE ALERT */}
          <div>
            <div className="row between" style={{ marginBottom: 20, alignItems: 'flex-end' }}>
              <div>
                <div className="eyebrow">Tell me when</div>
                <h2 className="section-title" style={{ marginTop: 6 }}>Price alert</h2>
              </div>
            </div>
            <div className="card col gap-3">
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                We'll email you the moment the price drops below your target. Free, no spam.
              </div>
              <label className="col gap-2">
                <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>Alert me when below</span>
                <input className="input" defaultValue={(price * 0.9).toFixed(2)} />
              </label>
              <div className="row gap-2" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                <span className="pill">Suggested: {fmtPrice(price * 0.9, country)}</span>
                <span className="pill">52w low: {fmtPrice(low52, country)}</span>
              </div>
              <button className="btn primary">Set alert →</button>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', marginTop: 4 }}>
                312 people are watching this product
              </div>
            </div>

            {/* WHEN ON PROMO */}
            <div className="card col gap-3" style={{ marginTop: 16 }}>
              <div className="eyebrow">Promo cadence</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Usually drops every ~22 days</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Last promo: 3 days ago. Next expected window: 2 weeks.</div>
              <div className="row gap-1" style={{ marginTop: 8 }}>
                {Array.from({ length: 28 }, (_, i) => (
                  <div key={i} style={{
                    width: 10, height: 28, borderRadius: 3,
                    background: [3, 7, 8, 22, 23, 24].includes(i) ? 'var(--brand)' : i === 25 ? 'var(--ink-3)' : 'var(--bg-2)',
                  }} title={`Day -${28 - i}`} />
                ))}
              </div>
              <div className="row between" style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4 }}>
                <span>4 weeks ago</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* RELATED IN SECTOR */}
        <Section
          eyebrow="Continue browsing"
          title={`More in ${SECTORS[p.sector]?.name || 'Groceries'}`}>
          <div className="grid grid-6" style={{ gap: 12 }}>
            {related.map(r => (
              <a key={r.slug} className="col gap-2" style={{ cursor: 'pointer' }}
                onClick={() => navigate('product', { slug: r.slug })}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                <div className="ico-media" style={{ aspectRatio: '1 / 1', borderRadius: 'var(--r-md)', border: '1px solid var(--rule)', overflow: 'hidden' }}><img src={imageForProduct(r)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{fmtPrice(priceOf(r, country), country)}</div>
              </a>
            ))}
          </div>
        </Section>
      </div>
    </main>
  );
}

function ProductStatTile({ label, value, sub, color }) {
  return (
    <div className="col gap-1">
      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{sub}</div>}
    </div>
  );
}

Object.assign(window, { ProductPage });
