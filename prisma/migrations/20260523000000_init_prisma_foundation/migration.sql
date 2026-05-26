-- Baseline Prisma-owned tables so `prisma migrate deploy` can run against an
-- empty database before applying later additive migrations.
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE IF NOT EXISTS "categories" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "parent_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_key"
  ON "categories" ("slug");

CREATE INDEX IF NOT EXISTS "categories_parent_id_idx"
  ON "categories" ("parent_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'categories_parent_id_fkey'
      AND conrelid = '"categories"'::regclass
  ) THEN
    ALTER TABLE "categories"
      ADD CONSTRAINT "categories_parent_id_fkey"
      FOREIGN KEY ("parent_id")
      REFERENCES "categories" ("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "products" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "canonical_name" TEXT NOT NULL,
  "name_sv" TEXT,
  "name_en" TEXT,
  "brand" TEXT,
  "category_path" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "comparable_unit" TEXT NOT NULL,
  "image_url" TEXT,
  "is_vegan" BOOLEAN NOT NULL DEFAULT false,
  "is_gluten_free" BOOLEAN NOT NULL DEFAULT false,
  "is_lactose_free" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_key"
  ON "products" ("slug");

CREATE INDEX IF NOT EXISTS "products_is_vegan_idx"
  ON "products" ("is_vegan");

CREATE INDEX IF NOT EXISTS "products_is_gluten_free_idx"
  ON "products" ("is_gluten_free");

CREATE INDEX IF NOT EXISTS "products_is_lactose_free_idx"
  ON "products" ("is_lactose_free");

CREATE TABLE IF NOT EXISTS "stores" (
  "id" TEXT NOT NULL,
  "chain_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "district" TEXT,
  "domain" TEXT NOT NULL DEFAULT 'grocery',
  "latitude" DECIMAL(9, 6),
  "longitude" DECIMAL(9, 6),
  "store_type" TEXT,
  "opening_hours" JSONB,
  "online_store_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "stores_latitude_longitude_idx"
  ON "stores" ("latitude", "longitude");

CREATE TABLE IF NOT EXISTS "user_store_loyalty_cards" (
  "id" UUID NOT NULL,
  "user_id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "card_name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_store_loyalty_cards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_store_loyalty_cards_store_id_idx"
  ON "user_store_loyalty_cards" ("store_id");

CREATE UNIQUE INDEX IF NOT EXISTS "user_store_loyalty_cards_user_id_store_id_key"
  ON "user_store_loyalty_cards" ("user_id", "store_id");

CREATE TABLE IF NOT EXISTS "pantry_items" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "quantity" DECIMAL(12, 3) NOT NULL,
  "unit" TEXT NOT NULL,
  "minimum_quantity" DECIMAL(12, 3) NOT NULL,
  "target_quantity" DECIMAL(12, 3),
  "expires_on" DATE,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "pantry_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pantry_items_user_id_product_id_idx"
  ON "pantry_items" ("user_id", "product_id");

CREATE INDEX IF NOT EXISTS "pantry_items_expires_on_idx"
  ON "pantry_items" ("expires_on");

CREATE UNIQUE INDEX IF NOT EXISTS "pantry_items_user_id_product_id_key"
  ON "pantry_items" ("user_id", "product_id");
