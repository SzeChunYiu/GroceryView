create table if not exists search_telemetry_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'search_suggestions_requested',
    'search_stream_event',
    'search_suggestions_returned',
    'search_first_result_time',
    'search_suggestion_clicked',
    'search_suggestions_dismissed'
  )),
  query text not null check (length(query) between 1 and 200),
  result_count integer check (result_count is null or result_count >= 0),
  result_id text,
  result_rank integer check (result_rank is null or result_rank >= 0),
  elapsed_ms numeric(12, 3) check (elapsed_ms is null or elapsed_ms >= 0),
  stream_event text,
  reason text,
  observed_at timestamptz not null,
  received_at timestamptz not null default now(),
  payload jsonb not null
);

create index if not exists search_telemetry_events_observed_at_idx
  on search_telemetry_events (observed_at desc);

create index if not exists search_telemetry_events_event_type_observed_at_idx
  on search_telemetry_events (event_type, observed_at desc);
