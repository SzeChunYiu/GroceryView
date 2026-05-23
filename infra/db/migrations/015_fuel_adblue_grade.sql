-- Add AdBlue to the fuel grade catalog.
--
-- Migration 014 created the fuel source model with five fuels. The product
-- backlog includes AdBlue as the sixth fuel-lane item, so widen the catalog
-- checks and seed the grade without changing any existing observations.

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
  active = true,
  updated_at = now();
