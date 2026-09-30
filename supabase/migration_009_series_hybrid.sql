-- Migration 009: добавить последовательный гибрид.
-- Выполнить один раз в Supabase SQL Editor.
-- Данные автомобилей не изменяются.

-- Сначала удаляем старые CHECK-ограничения, связанные с fuel_type,
-- независимо от их фактического имени в текущей базе.
do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conname
    from pg_constraint
    where conrelid = 'public.cars'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%fuel_type%'
  loop
    execute format(
      'alter table public.cars drop constraint %I',
      constraint_row.conname
    );
  end loop;
end $$;

alter table public.cars
  add constraint cars_fuel_type_check
  check (fuel_type in ('ice', 'hybrid', 'series_hybrid', 'ev', 'unknown'));

comment on column public.cars.fuel_type is
  'Тип силовой установки: ice (ДВС), hybrid (гибрид), series_hybrid (последовательный гибрид), ev (электро), unknown — требуется проверка';

-- Обновляем data-quality trigger: series_hybrid требует ДВС-поля
-- и проверяется по мощности так же, как обычный hybrid.
create or replace function public.validate_car_data_quality()
returns trigger
language plpgsql
as $$
declare
  issues text[] := '{}';
begin
  if new.power_hp is not null and (new.power_hp <= 0 or new.power_hp > 500) then
    raise exception 'power_hp must be between 1 and 500 hp, got %', new.power_hp
      using errcode = '22023';
  end if;

  if new.battery_kwh is not null and (new.battery_kwh <= 0 or new.battery_kwh > 250) then
    raise exception 'battery_kwh must be between 0 and 250 kWh, got %', new.battery_kwh
      using errcode = '22023';
  end if;

  if coalesce(new.fuel_type, 'unknown') = 'unknown' then
    issues := array_append(issues, 'fuel_type_unknown');
  end if;

  if coalesce(new.fuel_type, 'unknown') in ('ice', 'hybrid', 'series_hybrid')
     and new.power_hp is null then
    issues := array_append(issues, 'power_hp_missing');
  end if;

  if coalesce(new.fuel_type, 'unknown') in ('ice', 'hybrid', 'series_hybrid')
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

  if new.fuel_type in ('ice', 'hybrid', 'series_hybrid', 'unknown')
     and new.battery_kwh is not null then
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

-- Контроль ограничения после миграции.
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.cars'::regclass
  and conname = 'cars_fuel_type_check';
