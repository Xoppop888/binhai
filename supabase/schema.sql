-- =====================================================
-- BINHAI AUTO - Создание таблицы cars в Supabase
-- =====================================================

-- Создание таблицы
CREATE TABLE cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  source_id TEXT UNIQUE,               -- числовой ID из URL bhgjauto.com (Products-Details/<id>.html)
  source_url TEXT,
  category TEXT,                       -- 'used' (Подержанный автомобиль) | 'new' (Новый автомобиль)
  brand TEXT NOT NULL,
  brand_zh TEXT,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  trim TEXT,
  price_cny INTEGER NOT NULL,
  image_url TEXT,                      -- главное фото (для обратной совместимости/OG)
  images JSONB DEFAULT '[]'::jsonb,    -- вся галерея: ["https://...jpg", ...]
  specs JSONB DEFAULT '{}'::jsonb,     -- сырые характеристики 【ключ】значение как есть с сайта
  description TEXT,                    -- текст блока "Комплектация автомобиля"
  vin TEXT,
  color TEXT,
  drive_type TEXT,
  mileage_km INTEGER,
  engine_volume TEXT,
  release_date TEXT,
  keys_count TEXT,
  body_condition TEXT,
  insurance_until TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_cars_brand ON cars(brand);
CREATE INDEX idx_cars_brand_zh ON cars(brand_zh);
CREATE INDEX idx_cars_year ON cars(year);
CREATE INDEX idx_cars_price ON cars(price_cny);
CREATE INDEX idx_cars_slug ON cars(slug);
CREATE INDEX idx_cars_source_id ON cars(source_id);
CREATE INDEX idx_cars_category ON cars(category);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_cars_updated_at
BEFORE UPDATE ON cars
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security: публичное чтение, запись — только
-- авторизованным (админ-панель /admin). Парсер пишет через
-- service_role key и RLS не подпадает под ограничение.
--
-- Примечание: тестовые/примерные записи сюда специально не добавлены —
-- реальные данные загружает scripts/parse-to-supabase.js. Если хотите
-- сразу увидеть что-то на сайте до первого запуска парсера, добавьте
-- строку вручную через Table Editor или SQL Editor.
-- =====================================================

ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cars_public_read"
  ON cars FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "cars_admin_insert"
  ON cars FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "cars_admin_update"
  ON cars FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "cars_admin_delete"
  ON cars FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- Проверка
-- =====================================================

-- Посмотреть количество записей
SELECT COUNT(*) as total_cars FROM cars;

-- Посмотреть все автомобили
SELECT * FROM cars ORDER BY price_cny ASC;

-- Посмотреть статистику по брендам
SELECT brand, COUNT(*) as count FROM cars GROUP BY brand ORDER BY count DESC;
