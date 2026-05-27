-- Per-user substitution tolerance for broad grocery classes.
-- class_id must reference a broad class such as 'apple', not a narrow variant like 'apple-granny-smith'.

create table if not exists substitution_willingness (
  user_id text not null,
  class_id text not null,
  willingness text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, class_id),
  constraint substitution_willingness_value_check check (willingness in ('strict', 'broad', 'narrow'))
);

create or replace function default_substitution_willingness_for_class(input_class_id text)
returns text
language sql
immutable
as $$
  select case
    when input_class_id ~ '^(meat|beef|pork|chicken|fish|seafood|cured-|mince)' then 'narrow'
    when input_class_id ~ '^(brand|branded|sku|gtin)' then 'strict'
    else 'broad'
  end
$$;

create or replace function set_substitution_willingness_default()
returns trigger
language plpgsql
as $$
begin
  if new.willingness is null then
    new.willingness := default_substitution_willingness_for_class(new.class_id);
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists substitution_willingness_defaults on substitution_willingness;
create trigger substitution_willingness_defaults
before insert or update on substitution_willingness
for each row execute function set_substitution_willingness_default();

alter table substitution_willingness
  alter column willingness set not null;

create index if not exists substitution_willingness_user_idx on substitution_willingness(user_id);
create index if not exists substitution_willingness_class_idx on substitution_willingness(class_id, willingness);

comment on table substitution_willingness is 'Per-user substitution willingness by broad class id. Use broad for produce defaults, narrow for meat defaults, and strict for branded-item defaults.';
comment on column substitution_willingness.class_id is 'Broad canonical class only, for example apple rather than apple-granny-smith.';
comment on column substitution_willingness.willingness is 'strict = exact canonical only; narrow = exact class; broad = any sub-class works.';
