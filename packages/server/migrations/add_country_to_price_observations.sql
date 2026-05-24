-- migrate:up
ALTER TABLE price_observations
  ADD COLUMN IF NOT EXISTS country CHAR(2) NOT NULL DEFAULT 'SE',
  ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'SEK';

CREATE INDEX IF NOT EXISTS price_observations_country_chain_product_id_idx
  ON price_observations (country, chain, product_id);

-- migrate:down
DROP INDEX IF EXISTS price_observations_country_chain_product_id_idx;

ALTER TABLE price_observations
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS country;
