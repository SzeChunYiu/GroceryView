"""Price rollup and GroceryView index seed assets."""

from statistics import mean
from typing import TypedDict

from dagster import asset

from groceryview_data_pipeline.schemas.observations import PriceObservation


class LatestPriceRollup(TypedDict):
    product_key: str
    price: float
    currency: str
    source_type: str
    confidence_score: float


class DailySeriesRollup(TypedDict):
    product_key: str
    observed_date: str
    median_price: float
    observations: int


@asset(group_name="rollups")
def latest_store_prices_rollup(
    price_observations: list[PriceObservation],
) -> list[LatestPriceRollup]:
    """Latest demo price by product/source until DB-backed materialization exists."""

    return [
        {
            "product_key": row.product_key,
            "price": row.price,
            "currency": row.currency,
            "source_type": row.source_type,
            "confidence_score": row.confidence_score,
        }
        for row in price_observations
    ]


@asset(group_name="rollups")
def price_series_daily_rollup(
    price_observations: list[PriceObservation],
) -> list[DailySeriesRollup]:
    """Daily demo price series rollup."""

    rows: list[DailySeriesRollup] = []
    grouped: dict[tuple[str, str], list[float]] = {}
    for observation in price_observations:
        key = (observation.product_key, observation.observed_at.date().isoformat())
        grouped.setdefault(key, []).append(observation.price)
    for (product_key, observed_date), prices in grouped.items():
        rows.append(
            {
                "product_key": product_key,
                "observed_date": observed_date,
                "median_price": mean(prices),
                "observations": len(prices),
            }
        )
    return rows


@asset(group_name="rollups")
def stockholm_grocery_index_seed(
    price_series_daily_rollup: list[DailySeriesRollup],
) -> dict[str, object]:
    """Seed Stockholm Grocery Index input from daily demo series."""

    return {
        "index_code": "STHLM-GROCERY-IDX",
        "components": len(price_series_daily_rollup),
        "status": "seed_demo",
    }


@asset(group_name="rollups")
def deal_score_input_seed(
    latest_store_prices_rollup: list[LatestPriceRollup],
) -> list[dict[str, object]]:
    """Minimal deal-score input rows without distance/travel-time penalties."""

    return [
        {
            "product_key": row["product_key"],
            "current_price": row["price"],
            "confidence_score": row["confidence_score"],
            "distance_penalty": None,
        }
        for row in latest_store_prices_rollup
    ]
