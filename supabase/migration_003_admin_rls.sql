-- =====================================================
-- BINHAI AUTO - миграция: доступ к таблице cars для админ-панели
-- Выполнить один раз в SQL Editor вашего Supabase проекта.
--
-- Логика:
--   - anon (публичный ключ на сайте) — может только ЧИТАТЬ (SELECT)
--   - authenticated (вы, вошедшие в /admin через Supabase Auth) —
--     может читать, добавлять, редактировать и удалять
--
-- Админ-пользователя создайте в Supabase Dashboard:
--   Authentication → Users → Add user (email + пароль)
-- Самостоятельной регистрации в приложении нет — только вручную.
-- =====================================================

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cars_public_read" ON cars;
CREATE POLICY "cars_public_read"
  ON cars FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "cars_admin_insert" ON cars;
CREATE POLICY "cars_admin_insert"
  ON cars FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "cars_admin_update" ON cars;
CREATE POLICY "cars_admin_update"
  ON cars FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "cars_admin_delete" ON cars;
CREATE POLICY "cars_admin_delete"
  ON cars FOR DELETE
  TO authenticated
  USING (true);

-- Важно: парсер (scripts/parse-to-supabase.js) пишет через
-- SUPABASE_SERVICE_KEY (service_role), который игнорирует RLS,
-- поэтому автоматическая синхронизация продолжит работать как есть.
