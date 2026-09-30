-- BINHAI AUTO: срочное обновление публичных контактов.
-- Выполнить в Supabase Dashboard → SQL Editor → Run.

update public.site_settings
set contacts = jsonb_build_object(
  'telegram', 'https://t.me/binhaiauto_bot',
  'whatsapp', '+79140708006',
  'wechat', 'Arkady_lee',
  'email', 'binhaiexport@gmail.com',
  'address', 'Суйфэньхэ · Китай'
),
updated_at = now()
where id = 'main';

-- Проверка результата:
select id, contacts, updated_at
from public.site_settings
where id = 'main';
