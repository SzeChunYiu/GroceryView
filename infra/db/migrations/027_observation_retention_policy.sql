-- Retention controls for raw observations and raw ingestion payloads.
--
-- This migration does not enable blind deletes. The retention function defaults
-- to dry-run, writes an audit row for every invocation, preserves rows still
-- referenced by latest_prices, and only removes raw_records after object
-- storage archive evidence is present in provenance.

create table if not exists retention_runs (
  id uuid primary key default gen_random_uuid(),
  run_kind text not null check (run_kind in ('observation_raw_tiering')),
  requested_at timestamptz not null default now(),
  dry_run boolean not null default true,
  observations_cutoff timestamptz not null,
  raw_records_cutoff timestamptz not null,
  observations_candidate_count integer not null default 0 check (observations_candidate_count >= 0),
  observations_deleted_count integer not null default 0 check (observations_deleted_count >= 0),
  raw_records_candidate_count integer not null default 0 check (raw_records_candidate_count >= 0),
  raw_records_deleted_count integer not null default 0 check (raw_records_deleted_count >= 0),
  policy jsonb not null,
  provenance jsonb not null default '{}'::jsonb
);

create index if not exists retention_runs_requested_idx on retention_runs (requested_at desc, run_kind);
create index if not exists retention_runs_dry_run_idx on retention_runs (dry_run, requested_at desc);

create or replace function run_observation_retention(
  retain_observations_days integer default 400,
  retain_raw_records_days integer default 90,
  dry_run boolean default true
)
returns uuid
language plpgsql
as $$
declare
  observations_cutoff timestamptz;
  raw_records_cutoff timestamptz;
  observation_candidates integer := 0;
  observations_deleted integer := 0;
  raw_record_candidates integer := 0;
  raw_records_deleted integer := 0;
  run_id uuid;
  policy jsonb;
begin
  if retain_observations_days < 31 then
    raise exception 'retain_observations_days must be at least 31';
  end if;
  if retain_raw_records_days < 7 then
    raise exception 'retain_raw_records_days must be at least 7';
  end if;
  if to_regclass('public.price_daily') is null or to_regclass('public.price_weekly') is null then
    raise exception 'price_daily and price_weekly rollups are required before observation retention';
  end if;

  observations_cutoff := now() - make_interval(days => retain_observations_days);
  raw_records_cutoff := now() - make_interval(days => retain_raw_records_days);
  policy := jsonb_build_object(
    'hotObservationDays', retain_observations_days,
    'rawRecordTtlDays', retain_raw_records_days,
    'observationPrerequisites', jsonb_build_array(
      'not referenced by latest_prices',
      'covered by price_daily source_observation_ids',
      'covered by price_weekly source_observation_ids'
    ),
    'rawRecordPrerequisites', jsonb_build_array(
      'not referenced by observations',
      'not referenced by observations_v2',
      'archive URI present in provenance'
    ),
    'archiveProvenanceKeys', jsonb_build_array('archiveUri', 'objectStorageUri', 'payloadArchiveUri', 'archive_url')
  );

  select count(*)::integer
    into observation_candidates
  from observations observation
  where observation.observed_at < observations_cutoff
    and not exists (
      select 1
      from latest_prices latest
      where latest.observation_id = observation.id
    )
    and exists (
      select 1
      from price_daily daily
      where daily.product_id = observation.product_id
        and daily.chain_id = observation.chain_id
        and daily.store_id is not distinct from observation.store_id
        and daily.price_type = observation.price_type
        and daily.currency = observation.currency
        and daily.bucket_day = observation.observed_at::date
        and daily.source_observation_ids @> array[observation.id]
    )
    and exists (
      select 1
      from price_weekly weekly
      where weekly.product_id = observation.product_id
        and weekly.chain_id = observation.chain_id
        and weekly.store_id is not distinct from observation.store_id
        and weekly.price_type = observation.price_type
        and weekly.currency = observation.currency
        and weekly.week_start = date_trunc('week', observation.observed_at)::date
        and weekly.source_observation_ids @> array[observation.id]
    );

  if not dry_run then
    with deleted as (
      delete from observations observation
      where observation.observed_at < observations_cutoff
        and not exists (
          select 1
          from latest_prices latest
          where latest.observation_id = observation.id
        )
        and exists (
          select 1
          from price_daily daily
          where daily.product_id = observation.product_id
            and daily.chain_id = observation.chain_id
            and daily.store_id is not distinct from observation.store_id
            and daily.price_type = observation.price_type
            and daily.currency = observation.currency
            and daily.bucket_day = observation.observed_at::date
            and daily.source_observation_ids @> array[observation.id]
        )
        and exists (
          select 1
          from price_weekly weekly
          where weekly.product_id = observation.product_id
            and weekly.chain_id = observation.chain_id
            and weekly.store_id is not distinct from observation.store_id
            and weekly.price_type = observation.price_type
            and weekly.currency = observation.currency
            and weekly.week_start = date_trunc('week', observation.observed_at)::date
            and weekly.source_observation_ids @> array[observation.id]
        )
      returning 1
    )
    select count(*)::integer into observations_deleted from deleted;
  end if;

  select count(*)::integer
    into raw_record_candidates
  from raw_records raw_record
  where raw_record.created_at < raw_records_cutoff
    and (
      raw_record.provenance ? 'archiveUri'
      or raw_record.provenance ? 'objectStorageUri'
      or raw_record.provenance ? 'payloadArchiveUri'
      or raw_record.provenance ? 'archive_url'
    )
    and not exists (
      select 1
      from observations observation
      where observation.raw_record_id = raw_record.id
    )
    and not exists (
      select 1
      from observations_v2 observation
      where observation.raw_record_id = raw_record.id
    );

  if not dry_run then
    with deleted as (
      delete from raw_records raw_record
      where raw_record.created_at < raw_records_cutoff
        and (
          raw_record.provenance ? 'archiveUri'
          or raw_record.provenance ? 'objectStorageUri'
          or raw_record.provenance ? 'payloadArchiveUri'
          or raw_record.provenance ? 'archive_url'
        )
        and not exists (
          select 1
          from observations observation
          where observation.raw_record_id = raw_record.id
        )
        and not exists (
          select 1
          from observations_v2 observation
          where observation.raw_record_id = raw_record.id
        )
      returning 1
    )
    select count(*)::integer into raw_records_deleted from deleted;
  end if;

  insert into retention_runs(
    run_kind,
    dry_run,
    observations_cutoff,
    raw_records_cutoff,
    observations_candidate_count,
    observations_deleted_count,
    raw_records_candidate_count,
    raw_records_deleted_count,
    policy,
    provenance
  )
  values (
    'observation_raw_tiering',
    dry_run,
    observations_cutoff,
    raw_records_cutoff,
    observation_candidates,
    observations_deleted,
    raw_record_candidates,
    raw_records_deleted,
    policy,
    jsonb_build_object('function', 'run_observation_retention', 'generatedByMigration', '027_observation_retention_policy')
  )
  returning id into run_id;

  return run_id;
end;
$$;

comment on table retention_runs is 'Audit log for dry-run and executed storage-retention jobs over observations and raw_records.';
comment on function run_observation_retention(integer, integer, boolean) is 'Safely tiers old observations and archived raw_records after rollup coverage and latest price references are checked.';
