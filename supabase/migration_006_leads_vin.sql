-- Migration 006: сохраняем VIN автомобиля в заявке.
-- Выполнить в Supabase SQL Editor один раз.

alter table public.leads
  add column if not exists vin text;

comment on column public.leads.vin is 'VIN автомобиля, выбранного клиентом';
