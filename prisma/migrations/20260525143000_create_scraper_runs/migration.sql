create table if not exists scraper_runs (
  id uuid primary key default gen_random_uuid(),
  retailer_id text not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  items_scraped integer not null default 0,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scraper_runs_items_scraped_nonnegative check (items_scraped >= 0),
  constraint scraper_runs_status_check check (status in ('running', 'succeeded', 'failed', 'partial'))
);

create index if not exists scraper_runs_retailer_started_at_idx on scraper_runs (retailer_id, started_at desc);
create index if not exists scraper_runs_status_started_at_idx on scraper_runs (status, started_at desc);
