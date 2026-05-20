from decimal import Decimal
import unittest

from groceryview_data_pipeline.assets import (
    build_latest_price_rollup,
    collect_quality_checks,
    normalize_retailer_records,
    retailer_fetch_stubs,
    seed_products,
    seed_stores,
)


class DataPipelineAssetTests(unittest.TestCase):
    def test_stub_records_normalize_to_provenance_carrying_observations(self):
        observations = normalize_retailer_records(retailer_fetch_stubs())

        self.assertEqual(len(observations), 3)
        self.assertEqual({item.currency for item in observations}, {"SEK"})
        self.assertEqual({item.price_type for item in observations}, {"promotion", "shelf", "online"})
        for observation in observations:
            self.assertIn("source_run_id", observation.provenance)
            self.assertIn("raw_record_ref", observation.provenance)
            self.assertIn("parser_version", observation.provenance)
            self.assertGreaterEqual(observation.confidence, Decimal("0"))
            self.assertLessEqual(observation.confidence, Decimal("1"))

    def test_latest_price_rollup_keeps_newest_per_product_store_and_price_type(self):
        raw_records = retailer_fetch_stubs()
        first_record = raw_records[0]
        older_duplicate = type(first_record)(
            source_run_id=first_record.source_run_id,
            source_type=first_record.source_type,
            source_name=first_record.source_name,
            source_url=first_record.source_url,
            external_ref="willys:coffee:older",
            observed_at="2026-05-20T05:00:00Z",
            payload={**first_record.payload, "displayPrice": "55.90"},
            provenance=first_record.provenance,
        )
        observations = normalize_retailer_records([older_duplicate, *raw_records])

        latest_prices = build_latest_price_rollup(observations)

        coffee = [price for price in latest_prices if price.product_id == "prod-arabica-coffee-450g"]
        self.assertEqual(len(coffee), 1)
        self.assertEqual(coffee[0].observation_ref, "willys:coffee:450g")
        self.assertEqual(coffee[0].price, Decimal("49.90"))

    def test_quality_checks_pass_for_seeded_stub_pipeline(self):
        stores = seed_stores()
        products = seed_products()
        raw_records = retailer_fetch_stubs()
        observations = normalize_retailer_records(raw_records)
        latest_prices = build_latest_price_rollup(observations)

        checks = collect_quality_checks(stores, products, raw_records, observations, latest_prices)

        self.assertEqual([check.name for check in checks], [
            "observations_reference_seed_products",
            "observations_reference_seed_stores",
            "raw_records_include_parser_provenance",
            "latest_prices_cover_observation_keys",
        ])
        self.assertTrue(all(check.passed for check in checks), checks)


if __name__ == "__main__":
    unittest.main()
