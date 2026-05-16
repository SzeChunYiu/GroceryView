"""Stockholm chain, store, and hero product seed assets."""

from typing import TypedDict

from dagster import asset


class ChainSeed(TypedDict):
    chain_code: str
    name: str
    country_code: str


class StoreSeed(TypedDict):
    chain_code: str
    store_name: str
    city: str
    district: str


class HeroProductSeed(TypedDict):
    slug: str
    name: str
    category: str


@asset(group_name="seed_catalog")
def stockholm_chain_seed() -> list[ChainSeed]:
    """Seed Stockholm launch chains from GOAL.md/ROADMAP.md."""

    return [
        {"chain_code": "ica", "name": "ICA", "country_code": "SE"},
        {"chain_code": "willys", "name": "Willys", "country_code": "SE"},
        {"chain_code": "coop", "name": "Coop", "country_code": "SE"},
        {"chain_code": "hemkop", "name": "Hemköp", "country_code": "SE"},
        {"chain_code": "lidl", "name": "Lidl", "country_code": "SE"},
        {"chain_code": "city-gross", "name": "City Gross", "country_code": "SE"},
    ]


@asset(group_name="seed_catalog")
def stockholm_store_seed(stockholm_chain_seed: list[ChainSeed]) -> list[StoreSeed]:
    """Demo Stockholm store seeds until infra/db/seeds/001_stockholm_seed.sql exists."""

    known_chains = {chain["chain_code"] for chain in stockholm_chain_seed}
    demo_rows: list[StoreSeed] = [
        {
            "chain_code": "ica",
            "store_name": "ICA Stockholm seed",
            "city": "Stockholm",
            "district": "Innerstaden",
        },
        {
            "chain_code": "willys",
            "store_name": "Willys Stockholm seed",
            "city": "Stockholm",
            "district": "Innerstaden",
        },
        {
            "chain_code": "coop",
            "store_name": "Coop Stockholm seed",
            "city": "Stockholm",
            "district": "Innerstaden",
        },
        {
            "chain_code": "hemkop",
            "store_name": "Hemköp Stockholm seed",
            "city": "Stockholm",
            "district": "Innerstaden",
        },
        {
            "chain_code": "lidl",
            "store_name": "Lidl Stockholm seed",
            "city": "Stockholm",
            "district": "Innerstaden",
        },
        {
            "chain_code": "city-gross",
            "store_name": "City Gross Stockholm seed",
            "city": "Stockholm",
            "district": "Stockholm",
        },
    ]
    return [row for row in demo_rows if row["chain_code"] in known_chains]


@asset(group_name="seed_catalog")
def hero_product_seed() -> list[HeroProductSeed]:
    """Initial hero products from PROPOSAL.md section 15."""

    return [
        {"slug": "milk-1l", "name": "Milk 1L", "category": "dairy"},
        {"slug": "eggs-12-pack", "name": "Eggs 12-pack", "category": "dairy"},
        {"slug": "butter-500g", "name": "Butter 500g", "category": "dairy"},
        {"slug": "ground-coffee-450g", "name": "Ground coffee 450g", "category": "pantry"},
        {"slug": "chicken-fillet-1kg", "name": "Chicken fillet 1kg", "category": "meat"},
        {"slug": "minced-beef-500g", "name": "Minced beef 500g", "category": "meat"},
        {"slug": "pasta-500g", "name": "Pasta 500g", "category": "pantry"},
        {"slug": "rice-1kg", "name": "Rice 1kg", "category": "pantry"},
        {"slug": "bread-loaf", "name": "Bread loaf", "category": "bakery"},
        {"slug": "cheese-500g", "name": "Cheese 500g", "category": "dairy"},
        {"slug": "bananas-1kg", "name": "Bananas 1kg", "category": "produce"},
        {"slug": "tomatoes-500g", "name": "Tomatoes 500g", "category": "produce"},
        {"slug": "potatoes-2kg", "name": "Potatoes 2kg", "category": "produce"},
        {"slug": "toilet-paper-8-pack", "name": "Toilet paper 8-pack", "category": "household"},
        {"slug": "laundry-detergent", "name": "Laundry detergent", "category": "household"},
        {"slug": "diapers-pack", "name": "Diapers pack", "category": "baby"},
        {"slug": "oat-milk-1l", "name": "Oat milk 1L", "category": "dairy alternatives"},
        {"slug": "yogurt-1kg", "name": "Yogurt 1kg", "category": "dairy"},
        {"slug": "olive-oil-500ml", "name": "Olive oil 500ml", "category": "pantry"},
        {"slug": "frozen-pizza", "name": "Frozen pizza", "category": "frozen"},
    ]
