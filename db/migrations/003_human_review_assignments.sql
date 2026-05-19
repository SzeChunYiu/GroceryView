create table if not exists human_review_assignments (
  id text primary key,
  review_id text not null unique,
  subject_type text not null check (subject_type in ('product_match', 'community_report')),
  subject_id text not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  reason text not null,
  assignee_id text not null,
  assigned_at timestamptz not null,
  due_at timestamptz not null,
  status text not null check (status in ('assigned', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists human_review_assignments_status_due_idx on human_review_assignments(status, due_at);
create index if not exists human_review_assignments_assignee_status_idx on human_review_assignments(assignee_id, status);
