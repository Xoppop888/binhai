-- Migration 005: автоматический контроль качества данных автомобилей.
-- Выполнить один раз в Supabase SQL Editor.
--
-- Политика:
--   * физически невозможные значения (мощность <= 0 или > 500 л.с.,
--     батарея <= 0 или > 250 кВт·ч) отклоняются ошибкой;
--   * неполные/сомнительные записи не блокируются, а получают статус
--     needs_review и список проблем для проверки в /admin;
--   * триггер не пытается угадывать мощность по названию модели: фактическую
--     мощность нужно сверять с источником/документами конкретной комплектации.

alter table cars
  add column if not exists data_quality_status text not null default 'needs_review',
  add column if not exists data_quality_issues text[] not null default '{}',
  add column if not exists data_quality_checked_at timestamptz;

alter table cars drop constraint if exists cars_data_quality_status_check;
alter table cars add constraint cars_data_quality_status_check
  check (data_quality_status in ('ok', 'needs_review'));

create index if not exists idx_cars_data_quality_status
  on cars (data_quality_status);

create or replace function validate_car_data_quality()
returns trigger
language plpgsql
as $$
declare
  issues text[] := '{}';
begin
  -- Жёсткие ошибки: такую запись нельзя сохранять как корректную.
  if new.power_hp is not null and (new.power_hp <= 0 or new.power_hp > 500) then
    raise exception 'power_hp must be between 1 and 500 hp, got %', new.power_hp
      using errcode = '22023';
  end if;

  if new.battery_kwh is not null and (new.battery_kwh <= 0 or new.battery_kwh > 250) then
    raise exception 'battery_kwh must be between 0 and 250 kWh, got %', new.battery_kwh
      using errcode = '22023';
  end if;

  -- Мягкие проверки: сохраняем запись, но не допускаем её к уверенному расчёту.
  if coalesce(new.fuel_type, 'unknown') = 'unknown' then
    issues := array_append(issues, 'fuel_type_unknown');
  end if;

  if coalesce(new.fuel_type, 'unknown') in ('ice', 'hybrid')
     and new.power_hp is null then
    issues := array_append(issues, 'power_hp_missing');
  end if;

  if coalesce(new.fuel_type, 'unknown') in ('ice', 'hybrid')
     and nullif(btrim(coalesce(new.engine_volume, '')), '') is null then
    issues := array_append(issues, 'engine_volume_missing');
  end if;

  if new.fuel_type = 'ev' and (new.battery_kwh is null or new.battery_kwh <= 0) then
    issues := array_append(issues, 'battery_kwh_missing_for_ev');
  end if;

  if new.fuel_type = 'ev'
     and nullif(btrim(coalesce(new.engine_volume, '')), '') is not null then
    issues := array_append(issues, 'engine_volume_present_for_ev');
  end if;

  if new.fuel_type in ('ice', 'hybrid', 'unknown') and new.battery_kwh is not null then
    issues := array_append(issues, 'battery_kwh_present_for_non_ev');
  end if;

  if new.power_hp is not null and new.power_hp > 160 then
    issues := array_append(issues, 'power_over_160_manual_customs_review');
  end if;

  new.data_quality_issues := issues;
  new.data_quality_status := case when cardinality(issues) = 0 then 'ok' else 'needs_review' end;
  new.data_quality_checked_at := now();
  return new;
end;
$$;

drop trigger if exists cars_validate_data_quality on cars;
create trigger cars_validate_data_quality
before insert or update on cars
for each row
execute function validate_car_data_quality();

-- Первичная маркировка уже существующих записей.
update cars
set data_quality_checked_at = now();

-- Контрольный отчёт после применения миграции:
-- select data_quality_status, count(*) from cars group by data_quality_status;
-- select slug, brand, model, data_quality_issues from cars
--   where data_quality_status = 'needs_review' order by brand, model;
