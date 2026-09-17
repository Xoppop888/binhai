-- =====================================================
-- BINHAI AUTO - миграция: галерея фото, характеристики
-- Выполнить один раз в SQL Editor вашего Supabase проекта,
-- если таблица cars уже создана по старой версии schema.sql
-- =====================================================

ALTER TABLE cars ADD COLUMN IF NOT EXISTS source_id TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS vin TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS drive_type TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS mileage_km INTEGER;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS engine_volume TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS release_date TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS keys_count TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS body_condition TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS insurance_until TEXT;

-- source_id должен быть уникальным, но допускаем NULL для старых строк
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cars_source_id_key'
  ) THEN
    ALTER TABLE cars ADD CONSTRAINT cars_source_id_key UNIQUE (source_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cars_source_id ON cars(source_id);
CREATE INDEX IF NOT EXISTS idx_cars_category ON cars(category);
