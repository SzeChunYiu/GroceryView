-- Helpers for keeping the append-only price_observations partition set ahead of ingestion.
-- Migrations 002/003 create the partitioned table and parent indexes; this migration
-- adds a reusable function workers/operators can call from a scheduler.

CREATE OR REPLACE FUNCTION ensure_price_observation_partitions(
  months_ahead INTEGER DEFAULT 6,
  months_behind INTEGER DEFAULT 1,
  anchor_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(partition_name TEXT, range_start TIMESTAMPTZ, range_end TIMESTAMPTZ, action TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  start_month DATE;
  end_month DATE;
  month_cursor DATE;
  desired_partition_name TEXT;
  desired_range_start TIMESTAMPTZ;
  desired_range_end TIMESTAMPTZ;
  default_rows BIGINT;
BEGIN
  IF months_ahead < 0 THEN
    RAISE EXCEPTION 'months_ahead must be non-negative, got %', months_ahead;
  END IF;

  IF months_behind < 0 THEN
    RAISE EXCEPTION 'months_behind must be non-negative, got %', months_behind;
  END IF;

  start_month := (date_trunc('month', anchor_date)::DATE - make_interval(months => months_behind))::DATE;
  end_month := (date_trunc('month', anchor_date)::DATE + make_interval(months => months_ahead))::DATE;
  month_cursor := start_month;

  WHILE month_cursor <= end_month LOOP
    desired_partition_name := 'price_observations_' || to_char(month_cursor, 'YYYY_MM');
    desired_range_start := (to_char(month_cursor, 'YYYY-MM-DD') || ' 00:00:00+00')::TIMESTAMPTZ;
    desired_range_end := (to_char(month_cursor + INTERVAL '1 month', 'YYYY-MM-DD') || ' 00:00:00+00')::TIMESTAMPTZ;

    IF to_regclass('public.' || desired_partition_name) IS NOT NULL THEN
      partition_name := desired_partition_name;
      range_start := desired_range_start;
      range_end := desired_range_end;
      action := 'exists';
      RETURN NEXT;
    ELSE
      EXECUTE 'SELECT count(*) FROM price_observations_default WHERE observed_at >= $1 AND observed_at < $2'
        INTO default_rows
        USING desired_range_start, desired_range_end;

      IF default_rows > 0 THEN
        RAISE EXCEPTION
          'cannot create partition %, price_observations_default contains % row(s) in [% - %); drain/replay default rows before adding this partition',
          desired_partition_name,
          default_rows,
          desired_range_start,
          desired_range_end;
      END IF;

      EXECUTE format(
        'CREATE TABLE %I PARTITION OF price_observations FOR VALUES FROM (%L) TO (%L)',
        desired_partition_name,
        desired_range_start,
        desired_range_end
      );

      partition_name := desired_partition_name;
      range_start := desired_range_start;
      range_end := desired_range_end;
      action := 'created';
      RETURN NEXT;
    END IF;

    month_cursor := (month_cursor + INTERVAL '1 month')::DATE;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION ensure_price_observation_partitions(INTEGER, INTEGER, DATE) IS
  'Creates missing monthly price_observations partitions around an anchor date. Call from scheduler before each month starts; raises if matching rows already landed in the default partition.';

-- Deterministically extend the MVP development partition window through November 2026.
-- Ongoing workers should call the function with CURRENT_DATE from scheduled maintenance.
SELECT * FROM ensure_price_observation_partitions(6, 0, DATE '2026-05-01');
