CREATE TABLE IF NOT EXISTS "store_ratings" (
  "id" UUID NOT NULL,
  "user_id" TEXT NOT NULL,
  "store_id" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "store_ratings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "store_ratings_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

CREATE INDEX IF NOT EXISTS "store_ratings_store_id_idx"
  ON "store_ratings" ("store_id");

CREATE UNIQUE INDEX IF NOT EXISTS "store_ratings_user_id_store_id_key"
  ON "store_ratings" ("user_id", "store_id");
