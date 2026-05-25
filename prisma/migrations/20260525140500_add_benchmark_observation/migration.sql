CREATE TABLE IF NOT EXISTS "benchmark_observation" (
  "source_id" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "vertical" TEXT NOT NULL,
  "ecoicop_code" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "value" DECIMAL(18, 6) NOT NULL,
  "unit" TEXT NOT NULL,
  "observed_at" TIMESTAMPTZ NOT NULL,
  PRIMARY KEY ("source_id", "country", "vertical", "ecoicop_code", "period")
);


CREATE INDEX IF NOT EXISTS "benchmark_observation_source_period_idx"
  ON "benchmark_observation" ("source_id", "period");
