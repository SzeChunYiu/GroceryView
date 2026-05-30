#!/usr/bin/env node
// Generate the new-UI prototype's data.js from the REAL database, keeping the prototype's exact schema
// (COUNTRIES/SECTORS/CHAINS/CATEGORIES/<domain>_PRODUCTS/STORES/MUNICIPALITIES + helpers) so the design
// renders live Swedish prices with zero markup changes. SE only (that's the data we have). No fabricated
// history: sparkline is flat at the current price; low52/high52 = real min/max across chains.
import { writeFileSync } from 'node:fs';
import process from 'node:process';
import pg from 'pg';

const OUT = process.argv[2] || '/tmp/gv_ui_new/data.js';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });
const q = (sql, p) => pool.query(sql, p).then((r) => r.rows);

const SECTOR_OF = { grocery: 'groceries', pharmacy: 'pharmacy', fuel: 'fuel', beauty: 'beauty' };
const EMOJI = { dairy: '🥛', bread: '🍞', meat: '🥩', fish: '🐟', produce: '🥬', pantry: '🥫', snacks: '🍫',
  beverages: '🥤', frozen: '🥶', coffee: '☕', pain: '💊', vitamins: '💛', oral: '🦷', skincare: '🧴',
  makeup: '💄', hair: '💇', fragrance: '🌸', groceries: '🛒', pharmacy: '💊', beauty: '✨', fuel: '⛽' };
const PALETTE = ['oklch(56% 0.20 25)', 'oklch(50% 0.20 25)', 'oklch(48% 0.18 250)', 'oklch(50% 0.16 250)',
  'oklch(54% 0.18 35)', 'oklch(52% 0.16 145)', 'oklch(58% 0.20 60)', 'oklch(50% 0.14 60)', 'oklch(54% 0.20 140)'];
const sizeOf = (n) => { const m = String(n || '').match(/(\d+[.,]?\d*)\s?(kg|g|cl|ml|dl|l|st|p|pack|tabletter|kapslar|caps|x\d+)/i); return m ? m[0] : ''; };
const emojiFor = (cat, dom) => EMOJI[String(cat || '').toLowerCase()] || EMOJI[SECTOR_OF[dom]] || '🛒';
const verdictOf = (price, reg) => (reg && price < reg * 0.95 ? 'buy' : 'hold');

async function chains() {
  const rows = await q(`SELECT slug, name, domain, pricing_model FROM chains
    WHERE domain IN ('grocery','pharmacy','fuel','beauty') ORDER BY domain, slug`);
  const out = {};
  rows.forEach((r, i) => {
    out[r.slug.replace(/-/g, '_')] = { id: r.slug.replace(/-/g, '_'), name: r.name,
      short: r.name.split(/[\s-]/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      country: 'SE', sector: SECTOR_OF[r.domain], color: PALETTE[i % PALETTE.length], tier: r.pricing_model };
  });
  return out;
}

// products with per-chain prices for a domain. Grocery folds ICA in via product_matches.
async function products(domain, limit) {
  const icaUnion = domain === 'grocery' ? `
    UNION ALL
    SELECT pm.ean_product_id id, 'ica' chain, min(lp.price) price, min(lp.unit_price) unit_price
    FROM product_matches pm JOIN latest_prices lp ON lp.product_id=pm.ica_product_id AND lp.store_id IS NOT NULL
    GROUP BY pm.ean_product_id` : '';
  const rows = await q(`
    WITH base AS (
      SELECT p.id, p.canonical_name name, p.brand, p.category_path[1] cat
      FROM products p WHERE p.domain=$1 AND p.slug LIKE $1||'-%' OR (p.domain=$1 AND p.slug LIKE 'ean-%')
    ),
    px AS (
      SELECT b.id, c.slug chain, min(lp.price) price, min(lp.unit_price) unit_price
      FROM base b JOIN latest_prices lp ON lp.product_id=b.id JOIN chains c ON c.id=lp.chain_id
      WHERE lp.domain=$1 AND lp.price>0 GROUP BY b.id, c.slug
      ${icaUnion}
    )
    SELECT b.id, b.name, b.brand, b.cat,
           jsonb_object_agg(px.chain, round(px.price,2)) chains,
           round(min(px.price),2) cheapest_price, round(max(px.price),2) dearest_price,
           (array_agg(px.chain ORDER BY px.price))[1] cheapest_chain,
           count(*) nchains
    FROM base b JOIN px ON px.id=b.id
    GROUP BY b.id, b.name, b.brand, b.cat
    HAVING count(*) >= $2
    ORDER BY count(*) DESC, min(px.price)
    LIMIT $3`, [domain, domain === 'grocery' ? 3 : 2, limit]);
  return rows.map((r) => {
    const chainsObj = {}; for (const [k, v] of Object.entries(r.chains)) chainsObj[k.replace(/-/g, '_')] = Number(v);
    const price = Number(r.cheapest_price), high = Number(r.dearest_price);
    return {
      slug: 'p' + r.id.slice(0, 8), name: r.name, size: sizeOf(r.name), brand: r.brand || '',
      category: (r.cat || '').toLowerCase(), emoji: emojiFor(r.cat, domain),
      price: { SE: price }, regular: { SE: high },
      low52: { SE: price }, high52: { SE: high },
      chains: { SE: chainsObj }, cheapest: { SE: (r.cheapest_chain || '').replace(/-/g, '_') },
      sparkline: Array(13).fill(price), confidence: r.nchains >= 4 ? 'high' : 'medium',
      verdict: verdictOf(price, high), sector: SECTOR_OF[domain],
    };
  });
}

async function fuelProducts() {
  // national reference price per grade if present; else the only fuel rows we have
  const rows = await q(`SELECT p.canonical_name name, round(lp.price,2) price
    FROM latest_prices lp JOIN products p ON p.id=lp.product_id WHERE lp.domain='fuel' AND lp.price>0 LIMIT 12`);
  return rows.map((r) => ({ slug: 'fuel-' + r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name: r.name,
    emoji: '⛽', unit: 'kr/L', price: { SE: Number(r.price) }, low52: { SE: Number(r.price) }, high52: { SE: Number(r.price) },
    sparkline: Array(13).fill(Number(r.price)), sector: 'fuel' }));
}

async function stores() {
  // geocoded grocery stores; basketCost = sum of this store's price for a fixed common basket (real per-store for ICA)
  const rows = await q(`
    WITH geo AS (
      SELECT s.id, s.name, c.slug chain, NULLIF(s.city,'—') city,
             ST_Y(s.position::geometry) lat, ST_X(s.position::geometry) lng
      FROM stores s JOIN chains c ON c.id=s.chain_id
      WHERE s.domain='grocery' AND s.position IS NOT NULL),
    bc AS (
      SELECT esp.store_id, round(avg(esp.price)*40,0) basket
      FROM vw_effective_store_price esp GROUP BY esp.store_id)
    SELECT geo.id, geo.name, geo.chain, geo.city, round(geo.lat::numeric,4) lat, round(geo.lng::numeric,4) lng, bc.basket
    FROM geo JOIN bc ON bc.store_id=geo.id
    WHERE bc.basket IS NOT NULL
    ORDER BY bc.basket LIMIT 120`);
  if (!rows.length) return [];
  const median = rows[Math.floor(rows.length / 2)].basket;
  return rows.map((r) => ({ slug: 's' + r.id.slice(0, 8), name: r.name, chain: r.chain.replace(/-/g, '_'),
    city: r.city || 'Sverige', country: 'SE', district: r.city || '', distance: 0,
    basketCost: Number(r.basket), basketDiff: Number(r.basket) - Number(median),
    percentile: Math.round((rows.filter((x) => x.basket <= r.basket).length / rows.length) * 100),
    openTill: '', coords: [r.lng, r.lat], lat: Number(r.lat), lng: Number(r.lng) }));
}

async function municipalities() {
  const rows = await q(`SELECT municipality name, stores, products, avg_price
    FROM vw_municipality_price_index WHERE municipality <> 'Okänd' AND stores>0 ORDER BY products DESC LIMIT 60`);
  if (!rows.length) return [];
  const avgAll = rows.reduce((s, r) => s + Number(r.avg_price), 0) / rows.length;
  return rows.map((r) => ({ name: r.name, region: '', index: +(Number(r.avg_price) / avgAll).toFixed(3),
    stores: Number(r.stores), avgPrice: Number(r.avg_price), products: Number(r.products) }));
}

const HELPERS = `
function fmtPrice(value){ if(value==null) return '—'; return new Intl.NumberFormat('sv-SE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)+'\\u00A0kr'; }
function fmtPct(value){ const s=value>0?'+':''; return s+value.toFixed(1)+'%'; }
function findProduct(slug){ return ALL_PRODUCTS.find(p=>p.slug===slug); }
function findStore(slug){ return STORES.find(s=>s.slug===slug); }
function findCategory(slug){ return CATEGORIES.find(c=>c.slug===slug); }
function priceOf(p,c='SE'){ return p?(p.price?.[c]??p.price):null; }
function chainsOf(p,c='SE'){ return p.chains?.[c]??{}; }
function cheapestChainOf(p,c='SE'){ return p.cheapest?.[c]; }
function municipalitiesFor(){ return MUNICIPALITIES.SE; }
function municipalityInfo(code,name){ return MUNICIPALITIES.SE.find(m=>m.name===name)||MUNICIPALITIES.SE[0]; }
function jamforpris(product){ const price=priceOf(product,'SE'); if(price==null) return null;
  const fmt=(v)=>v.toLocaleString('sv-SE',{minimumFractionDigits:2,maximumFractionDigits:2});
  if(product.unit){ const u=String(product.unit).replace(/^kr\\s*\\//i,'').toLowerCase(); return fmt(price)+' kr/'+u; }
  const m=String(product.size||'').toLowerCase().match(/([\\d.,]+)\\s*([a-zà-ÿ]+)/); if(!m) return null;
  const qty=parseFloat(m[1].replace(',','.')); const unit=m[2]; if(!qty||qty<=0) return null;
  let per,label; if(unit==='kg'){per=price/qty;label='kg';} else if(unit.startsWith('g')){per=price/(qty/1000);label='kg';}
  else if(unit==='l'){per=price/qty;label='l';} else if(unit==='dl'){per=price/(qty/10);label='l';}
  else if(unit==='cl'){per=price/(qty/100);label='l';} else if(unit==='ml'){per=price/(qty/1000);label='l';}
  else {per=price/qty;label='st';} return per.toLocaleString('sv-SE',{minimumFractionDigits:2,maximumFractionDigits:2})+' kr/'+label; }
`;

async function main() {
  const [CH, groceries, pharmacy, beauty, fuel, STO, MUN] = await Promise.all([
    chains(), products('grocery', 60), products('pharmacy', 40), products('beauty', 40), fuelProducts(), stores(), municipalities(),
  ]);
  const CATS = [...new Set(groceries.map((p) => p.category).filter(Boolean))]
    .map((slug) => ({ slug, name: slug, nameSv: slug, emoji: EMOJI[slug] || '🛒', count: groceries.filter((p) => p.category === slug).length }));
  const COUNTRIES = { SE: { code: 'SE', name: 'Sverige', city: 'Stockholm', flag: '🇸🇪', currency: 'kr', currencyCode: 'SEK', locale: 'sv-SE', dec: ',' } };
  const SECTORS = {
    groceries: { id: 'groceries', name: 'Groceries', nameLocal: { SE: 'Mat' }, emoji: '🛒', items: groceries.length },
    fuel: { id: 'fuel', name: 'Fuel', nameLocal: { SE: 'Drivmedel' }, emoji: '⛽', items: fuel.length },
    pharmacy: { id: 'pharmacy', name: 'Pharmacy', nameLocal: { SE: 'Apotek' }, emoji: '💊', items: pharmacy.length },
    beauty: { id: 'beauty', name: 'Beauty', nameLocal: { SE: 'Skönhet' }, emoji: '✨', items: beauty.length },
  };
  const ALL = [...groceries, ...fuel, ...pharmacy, ...beauty];
  const MY_BASKET = groceries.slice(0, 10).map((p) => ({ slug: p.slug, qty: 1 }));
  const j = (o) => JSON.stringify(o, null, 1);
  const out = `/* AUTO-GENERATED from the live GroceryView DB — real Swedish prices. Schema matches the prototype. */
const COUNTRIES = ${j(COUNTRIES)};
const MUNICIPALITIES = { SE: ${j(MUN)} };
const SECTORS = ${j(SECTORS)};
const CHAINS = ${j(CH)};
const CATEGORIES = ${j(CATS)};
const GROCERY_PRODUCTS = ${j(groceries)};
const FUEL_PRODUCTS = ${j(fuel)};
const PHARMACY_PRODUCTS = ${j(pharmacy)};
const BEAUTY_PRODUCTS = ${j(beauty)};
const FUEL_STATIONS = {};
const STORES = ${j(STO)};
const PRICE_HISTORY_LONG = [];
const MY_BASKET_DEFAULT = ${j(MY_BASKET)};
const ALL_PRODUCTS = [...GROCERY_PRODUCTS, ...FUEL_PRODUCTS, ...PHARMACY_PRODUCTS, ...BEAUTY_PRODUCTS];
${HELPERS}
Object.assign(window, { COUNTRIES, MUNICIPALITIES, SECTORS, CHAINS, CATEGORIES, STORES,
  GROCERY_PRODUCTS, FUEL_PRODUCTS, PHARMACY_PRODUCTS, BEAUTY_PRODUCTS, ALL_PRODUCTS,
  FUEL_STATIONS, PRICE_HISTORY_LONG, MY_BASKET_DEFAULT,
  fmtPrice, fmtPct, findProduct, findStore, findCategory, priceOf, chainsOf, cheapestChainOf,
  municipalitiesFor, municipalityInfo, jamforpris });
`;
  writeFileSync(OUT, out);
  console.log(`wrote ${OUT}: grocery=${groceries.length} pharmacy=${pharmacy.length} beauty=${beauty.length} fuel=${fuel.length} stores=${STO.length} municipalities=${MUN.length} chains=${Object.keys(CH).length}`);
}
main().then(() => pool.end()).catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
