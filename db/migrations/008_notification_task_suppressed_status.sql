alter table notification_tasks
  drop constraint if exists notification_tasks_status_check;

alter table notification_tasks
  add constraint notification_tasks_status_check
  check (status in ('queued', 'delivered', 'dead_lettered', 'suppressed'));
