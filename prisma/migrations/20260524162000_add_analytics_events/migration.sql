CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "analytics_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" text NOT NULL,
  "event" text NOT NULL,
  "payload" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "analytics_events_session_id_idx" ON "analytics_events" ("session_id");
CREATE INDEX "analytics_events_event_idx" ON "analytics_events" ("event");
CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events" ("created_at");
