-- 022: per-user product-class substitution willingness.
--
-- This records explicit shopper overrides for broad product classes. Missing
-- rows are interpreted by the application default policy:
--   * produce classes default to 'broad'  (any subclass works)
--   * meat classes default to 'narrow'    (only the requested broad class)
--   * branded items default to 'strict'   (only the exact canonical product)
--
-- class_id intentionally stores broad class identifiers such as 'apple' or
-- 'chicken'. Variant/subclass ids such as 'apple-granny-smith' are rejected so
-- the preference remains class-scoped instead of becoming SKU-specific.

create table if not exists substitution_willingness (
  user_id text not null references app_users(id) on delete cascade,
  class_id text not null check (
    class_id = lower(class_id)
    and class_id ~ '^[a-z0-9][a-z0-9_]*$'
  ),
  willingness text not null check (willingness in ('strict', 'broad', 'narrow')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, class_id)
);

create index if not exists substitution_willingness_class_idx
  on substitution_willingness (class_id, willingness, user_id);

create or replace function default_substitution_willingness(class_kind text)
returns text
language sql
immutable
parallel safe
as $$
  select case lower(trim(coalesce(class_kind, '')))
    when 'produce' then 'broad'
    when 'meat' then 'narrow'
    when 'branded' then 'strict'
    else 'strict'
  end
$$;

comment on table substitution_willingness is
  'Per-user substitution willingness overrides for broad product classes. Missing rows use policy defaults: produce=broad, meat=narrow, branded=strict.';

comment on function default_substitution_willingness(text) is
  'Default substitution willingness policy: produce=broad, meat=narrow, branded=strict, unknown=strict.';

comment on column substitution_willingness.class_id is
  'Broad product class id only, for example apple or chicken; subclass/variant ids such as apple-granny-smith are rejected.';

comment on column substitution_willingness.willingness is
  'strict = exact canonical product only; narrow = exact broad class only; broad = any subclass within the broad class works.';
