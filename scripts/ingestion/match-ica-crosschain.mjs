#!/usr/bin/env node
// Cross-chain product matching for ICA. The EAN chains (Willys/Hemköp/City Gross/Coop) already share one
// product row per EAN, so they compare directly. ICA exposes NO EAN through any endpoint (verified: productId
// is a UUID, images are UUID-keyed, the BOP detail endpoint carries no gtin) — so ICA must be matched to the
// EAN-keyed canonical products by name. To avoid the flavor-collapse failure (matching two different products
// → actively misinforming the user), matches are STRICT and stored in a separate scored relation, never by
// writing a borrowed EAN onto ICA:
//   brand must agree  AND  pack-size must agree  AND  name similarity >= THRESHOLD  AND  1:1 mutual-best.
// Unmatched ICA products stay ICA-only (honest). Run AFTER the full ICA crawl is loaded.
import process from 'node:process';
import pg from 'pg';

const THRESH = 0.42;          // trigram similarity on the residual (post brand/size strip)
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });

// pack size signature: normalize "1,5 l" / "1.5l" / "500 g" / "8-pack" / "8 p" / "6x33cl"
function packSig(s) {
  if (!s) return '';
  const t = String(s).toLowerCase().replace(',', '.').replace(/\s+/g, '');
  const m = t.match(/(\d+(?:\.\d+)?)(?:x(\d+(?:\.\d+)?))?(kg|g|cl|ml|dl|l|st|p|pack|påse|burk)/);
  if (!m) return '';
  let qty = parseFloat(m[1]);
  const mult = m[2] ? parseFloat(m[2]) : 1;
  let unit = m[3];
  // canonicalize to a base unit so 1.5l == 1500ml, 1kg == 1000g
  if (unit === 'kg') { qty *= 1000; unit = 'g'; }
  if (unit === 'l') { qty *= 1000; unit = 'ml'; }
  if (unit === 'cl') { qty *= 10; unit = 'ml'; }
  if (unit === 'dl') { qty *= 100; unit = 'ml'; }
  if (unit === 'pack' || unit === 'p' || unit === 'påse' || unit === 'burk') unit = 'st';
  return `${qty * mult}${unit}`;
}
function normBrand(b) {
  if (!b) return '';
  return String(b).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '').replace(/ko$|ab$/,'');
}

async function main() {
  const client = await pool.connect();
  try {
    const ican = parseInt(process.env.ICA_CHAIN || '0', 10);
    // ICA products (no barcode) with their pack-size text + brand
    const ica = (await client.query(`
      SELECT p.id, p.canonical_name AS name, p.brand,
             coalesce(p.package_size::text,'') || ' ' || p.canonical_name AS sizesrc
      FROM products p
      WHERE p.slug LIKE 'ica-%' AND nullif(p.barcode,'') IS NULL`)).rows;
    // canonical EAN-keyed products (the comparison targets)
    const ean = (await client.query(`
      SELECT DISTINCT p.id, p.canonical_name AS name, p.brand, p.barcode,
             coalesce(p.package_size::text,'') || ' ' || p.canonical_name AS sizesrc
      FROM products p
      JOIN latest_prices lp ON lp.product_id=p.id AND lp.domain='grocery'
      WHERE nullif(p.barcode,'') IS NOT NULL`)).rows;
    console.error(`ica=${ica.length} ean-canonical=${ean.length}`);

    // block by (brand, packSig) — only products that agree on both are even candidates
    const blocks = new Map();
    for (const e of ean) {
      const key = normBrand(e.brand) + '|' + (packSig(e.sizesrc) || packSig(e.name));
      if (!key.startsWith('|') && !key.endsWith('|')) {
        (blocks.get(key) || blocks.set(key, []).get(key)).push(e);
      }
    }
    console.error(`candidate blocks: ${blocks.size}`);

    // for each ICA product, find best EAN match within its (brand,size) block via SQL trigram similarity
    await client.query(`DROP TABLE IF EXISTS cand`);
    await client.query(`CREATE TEMP TABLE cand (ica_id uuid, ean_id uuid, score real)`);
    let probed = 0, matched = 0;
    const batch = [];
    for (const a of ica) {
      const key = normBrand(a.brand) + '|' + (packSig(a.sizesrc) || packSig(a.name));
      const cands = blocks.get(key);
      if (!cands || key.startsWith('|') || key.endsWith('|')) continue;
      probed++;
      // pick best by trigram similarity on name (done in JS via a quick local 3-gram score to avoid 22k SQL calls)
      let best = null, bestScore = 0;
      for (const e of cands) {
        const s = trigram(a.name, e.name);
        if (s > bestScore) { bestScore = s; best = e; }
      }
      if (best && bestScore >= THRESH) { batch.push([a.id, best.id, bestScore]); matched++; }
    }
    console.error(`loop done: probed=${probed} candidate-pairs=${batch.length}, inserting…`);
    // bulk insert candidates
    for (let i = 0; i < batch.length; i += 500) {
      const sl = batch.slice(i, i + 500); const v = []; const pr = [];
      sl.forEach((r, j) => { const o = j * 3; v.push(`($${o+1},$${o+2},$${o+3})`); pr.push(r[0], r[1], r[2]); });
      await client.query(`INSERT INTO cand VALUES ${v.join(',')}`, pr);
    }
    // enforce 1:1 mutual-best: keep a (ica,ean) pair only if it's the top score for BOTH sides
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_matches (
        ica_product_id uuid REFERENCES products(id),
        ean_product_id uuid REFERENCES products(id),
        score real, method text, matched_at timestamptz DEFAULT now(),
        PRIMARY KEY (ica_product_id, ean_product_id))`);
    await client.query(`TRUNCATE product_matches`);
    const ins = await client.query(`
      WITH best_ica AS (SELECT DISTINCT ON (ica_id) ica_id, ean_id, score FROM cand ORDER BY ica_id, score DESC),
           best_ean AS (SELECT DISTINCT ON (ean_id) ean_id, ica_id, score FROM cand ORDER BY ean_id, score DESC)
      INSERT INTO product_matches (ica_product_id, ean_product_id, score, method)
      SELECT bi.ica_id, bi.ean_id, bi.score, 'name+brand+size:mutual'
      FROM best_ica bi JOIN best_ean be ON be.ean_id=bi.ean_id AND be.ica_id=bi.ica_id
      RETURNING 1`);
    console.log(`probed(in-block)=${probed} candidate-pairs=${matched} confirmed 1:1 mutual matches=${ins.rowCount}`);
  } finally {
    pool.end && (await pool.end());
  }
}

// lightweight trigram Dice coefficient (0..1) — mirrors pg_trgm closely enough for blocking-stage ranking
function grams(s) {
  s = '  ' + String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim() + '  ';
  const g = new Set();
  for (let i = 0; i < s.length - 2; i++) g.add(s.slice(i, i + 3));
  return g;
}
function trigram(a, b) {
  const ga = grams(a), gb = grams(b);
  if (!ga.size || !gb.size) return 0;
  let inter = 0; for (const x of ga) if (gb.has(x)) inter++;
  return (2 * inter) / (ga.size + gb.size);
}

main().catch((e) => { console.error('FAILED:', e.message); process.exitCode = 1; });
