-- Operational maintenance for monthly observations_v2 partitions.
--
-- Migration 013 creates the partitioned observations_v2 mirror and the
-- low-level create/drop helpers. This migration adds the scheduled driver and
-- an EXPLAIN helper operators can use to prove date-scoped reads prune monthly
-- partitions before promoting long-range price-history queries.

create table if not exists observations_partition_maintenance_runs (
  id bigserial primary key,
  ran_at timestamptz not null default now(),
  anchor_month date not null,
  months_ahead integer not null,
  retention_months integer,
  created_partitions text[] not null default array[]::text[],
  dropped_partitions text[] not null default array[]::text[]
);

create or replace function run_observations_partition_maintenance(
  anchor_at timestamptz default now(),
  months_ahead integer default 3,
  retention_months integer default null
)
returns table(created_partitions text[], dropped_partitions text[])
language plpgsql
as $$
declare
  anchor_month date := date_trunc('month', anchor_at)::date;
  normalized_months_ahead integer := greatest(coalesce(months_ahead, 0), 0);
  normalized_retention_months integer := nullif(greatest(coalesce(retention_months, 0), 0), 0);
begin
  created_partitions := create_observations_partitions(anchor_month, normalized_months_ahead);
  dropped_partitions := array[]::text[];

  if normalized_retention_months is not null then
    dropped_partitions := drop_observations_partitions_before(
      (anchor_month - (normalized_retention_months || ' months')::interval)::date
    );
  end if;

  insert into observations_partition_maintenance_runs(
    anchor_month,
    months_ahead,
    retention_months,
    created_partitions,
    dropped_partitions
  )
  values (
    anchor_month,
    normalized_months_ahead,
    normalized_retention_months,
    created_partitions,
    dropped_partitions
  );

  return next;
end;
$$;

create or replace function explain_observations_v2_date_pruning(
  window_start timestamptz,
  window_end timestamptz
)
returns table(plan_line text)
language plpgsql
as $$
begin
  if window_end <= window_start then
    raise exception 'window_end must be after window_start';
  end if;

  return query execute format(
    'explain (costs off) select id from observations_v2 where observed_at >= %L::timestamptz and observed_at < %L::timestamptz',
    window_start,
    window_end
  );
end;
$$;

do $$
begin
  perform run_observations_partition_maintenance(now(), 6, null);

  if to_regprocedure('cron.schedule(text,text,text)') is not null then
    if not exists (
      select 1
      from cron.job
      where jobname = 'groceryview_observations_partition_maintenance'
    ) then
      perform cron.schedule(
        'groceryview_observations_partition_maintenance',
        '17 2 * * *',
        $cron$select * from run_observations_partition_maintenance(now(), 6, null);$cron$
      );
    end if;
  end if;
end;
$$;

comment on table observations_partition_maintenance_runs is 'Audit log for scheduled observations_v2 monthly partition creation and retention.';
comment on function run_observations_partition_maintenance(timestamptz, integer, integer) is 'Creates future observations_v2 monthly partitions and optionally drops partitions outside the retention window.';
comment on function explain_observations_v2_date_pruning(timestamptz, timestamptz) is 'Returns an EXPLAIN plan for date-scoped observations_v2 reads so operators can verify monthly partition pruning.';
