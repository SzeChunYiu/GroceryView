alter table notification_tasks
  add column if not exists source_user_id text;

alter table notification_tasks
  add column if not exists source_product_id text;

create index if not exists notification_tasks_stale_price_warning_suppression_idx
  on notification_tasks (type, source_user_id, source_product_id, send_at desc)
  where type = 'stale_price_warning';
