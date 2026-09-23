/**
 * scripts/parse-to-supabase.js
 * ---------------------------------------------------------------
 * Полный парсер BINHAI AUTO (bhgjauto.com) → Supabase.
 *
 * В отличие от предыдущей версии, которая тянула урезанный набор
 * полей из недокументированного JSON API, этот парсер честно
 * обходит настоящий сайт-источник и достаёт ВСЁ, что там есть:
 *
 *   - листинги "Подержанный автомобиль" (/ershouche.html)
 *     и "Новый автомобиль" (/xinche.html), включая пагинацию,
 *     которая на сайте реализована через JS-клики (href="javascript:;"),
 *     поэтому для сбора списка используется настоящий браузер
 *     (Playwright), а не просто HTTP-запрос;
 *   - карточка каждого авто (/Products-Details/<id>.html) —
 *     она отдаётся сервером сразу в HTML (SSR), поэтому парсится
 *     быстрым HTTP-запросом (axios) + cheerio, без браузера:
 *       • вся галерея фото (по алгоритму: img[alt] === заголовку авто,
 *         с дедупликацией — на странице каждая фотография из галереи
 *         встречается дважды, в свайпере и в превью-полосе)
 *       • характеристики из блока 【ключ】значение — сохраняются
 *         "как есть" в JSON (specs), плюс распознанные по синонимам
 *         кладутся в отдельные колонки (vin, color, mileage_km, ...)
 *       • текст блока "Комплектация автомобиля" (description)
 *       • категория (используется/новый) — по хлебной крошке
 *
 * ТРЕБОВАНИЯ:
 *   node >= 18
 *   npm install   (в папке scripts/, см. scripts/package.json)
 *   npx playwright install chromium   (один раз, для сбора списка)
 *
 * ЗАПУСК:
 *   cd scripts
 *   cp .env.example .env   # и заполнить SUPABASE_URL / SUPABASE_SERVICE_KEY
 *   npm run parse
 *
 * Полезные флаги окружения:
 *   DRY_RUN=1         — не писать в Supabase, только вывести JSON в консоль
 *   LIMIT=10          — обработать только первые N карточек (для проверки)
 *   MAX_LIST_PAGES=30 — предохранитель от бесконечного клика по пагинации
 * ---------------------------------------------------------------
 */

import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { chromium } from 'playwright';
import { detectFuelType } from './detectFuelType.js';

const SITE = 'https://www.bhgjauto.com';
const LISTINGS = [
  { url: `${SITE}/ershouche.html`, category: 'used' },
  { url: `${SITE}/xinche.html`, category: 'new' },
];

const DRY_RUN = process.env.DRY_RUN === '1';
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity;
const MAX_LIST_PAGES = process.env.MAX_LIST_PAGES ? Number(process.env.MAX_LIST_PAGES) : 30;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------
 * 1. Сбор ссылок на карточки авто со всех страниц листинга (Playwright)
 * ------------------------------------------------------------------ */
async function collectDetailLinks() {
  const browser = await chromium.launch({ headless: true });
  const found = new Map(); // url -> category

  try {
    for (const { url, category } of LISTINGS) {
      console.log(`\n📄 Листинг: ${url} (${category})`);
      const page = await browser.newPage({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2500);

      // Диагностика: если ссылок 0, полезно понять, что вообще загрузилось
      const debugTitle = await page.title();
      const debugFinalUrl = page.url();
      const debugAnchorCount = await page.$$eval('a', (as) => as.length);
      const debugBodySnippet = (await page.evaluate(() => document.body?.innerText || '')).slice(0, 300);
      console.log(`  🔍 title: "${debugTitle}" | url: ${debugFinalUrl} | всего <a>: ${debugAnchorCount}`);
      console.log(`  🔍 текст страницы (первые 300 симв.): ${JSON.stringify(debugBodySnippet)}`);

      let pageNum = 1;
      let addedOnThisPage = -1;

      while (pageNum <= MAX_LIST_PAGES && addedOnThisPage !== 0) {
        const hrefs = await page.$$eval('a[href*="Products-Details"]', (as) =>
          as.map((a) => a.getAttribute('href')).filter(Boolean)
        );

        addedOnThisPage = 0;
        for (let href of hrefs) {
          const abs = href.startsWith('http') ? href : new URL(href, SITE).toString();
          if (!found.has(abs)) {
            found.set(abs, category);
            addedOnThisPage++;
          }
        }
        console.log(`  стр. ${pageNum}: +${addedOnThisPage} новых ссылок (всего ${found.size})`);

        // Ищем ссылку пагинации с номером следующей страницы.
        // На сайте это <a href="javascript:;">N</a> в блоке навигации внизу списка.
        const nextPageNum = pageNum + 1;
        const clicked = await page.evaluate((targetText) => {
          const anchors = Array.from(document.querySelectorAll('a[href="javascript:;"]'));
          const target = anchors.find((a) => a.textContent && a.textContent.trim() === targetText);
          if (target) {
            target.click();
            return true;
          }
          return false;
        }, String(nextPageNum));

        if (!clicked) break; // страниц больше нет

        await page.waitForTimeout(1200); // дать подгрузиться новому списку
        pageNum++;
      }

      await page.close();
    }
  } finally {
    await browser.close();
  }

  return found; // Map<url, category>
}

/* ------------------------------------------------------------------
 * 2. Парсинг одной карточки авто (обычный HTTP + cheerio)
 * ------------------------------------------------------------------ */

// Синонимы полей 【...】 на разных карточках (наблюдались небольшие
// расхождения в формулировках между объявлениями, напр.
// "Вин-код" vs "Номер кузова", "Объём двигателя" vs "Рабочий объём двигателя")
const SPEC_SYNONYMS = {
  vin: ['вин-код', 'вин код', 'номер кузова', 'vin'],
  color: ['цвет'],
  driveType: ['привод'],
  releaseDate: ['дата выпуска'],
  mileage: ['пробег'],
  engineVolume: ['рабочий объём двигателя', 'объём двигателя', 'объем двигателя'],
  condition: ['состояние автомобиля'],
  keysCount: ['ключи'],
  bodyCondition: ['состояние машины', 'состояние кузова'],
  insuranceUntil: ['страхование осаго', 'страховка осаго', 'осаго'],
  name: ['наименование автомобиля'],
};

function matchSynonym(key) {
  const norm = key.trim().toLowerCase();
  for (const [field, variants] of Object.entries(SPEC_SYNONYMS)) {
    if (variants.some((v) => norm.includes(v))) return field;
  }
  return null;
}

function parseSpecsBlock(text) {
  // Достаём все пары 【ключ】значение из сырого текста страницы.
  // Значение — всё до следующего 【 или конца строки.
  const specs = {};
  const re = /【([^】]+)】\s*([^【\n\r]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const key = m[1].trim();
    const value = m[2].trim();
    if (key && value) specs[key] = value;
  }
  return specs;
}

function parseMileageKm(str) {
  if (!str) return null;
  const digits = str.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

function parsePriceCny(str) {
  if (!str) return null;
  const digits = str.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
}

async function fetchDetail(url, categoryHint, retries = 2) {
  try {
    const { data: html } = await axios.get(url, {
      timeout: 20000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      },
    });
    const $ = cheerio.load(html);

    const title =
      $('h1').first().text().trim() ||
      $('meta[property="og:title"]').attr('content')?.trim() ||
      '';

    // --- Галерея: изображения, чей alt совпадает с заголовком авто.
    // На странице каждое фото из галереи встречается дважды
    // (главный свайпер + превью-полоса) — дедуплицируем по src.
    const seenImages = new Set();
    const images = [];
    $('img').each((_, el) => {
      const alt = ($(el).attr('alt') || '').trim();
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (!src) return;
      if (alt && title && alt === title && !seenImages.has(src)) {
        seenImages.add(src);
        images.push(src.startsWith('http') ? src : new URL(src, SITE).toString());
      }
    });
    // Фолбэк, если alt почему-то не совпал: og:image хотя бы одно фото
    if (images.length === 0) {
      const og = $('meta[property="og:image"]').attr('content');
      if (og) images.push(og);
    }

    // --- Цена
    const bodyText = $('body').text();
    const priceMatch = bodyText.match(/¥\s*([\d,]+)/);
    const priceCny = priceMatch ? parsePriceCny(priceMatch[1]) : null;

    // --- Характеристики 【...】
    const rawSpecs = parseSpecsBlock(bodyText);
    const norm = {};
    for (const [key, value] of Object.entries(rawSpecs)) {
      const field = matchSynonym(key);
      if (field) norm[field] = value;
    }

    // --- Описание/комплектация: текст между "Описание продукта" и "Видео"
    let description = '';
    const descIdx = bodyText.indexOf('Описание продукта');
    const videoIdx = bodyText.indexOf('Видео о приборе');
    if (descIdx !== -1) {
      const end = videoIdx !== -1 && videoIdx > descIdx ? videoIdx : descIdx + 2000;
      description = bodyText
        .slice(descIdx + 'Описание продукта'.length, end)
        .replace(/\s+/g, ' ')
        .trim();
    }

    // --- Категория: по ссылке в хлебной крошке "Принадлежность к категории"
    let category = categoryHint;
    const catLink = $('a[href*="ershouche.html"], a[href*="xinche.html"]')
      .filter((_, el) => /автомобиль/i.test($(el).text()))
      .first();
    if (catLink.length) {
      const href = catLink.attr('href') || '';
      if (href.includes('ershouche.html')) category = 'used';
      else if (href.includes('xinche.html')) category = 'new';
    }

    const idMatch = url.match(/Products-Details\/(\d+)\.html/);
    const sourceId = idMatch ? idMatch[1] : null;

    return {
      sourceId,
      sourceUrl: url,
      category,
      title,
      priceCny,
      images,
      specs: rawSpecs,
      description,
      vin: norm.vin || null,
      color: norm.color || null,
      driveType: norm.driveType || null,
      releaseDate: norm.releaseDate || null,
      mileageKm: parseMileageKm(norm.mileage),
      engineVolume: norm.engineVolume || null,
      keysCount: norm.keysCount || null,
      bodyCondition: norm.bodyCondition || null,
      insuranceUntil: norm.insuranceUntil || null,
    };
  } catch (err) {
    if (retries > 0) {
      await sleep(800);
      return fetchDetail(url, categoryHint, retries - 1);
    }
    console.warn(`  ⚠️  не удалось загрузить ${url}: ${err.message}`);
    return null;
  }
}

/* ------------------------------------------------------------------
 * 3. Разбор заголовка на бренд/модель/год/комплектацию (эвристика,
 *    т.к. сайт отдаёт только человекочитаемое название целиком)
 * ------------------------------------------------------------------ */
function splitTitle(title) {
  // Примеры заголовков:
  //  "Changan CS35 PLUS 2021 года, рестайлинг, ..., комплектация «Люкс»"
  //  "Audi Q3 2022 года, комплектация 35 TFSI, ..."
  const yearMatch = title.match(/(19|20)\d{2}(?=\s*год)/);
  const year = yearMatch ? Number(yearMatch[0]) : null;

  let brand = '';
  let model = '';
  const beforeYear = yearMatch ? title.slice(0, title.indexOf(yearMatch[0])).trim() : title;
  const words = beforeYear.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    brand = words[0];
    model = words.slice(1).join(' ');
  }

  const trim = yearMatch
    ? title
        .slice(title.indexOf(yearMatch[0]) + yearMatch[0].length)
        .replace(/^\s*года?,?\s*/i, '')
        .trim()
    : '';

  return { brand, model, year, trim };
}

const RU_LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y',
  ь: '', э: 'e', ю: 'yu', я: 'ya',
};

function transliterate(str) {
  return str.split('').map((ch) => {
    const lower = ch.toLowerCase();
    return RU_LATIN[lower] !== undefined ? RU_LATIN[lower] : ch;
  }).join('');
}

function slugify(str) {
  return transliterate(str)
    .toLowerCase()
    .replace(/[«»"']/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/* ------------------------------------------------------------------
 * main
 * ------------------------------------------------------------------ */
async function main() {
  console.log('🚗 BINHAI AUTO — полный парсер bhgjauto.com\n');

  if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_SERVICE_KEY)) {
    console.error('❌ Не заданы SUPABASE_URL / SUPABASE_SERVICE_KEY (см. scripts/.env.example).');
    console.error('   Либо запустите с DRY_RUN=1 для проверки без записи в базу.');
    process.exit(1);
  }

  const supabase = DRY_RUN ? null : createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const links = await collectDetailLinks();
  console.log(`\n🔗 Всего найдено карточек: ${links.size}`);

  // Дедуп по source_id (номер карточки на сайте-источнике) — на случай,
  // если одна и та же карточка встретилась под чуть разными URL
  // (с www/без, с доп. параметром и т.п.) и не задедуплицировалась
  // на этапе сбора ссылок по строке URL.
  const dedupedLinks = new Map(); // sourceId -> { url, category }
  for (const [url, category] of links) {
    const idMatch = url.match(/Products-Details\/(\d+)\.html/);
    const key = idMatch ? idMatch[1] : url;
    if (!dedupedLinks.has(key)) {
      dedupedLinks.set(key, { url, category });
    }
  }
  if (dedupedLinks.size !== links.size) {
    console.log(`  ⚠️  Убрано дублей по source_id: ${links.size - dedupedLinks.size}`);
  }

  const entries = [...dedupedLinks.values()].map(({ url, category }) => [url, category]).slice(0, LIMIT);
  const results = [];
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < entries.length; i++) {
    const [url, categoryHint] = entries[i];
    process.stdout.write(`  [${i + 1}/${entries.length}] ${url} ... `);
    const detail = await fetchDetail(url, categoryHint);
    if (!detail || !detail.title) {
      console.log('пропущено');
      fail++;
      await sleep(300);
      continue;
    }

    const { brand, model, year, trim } = splitTitle(detail.title);
    const slug = `${slugify(brand)}-${slugify(model)}-${detail.sourceId || i}`.slice(0, 64).replace(/-+$/, '');

    // Тип силовой установки парсер сам не знает — эвристика по названию/
    // описанию, финальную проверку делает человек в /admin.
    const { fuelType } = detectFuelType({
      title: detail.title,
      description: detail.description,
      engine_volume: detail.engineVolume,
    });

    const row = {
      slug,
      source_id: detail.sourceId,
      source_url: detail.sourceUrl,
      category: detail.category,
      brand,
      brand_zh: '',
      model,
      year: year || 0,
      trim,
      price_cny: detail.priceCny || 0,
      image_url: detail.images[0] || '',
      images: detail.images,
      specs: detail.specs,
      description: detail.description,
      vin: detail.vin,
      color: detail.color,
      drive_type: detail.driveType,
      mileage_km: detail.mileageKm,
      engine_volume: detail.engineVolume,
      release_date: detail.releaseDate,
      keys_count: detail.keysCount,
      body_condition: detail.bodyCondition,
      insurance_until: detail.insuranceUntil,
      fuel_type: fuelType,
    };

    results.push(row);
    console.log(`OK — ${row.images.length} фото`);
    ok++;
    await sleep(400); // вежливая задержка между запросами к чужому сайту
  }

  console.log(`\n📊 Обработано: ${ok} успешно, ${fail} с ошибкой`);

  if (DRY_RUN) {
    console.log('\n🧪 DRY_RUN=1 — вывожу первые 2 записи вместо записи в Supabase:\n');
    console.log(JSON.stringify(results.slice(0, 2), null, 2));
    return;
  }

  console.log('\n💾 Записываю в Supabase (upsert по slug)...');
  const chunkSize = 50;
  for (let i = 0; i < results.length; i += chunkSize) {
    const chunk = results.slice(i, i + chunkSize);
    const { error } = await supabase.from('cars').upsert(chunk, { onConflict: 'source_id' });
    if (error) {
      console.error(`  ❌ Ошибка записи пачки ${i / chunkSize + 1}:`, error.message);
    } else {
      console.log(`  ✅ Пачка ${i / chunkSize + 1}: ${chunk.length} записей`);
    }
  }

  console.log('\n✅ Запись завершена.');

  // ------------------------------------------------------------------
  // Очистка: убираем из Supabase машины, которых больше нет на сайте-
  // источнике (проданы/сняты с продажи). Без этого база только растёт,
  // а сайт продолжает показывать давно проданные машины.
  //
  // ВАЖНО: пропускаем этот шаг при LIMIT (пробный/частичный прогон) —
  // иначе мы бы удалили все машины, которые просто не попали в
  // урезанную выборку этого запуска, хотя на сайте они всё ещё есть.
  // ------------------------------------------------------------------
  if (LIMIT !== Infinity) {
    console.log('\n⚠️  LIMIT задан — пропускаю очистку пропавших машин (частичный прогон).');
  } else {
    console.log('\n🧹 Проверяю, какие машины пропали с сайта-источника...');

    const currentSourceIds = new Set(results.map((r) => r.source_id).filter(Boolean));

    const { data: existing, error: fetchError } = await supabase.from('cars').select('id, source_id, brand, model');

    if (fetchError) {
      console.error('  ❌ Не удалось получить список машин для очистки:', fetchError.message);
    } else {
      const toDelete = (existing || []).filter((row) => row.source_id && !currentSourceIds.has(row.source_id));

      if (toDelete.length === 0) {
        console.log('  Пропавших машин не найдено.');
      } else {
        console.log(`  Найдено пропавших: ${toDelete.length}. Удаляю...`);
        for (const row of toDelete) {
          const { error: deleteError } = await supabase.from('cars').delete().eq('id', row.id);
          if (deleteError) {
            console.error(`    ❌ ${row.brand} ${row.model} (id ${row.id}): ${deleteError.message}`);
          } else {
            console.log(`    🗑️  Удалено: ${row.brand} ${row.model}`);
          }
        }
      }
    }
  }

  console.log('\n✅ Готово.');
}

main().catch((err) => {
  console.error('💥 Необработанная ошибка:', err);
  process.exit(1);
});
