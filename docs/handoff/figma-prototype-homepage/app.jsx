/* GroceryView v2 — app shell + routing + tweaks */

const { useState, useEffect, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "mode": "light",
  "palette": "default",
  "domainThemes": true,
  "density": "default",
  "showSparklines": true
}/*EDITMODE-END*/;

function App() {
  const [country, setCountry] = useState(() => localStorage.getItem('gv-country') || 'SE');
  const [municipality, setMunicipality] = useState(() => localStorage.getItem('gv-municipality') || COUNTRIES[localStorage.getItem('gv-country') || 'SE'].city);
  const [postcode, setPostcode] = useState(() => localStorage.getItem('gv-postcode') || '');
  const [sector, setSector] = useState(() => localStorage.getItem('gv-sector') || 'groceries');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('gv-sidebar-v2') === 'true');
  const [overview, setOverview] = useState(true);
  const [route, setRoute] = useState(() => {
    const h = window.location.hash.replace('#', '');
    return (h.split('/')[0]) || 'home';
  });
  const [params, setParams] = useState(() => {
    const h = window.location.hash.replace('#', '');
    const slug = h.split('/')[1];
    return slug ? { slug } : {};
  });
  const t = window.useTweaks(TWEAK_DEFAULTS);

  // Persist
  useEffect(() => { localStorage.setItem('gv-country', country); }, [country]);
  useEffect(() => { localStorage.setItem('gv-municipality', municipality); }, [municipality]);
  useEffect(() => { localStorage.setItem('gv-postcode', postcode); }, [postcode]);
  useEffect(() => { localStorage.setItem('gv-sector', sector); }, [sector]);
  useEffect(() => { localStorage.setItem('gv-sidebar-v2', sidebarCollapsed); }, [sidebarCollapsed]);

  // Keep municipality valid for the selected country (reset to capital on country switch)
  const setCountrySafe = (code) => {
    setCountry(code);
    const list = municipalitiesFor(code);
    if (!list.some(m => m.name === municipality)) setMunicipality(COUNTRIES[code].city);
  };

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', t.mode || 'light');
    document.documentElement.setAttribute('data-palette', t.palette || 'default');
    document.documentElement.setAttribute('data-density', t.density || 'default');
  }, [t.mode, t.palette, t.density]);

  // Per-domain theme: accent + paper warmth shift with the active sector
  useEffect(() => {
    if (t.domainThemes !== false) document.documentElement.setAttribute('data-sector', sector);
    else document.documentElement.removeAttribute('data-sector');
  }, [sector, t.domainThemes]);

  const navigate = (r, p = {}) => {
    if (p.sector) { setSector(p.sector); }
    setOverview(r === 'home' && p.overview === true);
    setRoute(r);
    setParams(p);
    window.scrollTo(0, 0);
    const hashStr = r + (p.slug ? `/${p.slug}` : '');
    history.replaceState(null, '', '#' + hashStr);
  };

  // Hash listener
  useEffect(() => {
    const onPop = () => {
      const h = window.location.hash.replace('#', '');
      const [r, slug] = h.split('/');
      setRoute(r || 'home');
      setParams(slug ? { slug } : {});
    };
    window.addEventListener('hashchange', onPop);
    return () => window.removeEventListener('hashchange', onPop);
  }, []);

  // Cmd-K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('search');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Allow CustomEvent navigation
  useEffect(() => {
    const onNav = (e) => navigate(e.detail.route, e.detail.params || {});
    window.addEventListener('nav', onNav);
    return () => window.removeEventListener('nav', onNav);
  }, []);

  let page;
  switch (route) {
    case 'home':       page = <HomePage />; break;
    case 'product':    page = <ProductPage slug={params.slug} />; break;
    case 'compare':    page = <ComparePage />; break;
    case 'deals':      page = <DealsPage />; break;
    case 'map':        page = <MapPage />; break;
    case 'store':      page = <StorePage slug={params.slug} />; break;
    case 'category':   page = <CategoryPage slug={params.slug} />; break;
    case 'watchlist':  page = <WatchlistPage />; break;
    case 'basket':     page = <BasketPage />; break;
    case 'search':     page = <SearchPage />; break;
    case 'about':      page = <AboutPage />; break;
    case 'dashboard':  page = <DashboardPage />; break;
    case 'browse':     page = <BrowsePage />; break;
    case 'fuel':       page = <FuelPage />; break;
    case 'pharmacy':   page = <PharmacyPage />; break;
    default:           page = <HomePage />;
  }

  // Don't show sector tabs on dashboard or about pages
  const showSectorTabs = ['home'].includes(route);

  return (
    <AppContext.Provider value={{ country, setCountry: setCountrySafe, municipality, setMunicipality, postcode, setPostcode, sector, setSector, navigate, route, params, overview, setOverview }}>
      <div data-screen-label={`${route}${params.slug ? '/' + params.slug : ''}`}>
        <TopBar navigate={navigate} route={route} country={country} setCountry={setCountrySafe} basketCount={MY_BASKET_DEFAULT.length} sector={sector} setSector={setSector} showSectors={showSectorTabs} municipality={municipality} setMunicipality={setMunicipality} postcode={postcode} setPostcode={setPostcode} sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(v => !v)} setOverview={setOverview} overview={overview} />
        <div className="app-layout">
          <SideNav route={route} navigate={navigate} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
          <div className="app-main">
            <div key={route + (params.slug || '') + country + sector}>
              {page}
            </div>
            <Footer navigate={navigate} country={country} />
          </div>
        </div>
        <FloatingNav navigate={navigate} route={route} />
      </div>

      <TweaksPanel title="Tweaks" defaultPosition={{ right: 20, top: 120 }}>
        <TweakSection title="Mode">
          <TweakRadio label="Mode" value={t.mode}
            options={[{value:'light',label:'Light'},{value:'dark',label:'Dark'}]}
            onChange={v => t.setTweak('mode', v)} />
        </TweakSection>
        <TweakSection title="Domain themes">
          <TweakToggle label="Colour-code each domain" value={t.domainThemes} onChange={v => t.setTweak('domainThemes', v)} />
          {t.domainThemes && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              {[['Mat','oklch(48% 0.16 38)'],['Drivmedel','oklch(44% 0.095 245)'],['Apotek','oklch(44% 0.10 162)'],['Skönhet','oklch(46% 0.105 350)']].map(([label, col]) => (
                <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--ink-2)' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: col, flexShrink: 0 }}></span>{label}
                </span>
              ))}
            </div>
          )}
          {!t.domainThemes && (
            <div style={{ marginTop: 10 }}>
              <TweakColor label="Accent" value={t.palette}
                options={[
                  {value:'default', swatch:'oklch(48% 0.16 38)',  label:'Terracotta'},
                  {value:'forest',  swatch:'oklch(40% 0.14 152)', label:'Forest'},
                  {value:'navy',    swatch:'oklch(34% 0.14 250)', label:'Navy'},
                  {value:'ink',     swatch:'oklch(28% 0.02 250)', label:'Ink'},
                ]}
                onChange={v => t.setTweak('palette', v)} />
            </div>
          )}
        </TweakSection>
        <TweakSection title="Density">
          <TweakRadio label="Spacing" value={t.density}
            options={[{value:'compact',label:'Compact'},{value:'default',label:'Default'},{value:'roomy',label:'Roomy'}]}
            onChange={v => t.setTweak('density', v)} />
        </TweakSection>
        <TweakSection title="Display">
          <TweakToggle label="Show sparklines" value={t.showSparklines} onChange={v => t.setTweak('showSparklines', v)} />
        </TweakSection>
      </TweaksPanel>
    </AppContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
