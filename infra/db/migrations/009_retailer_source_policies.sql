-- Persist retailer source-policy decisions before ingestion fetches run.

create table if not exists retailer_source_policies (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references chains(id) on delete cascade,
  source_surface text not null check (
    source_surface in (
      'store_locator',
      'offer',
      'product',
      'search',
      'basket',
      'account',
      'member',
      'app_api'
    )
  ),
  policy_label text not null check (policy_label in ('allowed', 'fixture_review', 'manual_review', 'blocked', 'stub_only')),
  robots_url text not null,
  disallowed_path_matches text[] not null default array[]::text[],
  crawl_delay_seconds integer check (crawl_delay_seconds is null or crawl_delay_seconds >= 0),
  legal_review_status text not null check (legal_review_status in ('pending', 'approved', 'blocked')),
  source_url text,
  provenance jsonb not null default '{}'::jsonb,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (chain_id, source_surface)
);

create index if not exists retailer_source_policies_label_review_idx
  on retailer_source_policies (policy_label, legal_review_status, updated_at desc);

create index if not exists retailer_source_policies_disallowed_gin_idx
  on retailer_source_policies using gin (disallowed_path_matches);

create index if not exists retailer_source_policies_provenance_gin_idx
  on retailer_source_policies using gin (provenance);
