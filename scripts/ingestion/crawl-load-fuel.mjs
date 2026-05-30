#!/usr/bin/env node
// Fuel per-station prices from bensinpriser.nu (crowd-sourced — labelled as such). Swedish fuel chains do
// NOT publish per-station pump prices first-party; bensinpriser.nu is the one machine-readable per-station
// source (server-rendered HTML list + per-station JSON-LD coords). We crawl the major population centres
// (the site caps big-city pagination at the cheapest ~14, so this captures the actionable cheapest stations
// nationwide) for 95 + diesel, geocode via the station detail JSON-LD, and load a per-station fuel layer.
import process from 'node:process';
import pg from 'pg';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const BASE = 'https://bensinpriser.nu';
const GRADES = [['95', 'Bensin 95'], ['diesel', 'Diesel']];
const CITIES = [
  ['stockholms-lan', 'stockholm'], ['vastra-gotalands-lan', 'goteborg'], ['skane-lan', 'malmo'],
  ['uppsala-lan', 'uppsala'], ['vastmanlands-lan', 'vasteras'], ['orebro-lan', 'orebro'],
  ['ostergotlands-lan', 'linkoping'], ['skane-lan', 'helsingborg'], ['jonkopings-lan', 'jonkoping'],
  ['ostergotlands-lan', 'norrkoping'], ['skane-lan', 'lund'], ['vasterbottens-lan', 'umea'],
  ['gavleborgs-lan', 'gavle'], ['vastra-gotalands-lan', 'boras'], ['vasternorrlands-lan', 'sundsvall'],
  ['dalarnas-lan', 'falun'], ['hallands-lan', 'halmstad'], ['varmlands-lan', 'karlstad'],
  ['norrbottens-lan', 'lulea'], ['kronobergs-lan', 'vaxjo'],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (s) => { const n = Number(String(s).replace(/[^\d,.]/g, '').replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : null; };

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try { const r = await fetch(url, { headers: { 'User-Agent': UA, accept: 'text/html' } }); if (r.ok) return await r.text(); } catch {}
    await sleep(400 * (i + 1));
  }
  return null;
}
// list rows: each station row carries data-href + name + a price <b>..kr</b>
function parseList(html) {
  const out = [];
  const rowRe = /data-href="(\/station\/[^"]+)"[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<b[^>]*>([\d.,]+)\s*kr<\/b>/g;
  let m;
  while ((m = rowRe.exec(html))) {
    const href = m[1];
    const nameCell = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const price = num(m[3]);
    if (href && price) out.push({ href, name: nameCell.slice(0, 120), price });
  }
  return out;
}
function parseGeo(html) {
  const mm = html.match(/"@type"\s*:\s*"GasStation"[\s\S]*?"latitude"\s*:\s*([\d.]+)[\s\S]*?"longitude"\s*:\s*([\d.]+)/);
  if (mm) return { lat: Number(mm[1]), lng: Number(mm[2]) };
  return null;
}
function chainOf(name) {
  const s = name.toLowerCase();
  for (const [k, slug] of [['circle k', 'circle-k'], ['okq8', 'okq8'], ['preem', 'preem'], ['ingo', 'ingo'],
    ['shell', 'shell'], ['st1', 'st1'], ['tanka', 'tanka'], ['qstar', 'qstar'], ['din-x', 'din-x'], ['din x', 'din-x'], ['costco', 'costco']])
    if (s.includes(k)) return slug;
  return 'other-fuel';
}

const stations = new Map(); // href -> {name, chain, prices:{grade:price}, geo}
for (const [lan, city] of CITIES) {
  for (const [g, gname] of GRADES) {
    const html = await get(`${BASE}/stationer/${g}/${lan}/${city}/0`);
    await sleep(300);
    if (!html) continue;
    for (const row of parseList(html)) {
      const st = stations.get(row.href) || { href: row.href, name: row.name, chain: chainOf(row.name), prices: {}, city };
      st.prices[gname] = row.price;
      stations.set(row.href, st);
    }
  }
}
console.error(`stations found: ${stations.size}; fetching coords…`);
let geoed = 0;
for (const st of stations.values()) {
  const html = await get(BASE + st.href);
  await sleep(200);
  if (html) { const geo = parseGeo(html); if (geo) { st.geo = geo; geoed++; } }
}
console.error(`coords resolved: ${geoed}/${stations.size}`);
const all = [...stations.values()].filter((s) => s.geo && Object.keys(s.prices).length);
if (!all.length) { console.error('no stations with prices+coords'); process.exit(1); }

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const client = await pool.connect();
const NOW = new Date().toISOString();
try {
  await client.query('BEGIN');
  // chains
  const chains = [...new Set(all.map((s) => s.chain))];
  for (const c of chains) await client.query(
    `INSERT INTO chains (slug,name,retailer_type,country_code,domain,market_code,pricing_model,created_at,updated_at)
     VALUES ($1,$2,'fuel','SE','fuel','SE','per_store',$3::timestamptz,$3::timestamptz) ON CONFLICT (slug) DO NOTHING`,
    [c, c.replace(/-/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase()), NOW]);
  // fuel products (grades)
  for (const [, gname] of GRADES) await client.query(
    `INSERT INTO products (slug,canonical_name,brand,category_path,comparable_unit,domain,market_code,product_kind)
     VALUES ($1,$2,NULL,ARRAY['Fuel'],'l','fuel','SE','commodity') ON CONFLICT (slug) DO NOTHING`,
    [`fuel-${gname.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, gname]);
  // stores (per station)
  for (const s of all) {
    const slug = 'bp' + s.href.split('/').pop().slice(0, 40).replace(/[^a-z0-9-]/g, '');
    await client.query(
      `INSERT INTO stores (chain_id,slug,external_ref,name,address_line1,city,country_code,store_type,opening_hours,position,domain,market_code,supported_fuel_grade_ids)
       SELECT c.id,$2,$3,$4,'—',$5,'SE','fuel_station','{}'::jsonb,ST_SetSRID(ST_MakePoint($6,$7),4326)::geography,'fuel','SE','{}'
       FROM chains c WHERE c.slug=$1 ON CONFLICT (slug) DO UPDATE SET position=EXCLUDED.position`,
      [s.chain, slug, s.href, s.name, s.city, s.geo.lng, s.geo.lat]);
    s.slug = slug;
  }
  // per-station prices
  let n = 0;
  for (const s of all) {
    for (const [, gname] of GRADES) {
      const price = s.prices[gname]; if (!price) continue;
      await client.query(`
        WITH st AS (SELECT id, chain_id FROM stores WHERE slug=$1),
        pr AS (SELECT id FROM products WHERE slug=$2),
        ins AS (
          INSERT INTO observations (product_id, chain_id, store_id, price_type, price, unit_price, currency, member_required, observed_at, confidence, provenance, domain, is_available, market_code)
          SELECT pr.id, st.chain_id, st.id, 'shelf', $3, $3, 'SEK', false, $4::timestamptz, 0.5, jsonb_build_object('source','bensinpriser','crowdsourced',true), 'fuel', true, 'SE' FROM st, pr
          ON CONFLICT DO NOTHING RETURNING id, product_id, chain_id, store_id, price, observed_at)
        INSERT INTO latest_prices (product_id, chain_id, store_id, price_type, observation_id, price, unit_price, currency, observed_at, confidence, provenance, domain, is_available, market_code)
        SELECT product_id, chain_id, store_id, 'shelf', id, price, price, 'SEK', observed_at, 0.5, jsonb_build_object('source','bensinpriser','crowdsourced',true), 'fuel', true, 'SE' FROM ins
        ON CONFLICT (product_id, chain_id, store_id, price_type) DO UPDATE SET price=EXCLUDED.price, observation_id=EXCLUDED.observation_id, observed_at=EXCLUDED.observed_at`,
        [s.slug, `fuel-${gname.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, price, NOW]);
      n++;
    }
  }
  await client.query('COMMIT');
  console.log(`DONE: ${all.length} fuel stations across ${chains.length} chains, ${n} per-station prices (crowd-sourced)`);
} catch (e) { await client.query('ROLLBACK'); console.error('FAILED:', e.message); process.exitCode = 1; }
finally { client.release(); await pool.end(); }
