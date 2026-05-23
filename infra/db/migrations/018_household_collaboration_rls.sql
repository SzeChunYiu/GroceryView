alter table household_members add column if not exists role text not null default 'editor' check (role in ('owner', 'editor', 'viewer'));
alter table household_basket_items add column if not exists checked boolean not null default false;
alter table household_basket_items add column if not exists checked_by text;
alter table household_basket_items add column if not exists checked_at timestamptz;

create index if not exists household_members_role_idx on household_members (household_id, role, user_id);
create index if not exists household_basket_items_checked_idx on household_basket_items (household_id, checked, line_position);

create or replace function household_auth_role(target_household_id text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select hm.role
  from household_members hm
  where hm.household_id = target_household_id
    and hm.user_id = auth.uid()::text
  limit 1
$$;

alter table household_plans enable row level security;
alter table household_members enable row level security;
alter table household_basket_items enable row level security;
alter table household_watchlist_items enable row level security;
alter table household_favorite_stores enable row level security;

create policy household_household_plans_member_select on household_plans
  for select
  using (user_id = auth.uid()::text or household_auth_role(id) is not null);

create policy household_household_plans_owner_write on household_plans
  for all
  using (user_id = auth.uid()::text or household_auth_role(id) in ('owner', 'editor'))
  with check (user_id = auth.uid()::text or household_auth_role(id) in ('owner', 'editor'));

create policy household_household_members_member_select on household_members
  for select
  using (user_id = auth.uid()::text or household_auth_role(household_id) is not null);

create policy household_household_members_owner_write on household_members
  for all
  using (household_auth_role(household_id) = 'owner')
  with check (household_auth_role(household_id) = 'owner');

create policy household_household_basket_items_member_select on household_basket_items
  for select
  using (household_auth_role(household_id) is not null);

create policy household_household_basket_items_editor_write on household_basket_items
  for all
  using (household_auth_role(household_id) in ('owner', 'editor'))
  with check (household_auth_role(household_id) in ('owner', 'editor'));

create policy household_household_watchlist_items_member_select on household_watchlist_items
  for select
  using (household_auth_role(household_id) is not null);

create policy household_household_watchlist_items_editor_write on household_watchlist_items
  for all
  using (household_auth_role(household_id) in ('owner', 'editor'))
  with check (household_auth_role(household_id) in ('owner', 'editor'));

create policy household_household_favorite_stores_member_select on household_favorite_stores
  for select
  using (household_auth_role(household_id) is not null);

create policy household_household_favorite_stores_editor_write on household_favorite_stores
  for all
  using (household_auth_role(household_id) in ('owner', 'editor'))
  with check (household_auth_role(household_id) in ('owner', 'editor'));
