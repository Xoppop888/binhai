export interface Car {
  id: string;
  brand: string;
  brandZh: string;
  model: string;
  year: number;
  trim: string;
  priceCny: number;
  image: string;
  sourceUrl: string;
  /** Категория объявления на сайте-источнике */
  category?: 'used' | 'new' | string;
  /** Вся галерея фото (image — просто images[0] для обратной совместимости) */
  images?: string[];
  /** Сырые характеристики 【ключ】значение с сайта-источника, как есть */
  specs?: Record<string, string>;
  /** Текст блока "Комплектация автомобиля" */
  description?: string;
  vin?: string;
  color?: string;
  driveType?: string;
  mileageKm?: number;
  engineVolume?: string;
  releaseDate?: string;
  keysCount?: string;
  bodyCondition?: string;
  insuranceUntil?: string;
}

/* ------------------------------------------------------------------
 * Статические данные (fallback)
 * ------------------------------------------------------------------ */
export const CARS: Car[] = [
  {
    id: 'volkswagen-tayron-2022',
    brand: 'Volkswagen',
    brandZh: '大众',
    model: 'Tayron',
    year: 2022,
    trim: '280TSI 两驱豪华版',
    priceCny: 115700,
    image: 'https://omo-oss-image.thefastimg.com/portal-saas/pg2026060513424661000/cms/image/2268b794-9cbb-47f5-a5b6-e0fc2c90e460.jpg_560xaf.jpg',
    sourceUrl: 'http://2606055040.p.make.dcloud.portal1.portal.thefastmake.com/ershouche/dazhongTayron2022kuan280TSIliangquhaohuaban.html',
  },
  {
    id: 'mazda-3-axela-2022',
    brand: 'Mazda',
    brandZh: '马自达',
    model: '3 Axela',
    year: 2022,
    trim: '2.0L 自动质睿版',
    priceCny: 99700,
    image: 'https://omo-oss-image.thefastimg.com/portal-saas/pg2026060513424661000/cms/image/d3007841-2665-4196-a284-6b0e1dc62981.jpg_560xaf.jpg',
    sourceUrl: 'http://2606055040.p.make.dcloud.portal1.portal.thefastmake.com/ershouche/mazida3Axela2022kuan2.0Lzidongzhiruiban.html',
  },
  {
    id: 'toyota-corolla-2021',
    brand: 'Toyota',
    brandZh: '丰田',
    model: 'Corolla',
    year: 2021,
    trim: 'TNGA 1.5L CVT 精英版',
    priceCny: 79700,
    image: 'https://omo-oss-image.thefastimg.com/portal-saas/pg2026060513424661000/cms/image/a7489565-d1de-457e-8268-159f5f6a4542.jpg_560xaf.jpg',
    sourceUrl: 'http://2606055040.p.make.dcloud.portal1.portal.thefastmake.com/ershouche/fengtianCorolla2021kuanTNGA1.5LCVTjingyingban.html',
  },
];

export const formatCny = (price: number): string => {
  return `¥${price.toLocaleString('zh-CN')}`;
};

export const SYNC_META = {
  time: '2026-03-17 12:00:00',
  interval: '1-6 часов',
  pipeline: 'BINHAI API → scripts/parse-to-supabase.js → Supabase → сайт',
  apiCalls: 7,
  loadedCount: 280,
};

/* ------------------------------------------------------------------
 * Загрузка данных из Supabase
 * ------------------------------------------------------------------ */
export async function loadCars(): Promise<{ cars: Car[]; syncedAt: string; fromApi: boolean; source: string }> {
  // Сначала обращаемся к Supabase. Это важно: старый localStorage-кэш
  // не должен скрывать новые записи после запуска парсера.
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      const res = await fetch(`${url}/rest/v1/cars?select=*&order=price_cny.asc`, {
        // select=* уже включает новые колонки (images, specs, description, ...)
        headers: { 
          apikey: key, 
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (res.ok) {
        const rows = await res.json() as any[];
        const cars = rows.map(mapSupabaseRowToCar);
        
        if (cars.length > 0) {
          // Кэшируем результат
          localStorage.setItem('binhai_cars_cache', JSON.stringify(cars));
          localStorage.setItem('binhai_cars_cache_time', Date.now().toString());
          
          return { 
            cars, 
            syncedAt: new Date().toISOString(), 
            fromApi: true,
            source: 'supabase'
          };
        }
      } else {
        console.warn('Supabase returned no cars; using cache or fallback.');
      }
    } catch (error) {
      console.warn('Supabase load failed, using fallback...', error);
    }
  }

  // Если Supabase не настроен или временно недоступен — проверяем кэш.
  const cached = localStorage.getItem('binhai_cars_cache');
  const cachedTime = localStorage.getItem('binhai_cars_cache_time');
  if (cached && cachedTime && Date.now() - parseInt(cachedTime) < 3600000) {
    try {
      const cars = JSON.parse(cached) as Car[];
      if (Array.isArray(cars) && cars.length > 0) {
        return { cars, syncedAt: new Date(parseInt(cachedTime)).toISOString(), fromApi: false, source: 'cache' };
      }
    } catch {
      localStorage.removeItem('binhai_cars_cache');
      localStorage.removeItem('binhai_cars_cache_time');
    }
  }

  // Fallback на статический снапшот
  return { 
    cars: CARS, 
    syncedAt: SYNC_META.time, 
    fromApi: false,
    source: 'fallback'
  };
}

function mapSupabaseRowToCar(row: any): Car {
  const images: string[] = Array.isArray(row.images) ? row.images : [];
  return {
    id: row.slug || row.id,
    brand: row.brand || '',
    brandZh: row.brand_zh || '',
    model: row.model || '',
    year: row.year || 0,
    trim: row.trim || '',
    priceCny: row.price_cny || 0,
    image: row.image_url || images[0] || '',
    sourceUrl: row.source_url || '',
    category: row.category || undefined,
    images: images.length > 0 ? images : row.image_url ? [row.image_url] : [],
    specs: row.specs && typeof row.specs === 'object' ? row.specs : {},
    description: row.description || undefined,
    vin: row.vin || undefined,
    color: row.color || undefined,
    driveType: row.drive_type || undefined,
    mileageKm: row.mileage_km ?? undefined,
    engineVolume: row.engine_volume || undefined,
    releaseDate: row.release_date || undefined,
    keysCount: row.keys_count || undefined,
    bodyCondition: row.body_condition || undefined,
    insuranceUntil: row.insurance_until || undefined,
  };
}
