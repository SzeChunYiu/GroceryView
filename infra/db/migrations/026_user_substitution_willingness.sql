-- Per-user substitution tolerance for broad product classes.
-- Produce classes default to broad matching, meat classes to narrow matching,
-- and branded classes to strict matching unless a user overrides the row.

create table if not exists substitution_willingness (
  user_id text not null references app_users(id) on delete cascade,
  class_id text not null,
  willingness text not null check (willingness in ('strict', 'broad', 'narrow')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, class_id),
  check (class_id <> '')
);

create index if not exists substitution_willingness_user_idx
  on substitution_willingness (user_id, class_id);

create index if not exists substitution_willingness_class_idx
  on substitution_willingness (class_id, willingness);

create or replace function set_default_substitution_willingness()
returns trigger language plpgsql as $$
begin
  if new.class_id is null or btrim(new.class_id) = '' then
    raise exception 'substitution_willingness.class_id must not be empty';
  end if;

  new.class_id = lower(btrim(new.class_id));

  if to_regclass('produce_classes') is not null then
    if exists (
      select 1
      from produce_classes
      where id = new.class_id
        and depth > 1
    ) then
      raise exception 'substitution_willingness.class_id must be a broad class, got %', new.class_id;
    end if;

    if new.willingness is null and (
      new.class_id ~ '^(produce|vegetable|fruit|herb|mushroom|apple|pear|potato|tomato|citrus)(-|$)'
      or exists (
        select 1
        from produce_classes
        where id = new.class_id
      )
    ) then
      new.willingness = 'broad';
    end if;
  elsif new.willingness is null and new.class_id ~ '^(produce|vegetable|fruit|herb|mushroom|apple|pear|potato|tomato|citrus)(-|$)' then
    new.willingness = 'broad';
  end if;

  if new.willingness is null and new.class_id ~ '^(meat|beef|pork|chicken|lamb|fish|seafood|deli)(-|$)' then
    new.willingness = 'narrow';
  end if;

  if new.willingness is null then
    new.willingness = 'strict';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists substitution_willingness_defaults on substitution_willingness;
create trigger substitution_willingness_defaults
before insert or update on substitution_willingness
for each row execute function set_default_substitution_willingness();
