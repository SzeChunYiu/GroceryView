-- Track feature flags and percentage rollout for incremental feature delivery.

create table if not exists feature_flags (
  feature_key text primary key,
  enabled boolean not null default false,
  rollout_percent integer not null default 0 check (rollout_percent between 0 and 100),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table feature_flags is 'Simple feature flags used for percentage-based rollout of API features.';
comment on column feature_flags.feature_key is 'Unique identifier for the feature, e.g., feature-api-v2-checkout.';
comment on column feature_flags.rollout_percent is 'Percent of cohort that should see the feature (0-100).';
comment on column feature_flags.enabled is 'Whether the feature flag is active at all.';
