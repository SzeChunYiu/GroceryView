create table if not exists community_reporter_trust (
  reporter_id text primary key,
  reports_last_24_hours integer not null default 0 check (reports_last_24_hours >= 0),
  pending_reports integer not null default 0 check (pending_reports >= 0),
  accepted_reports_last_30_days integer not null default 0 check (accepted_reports_last_30_days >= 0),
  rejected_reports_last_30_days integer not null default 0 check (rejected_reports_last_30_days >= 0),
  updated_at timestamptz not null
);

create index if not exists community_reporter_trust_pending_idx on community_reporter_trust(pending_reports desc);
