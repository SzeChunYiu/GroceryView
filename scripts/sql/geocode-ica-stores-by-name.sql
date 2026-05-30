-- Geocode the handlaprivatkund ICA stores (external_ref ~ '^100\d+$') by matching their names to the
-- OSM-sourced ICA stores (slug osm-*, which carry real lat/lng + city). ICA store branch names are
-- distinctive (Karlaplan, Solna, Tyresö...), so a similarity match on the name with format words removed
-- ("ICA", "Nära", "Kvantum", "Supermarket", "Maxi", "Stormarknad", "City") is reliable. Strong matches
-- only (similarity >= 0.55 on the residual) — unmatched stores keep NULL position (no fabricated coords).

WITH ica AS (SELECT id FROM chains WHERE slug = 'ica'),
norm AS (
  SELECT s.id, s.external_ref,
         btrim(regexp_replace(
           lower(translate(s.name, 'åäöÅÄÖ', 'aaoaao')),
           '\m(ica|nara|kvantum|supermarket|maxi|stormarknad|city)\M', '', 'g')) AS res
  FROM stores s, ica
  WHERE s.chain_id = ica.id AND s.external_ref ~ '^100[0-9]+$'
),
osm AS (
  SELECT s.id, s.position, s.city,
         btrim(regexp_replace(
           lower(translate(s.name, 'åäöÅÄÖ', 'aaoaao')),
           '\m(ica|nara|kvantum|supermarket|maxi|stormarknad|city)\M', '', 'g')) AS res
  FROM stores s, ica
  WHERE s.chain_id = ica.id AND s.slug LIKE 'osm-%' AND s.position IS NOT NULL
),
matched AS (
  SELECT n.id, m.position, m.city, sim
  FROM norm n
  CROSS JOIN LATERAL (
    SELECT o.position, o.city, similarity(n.res, o.res) AS sim
    FROM osm o
    WHERE n.res <> '' AND o.res <> '' AND similarity(n.res, o.res) >= 0.55
    ORDER BY similarity(n.res, o.res) DESC
    LIMIT 1
  ) m
)
UPDATE stores s
SET position = m.position,
    city = COALESCE(NULLIF(m.city, '—'), s.city)
FROM matched m
WHERE s.id = m.id AND s.position IS NULL;

-- report
SELECT
  count(*) FILTER (WHERE s.external_ref ~ '^100[0-9]+$') AS handla_total,
  count(*) FILTER (WHERE s.external_ref ~ '^100[0-9]+$' AND s.position IS NOT NULL) AS geocoded
FROM stores s JOIN chains c ON c.id = s.chain_id WHERE c.slug = 'ica';
