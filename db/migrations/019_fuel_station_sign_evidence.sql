alter table fuel_price_sources
  drop constraint if exists fuel_price_sources_evidence_type_check;

alter table fuel_price_sources
  add constraint fuel_price_sources_evidence_type_check
  check (evidence_type in ('receipt', 'pump_photo', 'manual_entry', 'station_sign'));
