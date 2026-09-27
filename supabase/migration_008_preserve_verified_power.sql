-- Migration 008: не затирать проверенную мощность при импорте карточки.
-- Выполнить один раз в Supabase SQL Editor.
--
-- Источник не содержит мощность у части автомобилей. Если очередной импорт
-- присылает NULL, старое подтверждённое значение сохраняется.

create or replace function preserve_verified_car_fields()
returns trigger
language plpgsql
as $$
begin
  if new.power_hp is null and old.power_hp is not null then
    new.power_hp := old.power_hp;
  end if;
  return new;
end;
$$;

drop trigger if exists cars_preserve_verified_fields on cars;
create trigger cars_preserve_verified_fields
before update on cars
for each row
execute function preserve_verified_car_fields();

-- Проверка после применения:
-- select count(*) filter (where power_hp is null) as without_power,
--        count(*) filter (where power_hp is not null) as with_power
-- from cars;
