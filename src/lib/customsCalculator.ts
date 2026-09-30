// src/lib/customsCalculator.ts
//
// Расчёт цены "под ключ" для карточки авто: цена в Китае (CNY) -> курс ВТБ
// -> комиссия банка -> растаможка (ветка по fuel_type) -> услуги брокера.
//
// Таможенная пошлина (3-5 лет / старше 5 лет) и утильсбор (льготный и
// коммерческий, вся сетка по мощности/объёму) сверены с официальным текстом
// Решения Совета ЕЭК от 20.12.2017 №107 и с рабочим примером расчёта —
// совпадают. Осталась одна открытая ветка: авто МЛАДШЕ 3 лет (пошлина по
// проценту от таможенной стоимости) и электромобили — не реализованы ниже.

export type FuelType = 'ice' | 'hybrid' | 'series_hybrid' | 'ev' | 'unknown';

export interface CarForCalculation {
  priceCny: number;
  ageYears?: number;
  modelYear?: number | null;
  releaseDate?: string | null;
  fuelType: FuelType;
  engineVolumeCm3: number | null;
  powerHp: number | null;
  batteryKwh: number | null;
}

export interface Rates {
  cnyToRub: number;
  eurToRub: number;
}

export interface CalculationResult {
  ok: true;
  breakdown: {
    carPriceRub: number;
    bankCommissionRub: number;
    customsDutyRub: number;
    utilizationFeeRub: number;
    declarationFeeRub: number;
    sbktsRub: number;
    eptsRub: number;
    brokerFeeRub: number;
  };
  totalRub: number;
  disclaimer: string;
}

export interface CalculationNeedsData {
  ok: false;
  reason: string;
}

const BANK_COMMISSION_RATE = 0.025;
const BROKER_FEE_RUB = 60_000;
const SBKTS_RUB = 20_000;
const EPTS_RUB = 1_200;

const DISCLAIMER =
  'Расчёт предварительный и носит ориентировочный характер. Итоговая сумма ' +
  'таможенных платежей зависит от решения таможенного органа, актуального ' +
  'курса валют на дату оформления и может отличаться от указанной здесь. ' +
  'Точную стоимость под ключ уточняйте у брокера.';

function getDeclarationFee(customsValueRub: number): number {
  if (customsValueRub <= 200_000) return 1_067;
  if (customsValueRub <= 450_000) return 2_134;
  if (customsValueRub <= 1_200_000) return 4_269;
  if (customsValueRub <= 2_700_000) return 11_746;
  if (customsValueRub <= 4_200_000) return 16_524;
  if (customsValueRub <= 5_500_000) return 21_344;
  if (customsValueRub <= 7_000_000) return 27_540;
  return 30_000;
}

/**
 * ЕТС для авто с ДВС/гибрид старше 3 лет. Две разные ступени — 3-5 лет и
 * старше 5 лет — проверены на реальном примере расчёта (объём 1800-2300 см³,
 * там. стоимость 1 400 000 ₽): 3-5 лет даёт 2,7 €/см³, старше 5 лет —
 * 4,8 €/см³, обе суммы совпали с примером один в один.
 */
function getEurPerCm3(engineVolumeCm3: number, isAtMostFiveYears: boolean): number {
  if (isAtMostFiveYears) {
    if (engineVolumeCm3 <= 1000) return 1.5;
    if (engineVolumeCm3 <= 1500) return 1.7;
    if (engineVolumeCm3 <= 1800) return 2.5;
    if (engineVolumeCm3 <= 2300) return 2.7;
    if (engineVolumeCm3 <= 3000) return 3.0;
    return 3.6;
  }
  if (engineVolumeCm3 <= 1000) return 3.0;
  if (engineVolumeCm3 <= 1500) return 3.2;
  if (engineVolumeCm3 <= 1800) return 3.5;
  if (engineVolumeCm3 <= 2300) return 4.8;
  if (engineVolumeCm3 <= 3000) return 5.0;
  return 5.7;
}

function parseReleaseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const value = raw.trim();
  const match = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!match) {
    const dmy = value.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/);
    if (dmy) {
      const date = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
      return Number.isNaN(date.getTime()) ? null : date;
    }
    const russianMonth = value.match(/^(январ[ьяе]|феврал[ьяе]|март[ае]?|апрел[ьяе]|ма[йя]|июн[ьяе]|июл[ьяе]|август[ае]|сентябр[ьяе]|октябр[ьяе]|ноябр[ьяе]|декабр[ьяе])\s+(\d{4})/i);
    if (russianMonth) {
      const months = ['январ', 'феврал', 'март', 'апрел', 'май', 'июн', 'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр'];
      const monthIndex = months.findIndex((month) => russianMonth[1].toLowerCase().startsWith(month));
      if (monthIndex !== -1) return new Date(Number(russianMonth[2]), monthIndex, 1);
    }
    const yearMonth = value.match(/^(\d{4})[-/.](\d{1,2})(?:\D|$)/);
    if (yearMonth) return new Date(Number(yearMonth[1]), Number(yearMonth[2]) - 1, 1);
    return null;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function resolveAgeYears(car: CarForCalculation, now = new Date()): number {
  const release = parseReleaseDate(car.releaseDate);
  if (release) {
    let years = now.getFullYear() - release.getFullYear();
    const beforeAnniversary = now.getMonth() < release.getMonth() ||
      (now.getMonth() === release.getMonth() && now.getDate() < release.getDate());
    if (beforeAnniversary) years -= 1;
    return Math.max(0, years);
  }
  return Math.max(0, now.getFullYear() - (car.modelYear || 0));
}

function isAtMostYearsOld(car: CarForCalculation, years: number, now: Date, ageYears: number): boolean {
  const release = parseReleaseDate(car.releaseDate);
  if (!release) return ageYears <= years;
  const anniversary = new Date(release);
  anniversary.setFullYear(release.getFullYear() + years);
  return now.getTime() <= anniversary.getTime();
}

function calculateIceOrHybridDuty(
  car: CarForCalculation,
  eurToRub: number,
  ageYears: number,
  now: Date,
): CalculationNeedsData | { dutyRub: number } {
  if (!car.engineVolumeCm3) {
    return { ok: false, reason: 'Не заполнен объём двигателя — растаможку по ДВС/гибриду посчитать нельзя' };
  }

  // «Не более 3 лет» и «не более 5 лет» включают сам день годовщины.
  if (isAtMostYearsOld(car, 3, now, ageYears)) {
    return {
      ok: false,
      reason: 'Авто не старше 3 лет — расчёт пошлины по проценту от стоимости пока не реализован, требуется ручная проверка брокером',
    };
  }

  const eurPerCm3 = getEurPerCm3(
    car.engineVolumeCm3,
    isAtMostYearsOld(car, 5, now, ageYears),
  );
  return { dutyRub: eurPerCm3 * car.engineVolumeCm3 * eurToRub };
}

// Утильсбор — полная таблица (Решение Совета ЕЭК №107, период 01.01.2026-31.12.2026).
// Льготная ставка (3400/5200 ₽) уже встроена как первая ступень для объёма
// ≤3000 см³; для объёма >3000 см³ льготы нет ни при какой мощности.
const COMMERCIAL_UTIL_FEE: Array<{ volumeMax: number; brackets: Array<{ powerMaxHp: number; under3: number; over3: number }> }> = [
  {
    volumeMax: 1000,
    brackets: [
      { powerMaxHp: 160, under3: 3400, over3: 5200 },
      { powerMaxHp: 190, under3: 307200, over3: 568600 },
      { powerMaxHp: 220, under3: 316800, over3: 585600 },
      { powerMaxHp: 250, under3: 324000, over3: 602400 },
      { powerMaxHp: Infinity, under3: 345600, over3: 602400 },
    ],
  },
  {
    volumeMax: 2000,
    brackets: [
      { powerMaxHp: 160, under3: 3400, over3: 5200 },
      { powerMaxHp: 190, under3: 900000, over3: 1492800 },
      { powerMaxHp: 220, under3: 952800, over3: 1584000 },
      { powerMaxHp: 250, under3: 1010400, over3: 1677600 },
      { powerMaxHp: 280, under3: 1142400, over3: 1838400 },
      { powerMaxHp: 310, under3: 1291200, over3: 2011200 },
      { powerMaxHp: 340, under3: 1459200, over3: 2203200 },
      { powerMaxHp: 370, under3: 1663200, over3: 2412000 },
      { powerMaxHp: 400, under3: 1896000, over3: 2640000 },
      { powerMaxHp: 430, under3: 2160000, over3: 2892000 },
      { powerMaxHp: 460, under3: 2464800, over3: 3168000 },
      { powerMaxHp: 500, under3: 2808000, over3: 3468000 },
      { powerMaxHp: Infinity, under3: 3201600, over3: 3796800 },
    ],
  },
  {
    volumeMax: 3000,
    brackets: [
      { powerMaxHp: 160, under3: 3400, over3: 5200 },
      { powerMaxHp: 190, under3: 2306800, over3: 3456000 },
      { powerMaxHp: 220, under3: 2364000, over3: 3501600 },
      { powerMaxHp: 250, under3: 2402400, over3: 3552000 },
      { powerMaxHp: 280, under3: 2520000, over3: 3660000 },
      { powerMaxHp: 310, under3: 2620800, over3: 3770400 },
      { powerMaxHp: 340, under3: 2726400, over3: 3873600 },
      { powerMaxHp: 370, under3: 2834400, over3: 3981600 },
      { powerMaxHp: 400, under3: 2949600, over3: 4094400 },
      { powerMaxHp: 430, under3: 3067200, over3: 4209600 },
      { powerMaxHp: 460, under3: 3189600, over3: 4327200 },
      { powerMaxHp: 500, under3: 3316800, over3: 4447200 },
      { powerMaxHp: Infinity, under3: 3448800, over3: 4572000 },
    ],
  },
  {
    volumeMax: 3500,
    brackets: [
      { powerMaxHp: 160, under3: 2584000, over3: 3956200 },
      { powerMaxHp: 190, under3: 2635200, over3: 4000800 },
      { powerMaxHp: 220, under3: 2688000, over3: 4044000 },
      { powerMaxHp: 250, under3: 2743200, over3: 4087200 },
      { powerMaxHp: 280, under3: 2810400, over3: 4144800 },
      { powerMaxHp: 310, under3: 2880000, over3: 4248000 },
      { powerMaxHp: 340, under3: 3038400, over3: 4356000 },
      { powerMaxHp: 370, under3: 3206400, over3: 4485600 },
      { powerMaxHp: 400, under3: 3384000, over3: 4620000 },
      { powerMaxHp: 430, under3: 3568800, over3: 4759200 },
      { powerMaxHp: 460, under3: 3765600, over3: 4900800 },
      { powerMaxHp: 500, under3: 3972000, over3: 5049600 },
      { powerMaxHp: Infinity, under3: 4190400, over3: 5200800 },
    ],
  },
  {
    volumeMax: Infinity,
    brackets: [
      { powerMaxHp: 160, under3: 3290600, over3: 4325800 },
      { powerMaxHp: 190, under3: 3345600, over3: 4389600 },
      { powerMaxHp: 220, under3: 3403200, over3: 4456800 },
      { powerMaxHp: 250, under3: 3460800, over3: 4524000 },
      { powerMaxHp: 280, under3: 3530400, over3: 4627200 },
      { powerMaxHp: 310, under3: 3600000, over3: 4732800 },
      { powerMaxHp: 340, under3: 3727200, over3: 4992000 },
      { powerMaxHp: 370, under3: 3857600, over3: 5268000 },
      { powerMaxHp: 400, under3: 3993600, over3: 5558400 },
      { powerMaxHp: 430, under3: 4132800, over3: 5863200 },
      { powerMaxHp: 460, under3: 4276800, over3: 6187200 },
      { powerMaxHp: 500, under3: 4425600, over3: 6528000 },
      { powerMaxHp: Infinity, under3: 4581600, over3: 6885600 },
    ],
  },
];

function calculateUtilizationFee(car: CarForCalculation, ageYears: number): CalculationNeedsData | { feeRub: number } {
  if (car.powerHp == null) {
    return { ok: false, reason: 'Не заполнена мощность (л.с.) — без неё нельзя посчитать утильсбор' };
  }
  if (car.engineVolumeCm3 == null) {
    return { ok: false, reason: 'Не заполнен объём двигателя — без него нельзя посчитать утильсбор' };
  }

  const volumeBracket = COMMERCIAL_UTIL_FEE.find((v) => car.engineVolumeCm3! <= v.volumeMax);
  const powerBracket = volumeBracket?.brackets.find((p) => car.powerHp! <= p.powerMaxHp);

  if (!powerBracket) {
    return { ok: false, reason: 'Не удалось определить утильсбор для этих параметров — нужна ручная проверка' };
  }

  return { feeRub: ageYears < 3 ? powerBracket.under3 : powerBracket.over3 };
}

function calculateEvDuty(car: CarForCalculation): CalculationNeedsData {
  if (car.batteryKwh == null) {
    return { ok: false, reason: 'Не заполнена ёмкость батареи (кВт·ч) — без неё нельзя посчитать акциз для электромобиля' };
  }
  return {
    ok: false,
    reason: 'Расчёт для электромобилей требует отдельной проверки актуальных ставок пошлины/акциза перед запуском — пока не автоматизирован',
  };
}

export function calculateTurnkeyPrice(
  car: CarForCalculation,
  rates: Rates,
  now = new Date(),
): CalculationResult | CalculationNeedsData {
  if (car.fuelType === 'unknown') {
    return { ok: false, reason: 'Тип силовой установки не определён — требуется ручная проверка' };
  }

  const ageYears = car.ageYears ?? resolveAgeYears(car, now);
  const carPriceRub = car.priceCny * rates.cnyToRub;
  const bankCommissionRub = carPriceRub * BANK_COMMISSION_RATE;

  let dutyResult: CalculationNeedsData | { dutyRub: number };
  let utilResult: CalculationNeedsData | { feeRub: number } = { feeRub: 0 };

  if (car.fuelType === 'ev') {
    dutyResult = calculateEvDuty(car);
  } else {
    dutyResult = calculateIceOrHybridDuty(car, rates.eurToRub, ageYears, now);
    if ('dutyRub' in dutyResult) {
      utilResult = calculateUtilizationFee(car, ageYears);
    }
  }

  if (!('dutyRub' in dutyResult)) return dutyResult;
  if (!('feeRub' in utilResult)) return utilResult;

  const declarationFeeRub = getDeclarationFee(carPriceRub);

  const totalRub =
    carPriceRub + bankCommissionRub + dutyResult.dutyRub + utilResult.feeRub + declarationFeeRub + SBKTS_RUB + EPTS_RUB + BROKER_FEE_RUB;

  return {
    ok: true,
    breakdown: {
      carPriceRub,
      bankCommissionRub,
      customsDutyRub: dutyResult.dutyRub,
      utilizationFeeRub: utilResult.feeRub,
      declarationFeeRub,
      sbktsRub: SBKTS_RUB,
      eptsRub: EPTS_RUB,
      brokerFeeRub: BROKER_FEE_RUB,
    },
    totalRub,
    disclaimer: DISCLAIMER,
  };
}

export function parseEngineVolumeCm3(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number') return raw > 0 ? raw : null;
  const match = String(raw).match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1].replace(',', '.'));
  if (!num || num <= 0) return null;
  return num < 20 ? Math.round(num * 1000) : Math.round(num);
}

export async function fetchCbrRatesForBrowser(): Promise<{ eur: number; cny: number }> {
  const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
  if (!res.ok) throw new Error('Не удалось получить курс валют');
  const data = await res.json();
  const eur = data?.Valute?.EUR?.Value;
  const cny = data?.Valute?.CNY?.Value;
  if (!eur || !cny) throw new Error('Не удалось получить курс EUR/CNY');
  return { eur, cny };
}

const CNY_MARKUP_PERCENT = 2.5;
export function estimateVtbCnyRate(cbrCnyRate: number): number {
  return cbrCnyRate * (1 + CNY_MARKUP_PERCENT / 100);
}

/** Курс EUR через официальный API ЦБ РФ — для бота (не для браузера, там CORS). */
export async function fetchCbrEurRate(): Promise<number> {
  const res = await fetch('https://www.cbr.ru/scripts/XML_daily.asp');
  const xml = await res.text();
  const match = xml.match(/<Valute ID="R01239">[\s\S]*?<Value>([\d,]+)<\/Value>/);
  if (!match) throw new Error('Не удалось найти курс EUR в ответе ЦБ РФ');
  return parseFloat(match[1].replace(',', '.'));
}
