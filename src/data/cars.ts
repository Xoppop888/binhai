export interface Car {
  id: string;
  brand: string;
  brandZh: string;
  model: string;
  year: number;
  trim: string;
  priceCny: number;
  image: string;
  sourceUrl?: string;
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
  },
];

export const formatCny = (price: number): string => {
  return `¥${price.toLocaleString('zh-CN')}`;
};

/** Приводит сырой текст парсера к короткому описанию комплектации. */
export function cleanCarDescription(description?: string): string {
  if (!description) return '';
  let text = description.replace(/\s+/g, ' ').trim();
  const cutMarkers = [
    'Видео интерьера',
    'Видео прибора',
    'Видео шасси',
    'Видео внешнего вида',
    'Видео о двигателе',
    'Комплектация товара:',
    'Ватсап:',
    'WhatsApp:',
    'Электронная почта:',
    'Email:',
    'Немедленно проконсультируйтесь',
    'Свяжитесь с нами',
    'Другое содержание',
  ];
  for (const marker of cutMarkers) {
    const index = text.indexOf(marker);
    if (index >= 0) text = text.slice(0, index).trim();
  }
  text = text.replace(/^Комплектация автомобиля\s*:?\s*/i, '').trim();
  text = text.replace(/(?:тел\.?|телефон|whatsapp|ватсап|email|электронная почта)\s*[:：]?\s*[^,;]+/gi, '').trim();
  return text.replace(/[.;]+$/, '').trim();
}

export function descriptionFeatures(description?: string): string[] {
  const clean = cleanCarDescription(description);
  if (!clean) return [];
  return clean.split(/[,;、，]+/).map((item) => item.trim()).filter(Boolean);
}

const ENGLISH_BRANDS: Record<string, string> = {
  '大众': 'Volkswagen', volkswagen: 'Volkswagen',
  '马自达': 'Mazda', mazda: 'Mazda', мазда: 'Mazda',
  '丰田': 'Toyota', toyota: 'Toyota', тойота: 'Toyota',
  '本田': 'Honda', honda: 'Honda', хонда: 'Honda',
  '日产': 'Nissan', nissan: 'Nissan', ниссан: 'Nissan',
  '哈弗': 'Haval', haval: 'Haval', хавал: 'Haval',
  '长城': 'GWM', greatwall: 'GWM', 'great wall': 'GWM',
  '比亚迪': 'BYD', byd: 'BYD',
  '奇瑞': 'Chery', chery: 'Chery', чери: 'Chery',
  '吉利': 'Geely', geely: 'Geely', джили: 'Geely',
  '长安': 'Changan', changan: 'Changan', чанган: 'Changan',
  '五菱': 'Wuling', wuling: 'Wuling',
  '宝骏': 'Baojun', baojun: 'Baojun',
  '广汽传祺': 'GAC Trumpchi', trumpchi: 'GAC Trumpchi',
  '领克': 'Lynk & Co', lynk: 'Lynk & Co',
  '蔚来': 'NIO', nio: 'NIO',
  '小鹏': 'XPeng', xpeng: 'XPeng',
  '理想': 'Li Auto', 'li auto': 'Li Auto',
  '极氪': 'Zeekr', zeekr: 'Zeekr',
  '哪吒': 'Neta', neta: 'Neta',
  '红旗': 'Hongqi', hongqi: 'Hongqi',
  '宝马': 'BMW', bmw: 'BMW',
  '奔驰': 'Mercedes-Benz', mercedes: 'Mercedes-Benz',
  'мерседес': 'Mercedes-Benz',
  '奥迪': 'Audi', audi: 'Audi',
  '福特': 'Ford', ford: 'Ford',
  'форд': 'Ford',
  '特斯拉': 'Tesla', tesla: 'Tesla',
  '现代': 'Hyundai', hyundai: 'Hyundai', хендай: 'Hyundai',
  '起亚': 'Kia', kia: 'Kia', киа: 'Kia',
  '雪佛兰': 'Chevrolet', chevrolet: 'Chevrolet',
  'шевроле': 'Chevrolet',
  'пежо': 'Peugeot', peugeot: 'Peugeot', '标致': 'Peugeot',
  'шкода': 'Skoda', skoda: 'Skoda', '斯柯达': 'Skoda',
  '沃尔沃': 'Volvo', volvo: 'Volvo',
  '路虎': 'Land Rover', 'land rover': 'Land Rover',
  '捷豹': 'Jaguar', jaguar: 'Jaguar',
  '雷克萨斯': 'Lexus', lexus: 'Lexus',
  '凯迪拉克': 'Cadillac', cadillac: 'Cadillac',
  '保时捷': 'Porsche', porsche: 'Porsche',
  '三菱': 'Mitsubishi', mitsubishi: 'Mitsubishi',
  '斯巴鲁': 'Subaru', subaru: 'Subaru',
  '五十铃': 'Isuzu', isuzu: 'Isuzu',
  'исузу': 'Isuzu',
};

export function englishBrand(brand: string, brandZh?: string): string {
  for (const candidate of [brandZh, brand].filter(Boolean) as string[]) {
    const normalized = candidate.trim().toLowerCase();
    if (ENGLISH_BRANDS[normalized]) return ENGLISH_BRANDS[normalized];
  }
  return transliterateCyrillic(brand
    .replace(/хавал|хавей/gi, 'Haval')
    .replace(/шевроле/gi, 'Chevrolet')
    .replace(/пежо/gi, 'Peugeot')
    .replace(/шкода/gi, 'Skoda')
    .replace(/тойота/gi, 'Toyota')
    .replace(/хонда/gi, 'Honda')
    .replace(/мазда/gi, 'Mazda')
    .replace(/ниссан/gi, 'Nissan')
    .replace(/хендай/gi, 'Hyundai')
    .replace(/киа/gi, 'Kia')
    .trim());
}

const MODEL_REPLACEMENTS: Array<[RegExp, string]> = [
  [/шевроле/gi, 'Chevrolet'],
  [/монза/gi, 'Monza'],
  [/тойота/gi, 'Toyota'],
  [/королла/gi, 'Corolla'],
  [/хавал/gi, 'Haval'],
  [/хавей/gi, 'Haval'],
  [/пежо/gi, 'Peugeot'],
  [/шкода/gi, 'Skoda'],
  [/рапид/gi, 'Rapid'],
  [/аксела/gi, 'Axela'],
  [/сильфи/gi, 'Sylphy'],
  [/силфи/gi, 'Sylphy'],
  [/кх1/gi, 'KX1'],
  [/эмгранд/gi, 'Emgrand'],
  [/джетта/gi, 'Jetta'],
  [/тиго/gi, 'Tiggo'],
  [/левин/gi, 'Levin'],
  [/синъяо/gi, 'Xinyao'],
  [/двойной\s+гибрид/gi, 'Dual Hybrid'],
  [/гибрид/gi, 'Hybrid'],
  [/кроссовер/gi, 'Crossover'],
  [/\s*,?\s*модель\s*/gi, ' '],
];

const RU_LATIN: Record<string, string> = {
  а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'yo', ж:'zh', з:'z', и:'i', й:'y', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r', с:'s', т:'t', у:'u', ф:'f', х:'kh', ц:'ts', ч:'ch', ш:'sh', щ:'shch', ъ:'', ы:'y', ь:'', э:'e', ю:'yu', я:'ya',
};

function transliterateCyrillic(value: string): string {
  return value.split('').map((char) => RU_LATIN[char.toLowerCase()] ? RU_LATIN[char.toLowerCase()] : char).join('');
}

export function englishModel(model: string): string {
  const replaced = MODEL_REPLACEMENTS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), model).replace(/\s+/g, ' ').trim();
  return transliterateCyrillic(replaced);
}

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
    brand: englishBrand(row.brand || '', row.brand_zh || ''),
    brandZh: row.brand_zh || '',
    model: englishModel(row.model || ''),
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
