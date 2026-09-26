-- Migration 007: сохраняем полные данные калькулятора в истории заявок.
-- Выполнить в Supabase SQL Editor один раз.

alter table public.leads
  add column if not exists calculation_details jsonb;

comment on column public.leads.calculation_details is
  'Полная структура расчёта: курсы, входные данные, разбивка платежей, итог и пояснение';

create index if not exists idx_leads_calculation_details_gin
  on public.leads using gin (calculation_details);
