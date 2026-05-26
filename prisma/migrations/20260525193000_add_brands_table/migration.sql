CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "brands" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "logo_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "brands_slug_key"
  ON "brands" ("slug");

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "brand_id" UUID;

WITH source_brands AS (
  SELECT DISTINCT trim("brand") AS "name"
  FROM "products"
  WHERE "brand" IS NOT NULL AND trim("brand") <> ''
),
slugged AS (
  SELECT
    "name",
    regexp_replace(
      regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g'),
      '(^-|-$)',
      '',
      'g'
    ) AS "slug"
  FROM source_brands
)
INSERT INTO "brands" ("name", "slug")
SELECT "name", "slug"
FROM slugged
WHERE "slug" <> ''
ON CONFLICT ("slug") DO UPDATE
SET "name" = EXCLUDED."name",
    "updated_at" = CURRENT_TIMESTAMP;

UPDATE "products"
SET "brand_id" = "brands"."id"
FROM "brands"
WHERE "products"."brand_id" IS NULL
  AND "products"."brand" IS NOT NULL
  AND trim("products"."brand") = "brands"."name";

CREATE INDEX IF NOT EXISTS "products_brand_id_idx"
  ON "products" ("brand_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_brand_id_fkey'
      AND conrelid = '"products"'::regclass
  ) THEN
    ALTER TABLE "products"
      ADD CONSTRAINT "products_brand_id_fkey"
      FOREIGN KEY ("brand_id")
      REFERENCES "brands" ("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
