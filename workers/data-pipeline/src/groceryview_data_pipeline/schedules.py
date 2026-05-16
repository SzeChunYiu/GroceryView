"""Dagster schedules for GroceryView data assets."""

from dagster import DefaultScheduleStatus, ScheduleDefinition

from groceryview_data_pipeline.jobs import retailer_fetch_job

# Website scrapers run in the robots-requested Axfood window and use job retry policies
# (3 retries with exponential backoff). Consecutive-failure alert hooks will be wired to
# deployment-specific notifications once infra secrets exist.
retailer_fetch_daily_schedule = ScheduleDefinition(
    name="retailer_fetch_daily_schedule",
    job=retailer_fetch_job,
    cron_schedule="30 4 * * *",
    execution_timezone="UTC",
    default_status=DefaultScheduleStatus.STOPPED,
)

ALL_SCHEDULES = [retailer_fetch_daily_schedule]
