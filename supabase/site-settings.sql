-- BINHAI AUTO: контакты, редактируемые из /admin
-- Скрипт можно запускать повторно.

create table if not exists public.site_settings (
  id text primary key,
  contacts jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Удаляем старые версии политик перед созданием актуальных.
drop policy if exists "site_settings_public_read" on public.site_settings;
drop policy if exists "site_settings_admin_write" on public.site_settings;

create policy "site_settings_public_read"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

create policy "site_settings_admin_write"
  on public.site_settings
  for all
  to authenticated
  using (true)
  with check (true);

insert into public.site_settings (id, contacts)
values (
  'main',
  '{"telegram":"https://t.me/binhaiauto_bot","whatsapp":"+79140708006","wechat":"Arkady_lee","email":"binhaiexport@gmail.com","address":"Уссурийск · Приморский край"}'::jsonb
)
on conflict (id) do nothing;
