create table if not exists human_reviewers (
  id text primary key,
  role text not null check (role in ('viewer', 'moderator', 'lead')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists human_reviewers_role_active_idx on human_reviewers(role, active);
