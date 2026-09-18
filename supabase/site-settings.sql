-- BINHAI AUTO: контакты, редактируемые из /admin
create table if not exists site_settings (
  id text primary key,
  contacts jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table site_settings enable row level security;

create policy "site_settings_public_read"
  on site_settings for select to anon, authenticated using (true);

create policy "site_settings_admin_write"
  on site_settings for all to authenticated using (true) with check (true);

insert into site_settings (id, contacts) values ('main', '{"telegram":"https://t.me/binhai_bot","whatsapp":"+86 158 4019 9999","wechat":"13766611716","email":"576909777@qq.com","address":"Уссурийск · Приморский край"}'::jsonb)
on conflict (id) do nothing;
