/* GroceryView v3 — BROWSE / CATALOG PAGE
   Sort-by-category, filters (price, brand, deals, country), grid + list views.
   Every product is a link to /product. */

const { useState: useStateB, useMemo: useMemoB } = React;

function BrowsePage() {
  const { country, navigate, sector: activeSector } = useApp();
  const c = COUNTRIES[country];
  const [sector, setSector] = useStateB(activeSector || 'all');
  const [category, setCategory] = useStateB('all');
  const [brand, setBrand] = useStateB('all');
  const [dealsOnly, setDealsOnly] = useStateB(false);
  const [sort, setSort] = useStateB('popular');
  const [view, setView] = useStateB('grid');
  const [search, setSearch] = useStateB('');
  const [priceMax, setPriceMax] = useStateB(null);

  const products = useMemoB(() => {
    let list = ALL_PRODUCTS.filter(p => priceOf(p, country) != null);
    if (sector !== 'all') list = list.filter(p => p.sector === sector);
    if (category !== 'all') list = list.filter(p => p.category === category);
    if (brand !== 'all') list = list.filter(p => (p.brand || '').toLowerCase() === brand.toLowerCase());
    if (dealsOnly) list = list.filter(p => p.regular?.[country] && priceOf(p, country) < p.regular[country] * 0.85);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q));
    }
    if (priceMax) list = list.filter(p => priceOf(p, country) <= priceMax);
    switch (sort) {
      case 'price-asc':  list = list.slice().sort((a, b) => priceOf(a, country) - priceOf(b, country)); break;
      case 'price-desc': list = list.slice().sort((a, b) => priceOf(b, country) - priceOf(a, country)); break;
      case 'discount':   list = list.slice().sort((a, b) => {
        const da = a.regular?.[country] ? (a.regular[country] - priceOf(a, country)) / a.regular[country] : 0;
        const db = b.regular?.[country] ? (b.regular[country] - priceOf(b, country)) / b.regular[country] : 0;
        return db - da;
      }); break;
      case 'trending':   list = list.slice().sort((a, b) => {
        const tA = (a.sparkline[a.sparkline.length-1] - a.sparkline[0]) / a.sparkline[0];
        const tB = (b.sparkline[b.sparkline.length-1] - b.sparkline[0]) / b.sparkline[0];
        return tA - tB;
      }); break;
      default: break;
    }
    return list;
  }, [country, sector, category, brand, dealsOnly, sort, search, priceMax]);

  // Brand options
  const brands = useMemoB(() => {
    const set = new Set();
    ALL_PRODUCTS.forEach(p => { if (p.brand) set.add(p.brand); });
    return Array.from(set).sort();
  }, []);

  // Sector → categories
  const visibleCats = useMemoB(() => {
    if (sector === 'pharmacy') return [
      { slug: 'pain', name: 'Pain relief' },
      { slug: 'vitamins', name: 'Vitamins' },
      { slug: 'wellness', name: 'Wellness' },
      { slug: 'oral', name: 'Oral care' },
    ];
    if (sector === 'beauty') return CATEGORIES.filter(cat => cat.sector === 'beauty');
    if (sector === 'fuel') return [];
    return CATEGORIES.filter(cat => !cat.sector);
  }, [sector]);

  return (
    <main className="fade-in">
      <div className="container" style={{ padding: '32px 0 0' }}>
        <Breadcrumb trail={[{ label: 'Home', route: 'home' }, { label: 'Browse' }]} />

        {/* HEADER */}
        <div className="row between" style={{ marginTop: 16, alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="eyebrow">— Catalog</div>
            <h1 className="page-title" style={{ marginTop: 6 }}>
              Browse <em>everything</em> <span className="mono" style={{ fontFamily: 'var(--mono)', fontSize: 24, color: 'var(--ink-3)', marginLeft: 8 }}>· {ALL_PRODUCTS.length} items</span>
            </h1>
            <p className="page-sub">All tracked products in {c.city}. Filter, sort, find what you need in seconds.</p>
          </div>
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <div className="tabs">
              <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><Icon name="grid" size={13} /> GRID</button>
              <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><Icon name="list" size={13} /> LIST</button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTOR PILLS — sticky */}
      <div style={{ background: 'var(--bg)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', marginTop: 24, position: 'sticky', top: 56, zIndex: 20 }}>
        <div className="container">
          <div className="row between" style={{ padding: '12px 0', flexWrap: 'wrap', gap: 12 }}>
            <div className="row gap-2 wrap">
              {[
                { id: 'all', icon: 'grid', label: 'All', count: ALL_PRODUCTS.length },
                { id: 'groceries', icon: 'cart', label: 'Groceries', count: GROCERY_PRODUCTS.length },
                { id: 'fuel', icon: 'fuel', label: 'Fuel', count: FUEL_PRODUCTS.length },
                { id: 'pharmacy', icon: 'pillCapsule', label: 'Pharmacy', count: PHARMACY_PRODUCTS.length },
                { id: 'beauty', icon: 'lipstick', label: 'Beauty', count: BEAUTY_PRODUCTS.length },
              ].map(s => (
                <button key={s.id} className={'btn sm ' + (sector === s.id ? 'primary' : '')}
                  onClick={() => { setSector(s.id); setCategory('all'); }}>
                  <Icon name={s.icon} size={14} />
                  <span>{s.label}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, opacity: 0.7 }}>{s.count}</span>
                </button>
              ))}
            </div>
            <div className="row gap-2" style={{ alignItems: 'center' }}>
              <input className="input" style={{ height: 32, width: 200, fontSize: 12 }} placeholder="Search by name or brand…"
                value={search} onChange={e => setSearch(e.target.value)} />
              <div className="tabs">
                <button className={sort === 'popular' ? 'active' : ''} onClick={() => setSort('popular')}>POPULAR</button>
                <button className={sort === 'price-asc' ? 'active' : ''} onClick={() => setSort('price-asc')}>↑ PRICE</button>
                <button className={sort === 'price-desc' ? 'active' : ''} onClick={() => setSort('price-desc')}>↓ PRICE</button>
                <button className={sort === 'discount' ? 'active' : ''} onClick={() => setSort('discount')}>DEALS</button>
                <button className={sort === 'trending' ? 'active' : ''} onClick={() => setSort('trending')}>TRENDING</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '24px 0 64px' }}>
        <div className="grid" style={{ gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'flex-start' }}>
          {/* FILTERS */}
          <aside className="col gap-5" style={{ position: 'sticky', top: 130 }}>
            <div className="card no-pad">
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--rule)' }}>
                <div className="eyebrow">— Filters</div>
              </div>

              {/* Category filter */}
              {visibleCats.length > 0 && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--rule)' }}>
                  <div className="eyebrow" style={{ fontSize: 10, marginBottom: 8 }}>Category</div>
                  <div className="col gap-1">
                    <FilterRow active={category === 'all'} label="All" onClick={() => setCategory('all')} />
                    {visibleCats.map(cat => (
                      <FilterRow key={cat.slug} active={category === cat.slug}
                        label={cat.name}
                        icon={iconForCategory(cat.slug)}
                        meta={cat.count}
                        onClick={() => setCategory(cat.slug)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Brand filter */}
              {brands.length > 0 && sector !== 'fuel' && (
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--rule)' }}>
                  <div className="eyebrow" style={{ fontSize: 10, marginBottom: 8 }}>Brand</div>
                  <div className="col gap-1" style={{ maxHeight: 200, overflowY: 'auto' }}>
                    <FilterRow active={brand === 'all'} label="All brands" onClick={() => setBrand('all')} />
                    {brands.slice(0, 12).map(b => (
                      <FilterRow key={b} active={brand === b} label={b} onClick={() => setBrand(b)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Price max */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--rule)' }}>
                <div className="eyebrow" style={{ fontSize: 10, marginBottom: 8 }}>Max price</div>
                <div className="col gap-1">
                  {[null, 50, 100, 200].map(v => (
                    <FilterRow key={v} active={priceMax === v}
                      label={v === null ? 'Any' : `≤ ${v} ${c.currency}`}
                      onClick={() => setPriceMax(v)} />
                  ))}
                </div>
              </div>

              {/* Deals only */}
              <div style={{ padding: '12px 16px' }}>
                <label className="row gap-2" style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  <input type="checkbox" checked={dealsOnly} onChange={e => setDealsOnly(e.target.checked)} />
                  <span>On deal only</span>
                  <span className="pill brand" style={{ marginLeft: 'auto' }}>−15%+</span>
                </label>
              </div>
            </div>

            <button className="btn" style={{ width: '100%' }} onClick={() => {
              setSector('all'); setCategory('all'); setBrand('all'); setDealsOnly(false); setSearch(''); setPriceMax(null);
            }}>Clear all filters</button>
          </aside>

          {/* RESULTS */}
          <div>
            <div className="row between" style={{ marginBottom: 16 }}>
              <div className="eyebrow">
                {products.length} {products.length === 1 ? 'product' : 'products'}
                {category !== 'all' && <> in {findCategory(category)?.name || category}</>}
                {brand !== 'all' && <> · {brand}</>}
                {dealsOnly && <> · On deal</>}
              </div>
              <div className="eyebrow">SHOWING ALL</div>
            </div>

            {view === 'grid' && (
              <div className="grid grid-4">
                {products.map(p => <ProductTile key={p.slug} product={p} />)}
              </div>
            )}

            {view === 'list' && (
              <div className="card no-pad">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Product</th>
                      <th>Brand</th>
                      <th>Size</th>
                      <th>Cheapest at</th>
                      <th className="num">Price</th>
                      <th className="num">Reg.</th>
                      <th className="num">Save</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const price = priceOf(p, country);
                      const regular = p.regular?.[country];
                      const cheapest = cheapestChainOf(p, country);
                      const trend = ((p.sparkline[p.sparkline.length-1] - p.sparkline[0]) / p.sparkline[0]) * 100;
                      return (
                        <tr key={p.slug} style={{ cursor: 'pointer' }} onClick={() => navigate('product', { slug: p.slug })}>
                          <td style={{ width: 48 }}><span className="ico-chip" style={{ width: 30, height: 30 }}><Icon name={iconForProduct(p)} size={17} /></span></td>
                          <td>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 14 }}>{p.name}</div>
                          </td>
                          <td>{p.brand && <span className="pill">{p.brand}</span>}</td>
                          <td><span className="mono" style={{ fontSize: 11 }}>{p.size || p.unit}</span></td>
                          <td>{cheapest && <StoreChip chain={cheapest} />}</td>
                          <td className="num"><strong>{fmtPrice(price, country)}</strong></td>
                          <td className="num" style={{ color: 'var(--ink-3)', textDecoration: 'line-through' }}>{regular ? fmtPrice(regular, country) : '—'}</td>
                          <td className="num">
                            {regular && price < regular ? (
                              <span className="pill solid-save">−{Math.round((1 - price/regular) * 100)}%</span>
                            ) : '—'}
                          </td>
                          <td>
                            <div className="row gap-2" style={{ alignItems: 'center' }}>
                              <Sparkline values={p.sparkline} w={60} h={20} color={trend < 0 ? 'var(--up)' : 'var(--down)'} fill={false} />
                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: trend < 0 ? 'var(--up)' : 'var(--down)' }}>
                                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {products.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: 64 }}>
                <div className="row" style={{ justifyContent: 'center', marginBottom: 16, color: 'var(--ink-3)' }}><Icon name="search" size={48} stroke={1.4} /></div>
                <h3 className="section-title">No products match</h3>
                <p className="page-sub" style={{ margin: '8px auto 0' }}>Try removing some filters to see more products.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function FilterRow({ active, label, meta, icon, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', padding: '6px 8px', borderRadius: 'var(--r-sm)',
      background: active ? 'var(--ink)' : 'transparent',
      color: active ? 'var(--bg)' : 'var(--ink-2)',
      border: 'none', font: 'inherit', fontSize: 12, fontWeight: active ? 600 : 500,
      cursor: 'pointer', textAlign: 'left',
    }}>
      <span className="row gap-2" style={{ alignItems: 'center', minWidth: 0 }}>{icon && <Icon name={icon} size={13} />}<span>{label}</span></span>
      {meta != null && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, opacity: 0.7 }}>{meta}</span>}
    </button>
  );
}

Object.assign(window, { BrowsePage });
