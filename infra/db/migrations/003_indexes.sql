-- GroceryView indexes for spatial search, product search, time series, and user lists.
CREATE INDEX stores_location_gist_idx ON stores USING GIST (location);
CREATE INDEX stores_city_chain_idx ON stores (city_id, chain_id);

CREATE INDEX products_name_trgm_idx ON products USING GIN (name gin_trgm_ops);
CREATE INDEX products_category_idx ON products (category, subcategory);

CREATE INDEX product_aliases_alias_trgm_idx ON product_aliases USING GIN (alias gin_trgm_ops);
CREATE INDEX product_aliases_product_idx ON product_aliases (product_id);

CREATE INDEX price_observations_product_city_observed_idx
  ON price_observations (product_id, city_id, observed_at DESC);
CREATE INDEX price_observations_store_observed_idx
  ON price_observations (store_id, observed_at DESC);
CREATE INDEX price_observations_source_run_idx ON price_observations (source_run_id);
CREATE INDEX price_observations_raw_record_idx ON price_observations (raw_record_id);

CREATE INDEX promotion_observations_product_dates_idx
  ON promotion_observations (product_id, promo_start, promo_end);
CREATE INDEX promotion_observations_store_observed_idx
  ON promotion_observations (store_id, observed_at DESC);

CREATE INDEX latest_store_prices_product_store_idx ON latest_store_prices (product_id, store_id);
CREATE INDEX latest_store_prices_city_product_idx ON latest_store_prices (city_id, product_id, price_sek);

CREATE INDEX price_series_daily_product_city_date_idx ON price_series_daily (product_id, city_id, series_date DESC);
CREATE INDEX index_snapshots_key_date_idx ON index_snapshots (index_key, snapshot_date DESC);

CREATE INDEX watchlist_items_user_product_idx ON watchlist_items (user_id, product_id);
CREATE INDEX basket_items_basket_product_idx ON basket_items (weekly_basket_id, product_id);
CREATE INDEX favorite_stores_user_idx ON favorite_stores (user_id);
CREATE INDEX alerts_user_status_idx ON alerts (user_id, status);
CREATE INDEX source_records_raw_run_idx ON source_records_raw (source_run_id);
CREATE INDEX moderation_queue_status_idx ON moderation_queue (status, created_at);
