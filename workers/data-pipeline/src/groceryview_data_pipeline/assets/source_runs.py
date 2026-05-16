"""Source-run ledger assets."""

from datetime import UTC, datetime
from typing import Literal, TypedDict

from dagster import asset

Status = Literal["planned", "started", "succeeded", "failed", "blocked_approval"]


class SourceRunRecord(TypedDict):
    source_name: str
    started_at: datetime
    parser_version: str
    status: Status


@asset(group_name="source_runs")
def source_runs_seed() -> list[SourceRunRecord]:
    """Create/log source_runs records once the DB schema is available."""

    started_at = datetime.now(tz=UTC)
    return [
        {
            "source_name": "willys",
            "started_at": started_at,
            "parser_version": "willys-v0-stub",
            "status": "blocked_approval",
        },
        {
            "source_name": "hemkop",
            "started_at": started_at,
            "parser_version": "hemkop-v0-stub",
            "status": "blocked_approval",
        },
        {
            "source_name": "open_food_facts",
            "started_at": started_at,
            "parser_version": "off-v0-stub",
            "status": "planned",
        },
    ]
