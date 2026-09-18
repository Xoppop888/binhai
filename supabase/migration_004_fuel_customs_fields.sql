-- Migration 004: поля для расчёта растаможки (тип силовой установки,
-- мощность, ёмкость батареи) + таблица курсов валют.
--
-- Парсер тянет с bhgjauto.com только объём двигателя. Мощность и тип
-- силовой установки он не даёт — эти поля заполняются вручную в /admin
-- (или эвристикой detectFuelType.js как черновая подсказка, требующая
-- подтверждения админом).

alter table cars
  add column if not exists fuel_type text
    check (fuel_type in ('ice', 'hybrid', 'ev', 'unknown'))
    default 'unknown',
  add column if not exists power_hp integer,
  add column if not exists battery_kwh numeric(6,2);

comment on column cars.fuel_type is
  'Тип силовой установки: ice (ДВС), hybrid, ev (электро), unknown — не определено, нужна ручная проверка в /admin';
comment on column cars.power_hp is
  'Мощность, л.с. Нужна для утильсбора (льгота при <=160 л.с.) и акциза EV. Парсер не тянет — заполняется вручную';
comment on column cars.battery_kwh is
  'Ёмкость батареи, кВт·ч. Только для fuel_type = ev, нужна для расчёта акциза';

-- Курсы валют: CNY (курс ВТБ, скрапер) и EUR (курс ЦБ, официальный API)
create table if not exists exchange_rates (
  id bigint generated always as identity primary key,
  currency text not null check (currency in ('CNY', 'EUR')),
  rate numeric(10, 4) not null,
  source text not null, -- 'vtb_scraper' | 'cbr_api' | 'manual_override'
  fetched_at timestamptz not null default now()
);

create index if not exists idx_exchange_rates_currency_fetched
  on exchange_rates (currency, fetched_at desc);

-- RLS: читать курсы может любой (анонимный ключ фронтенда/бота),
-- писать — только сервисным ключом (скрапер/cron), как и с cars.
alter table exchange_rates enable row level security;

create policy "exchange_rates are publicly readable"
  on exchange_rates for select
  using (true);
