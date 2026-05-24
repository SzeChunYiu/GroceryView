CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS product_canonical (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ean text,
  brand text NOT NULL,
  name text NOT NULL,
  weight_grams numeric,
  volume_ml numeric,
  unit_count integer,
  category_id uuid REFERENCES categories(id),
  country char(2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_canonical_country_uppercase CHECK (country = upper(country)),
  CONSTRAINT product_canonical_ean_not_blank CHECK (ean IS NULL OR length(btrim(ean)) > 0),
  CONSTRAINT product_canonical_brand_not_blank CHECK (length(btrim(brand)) > 0),
  CONSTRAINT product_canonical_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT product_canonical_weight_positive CHECK (weight_grams IS NULL OR weight_grams > 0),
  CONSTRAINT product_canonical_volume_positive CHECK (volume_ml IS NULL OR volume_ml > 0),
  CONSTRAINT product_canonical_unit_count_positive CHECK (unit_count IS NULL OR unit_count > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS product_canonical_ean_country_uidx
  ON product_canonical (ean, country)
  WHERE ean IS NOT NULL;

CREATE INDEX IF NOT EXISTS product_canonical_brand_name_idx
  ON product_canonical (brand, name);

CREATE INDEX IF NOT EXISTS product_canonical_soft_match_idx
  ON product_canonical (lower(brand), lower(name), country)
  WHERE ean IS NULL;
