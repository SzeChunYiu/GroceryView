-- Extend the fuel vertical with AdBlue and explicit station grade support.

alter table fuel_grades drop constraint if exists fuel_grades_id_check;
alter table fuel_grades add constraint fuel_grades_id_check
  check (id in ('fuel-95-e10', 'fuel-98', 'fuel-diesel', 'fuel-hvo100', 'fuel-e85', 'fuel-adblue'));

alter table fuel_grades drop constraint if exists fuel_grades_grade_code_check;
alter table fuel_grades add constraint fuel_grades_grade_code_check
  check (grade_code in ('95', '98', 'diesel', 'hvo100', 'e85', 'adblue'));

insert into fuel_grades(id, grade_code, label)
values ('fuel-adblue', 'adblue', 'AdBlue')
on conflict (id) do update set
  grade_code = excluded.grade_code,
  label = excluded.label,
  comparable_unit = excluded.comparable_unit,
  match_key = excluded.match_key,
  active = excluded.active,
  updated_at = now();

alter table stores add column if not exists supported_fuel_grade_ids text[] not null default '{}'::text[];

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stores_supported_fuel_grade_ids_check') then
    alter table stores add constraint stores_supported_fuel_grade_ids_check
      check (
        domain <> 'fuel'
        or supported_fuel_grade_ids <@ array['fuel-95-e10', 'fuel-98', 'fuel-diesel', 'fuel-hvo100', 'fuel-e85', 'fuel-adblue']::text[]
      );
  end if;
end $$;

comment on column stores.supported_fuel_grade_ids is 'Canonical fuel grade ids explicitly tagged for this fuel station. Empty means source coverage did not report grade support; it is not proof of absence.';
