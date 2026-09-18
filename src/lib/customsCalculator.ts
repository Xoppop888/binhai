// src/lib/customsCalculator.ts
//
// Расчёт цены "под ключ" для карточки авто: цена в Китае (CNY) -> курс ВТБ
// -> комиссия банка -> растаможка (ветка по fuel_type) -> услуги брокера.
//
// ЧЕСТНОЕ ПРЕДУПРЕЖДЕНИЕ ПЕРЕД ИСПОЛЬЗОВАНИЕМ В ПРОДЕ:
// Ставки утильсбора (коммерческая сетка) и таможенной пошлины для авто
// младше 3 лет ниже помечены как VERIFY_BEFORE_LAUNCH — точные текущие
// значения нужно сверить с официальным калькулятором (например tks.ru/auto/calc)
// или Решением Совета ЕЭК №107 (в актуальной редакции) перед тем, как
// показывать эти цифры клиентам. Ветка "старше 3 лет, ДВС/гибрид, льготный
// утильсбор" — рассчитана по значениям, которые на момент написания кода
// подтверждаются несколькими независимыми калькуляторами растаможки, но и
// её стоит перепроверить, т.к. ставки меняются (последний раз — 01.12.2025).

export type FuelType = 'ice' | 'hybrid' | 'ev' | 'unknown';

export interface CarForCalculation {
  priceCny: number;
  ageYears: number;
  fuelType: FuelType;
  engineVolumeCm3: number | null;
  powerHp: number | null;
  batteryKwh: number | null;
}

export interface Rates {
  cnyToRub: number; // курс ВТБ, из exchange_rates (source = 'vtb_scraper' | 'manual_override')
  eurToRub: number; // курс ЦБ, из exchange_rates (source = 'cbr_api')
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
  reason: string; // что именно не хватает, показать админу/менеджеру
}

const BANK_COMMISSION_RATE = 0.025; // 2.5%, верхняя граница из диапазона 2-2.5%
const BROKER_FEE_RUB = 60_000;
const SBKTS_RUB = 20_000;
const EPTS_RUB = 1_200;

const DISCLAIMER =
  'Расчёт предварительный и носит ориентировочный характер. Итоговая сумма ' +
  'таможенных платежей зависит от решения таможенного органа, актуального ' +
  'курса валют на дату оформления и может отличаться от указанной здесь. ' +
  'Точную стоимость под ключ уточняйте у брокера.';

/** Сбор за таможенное оформление — шкала от таможенной стоимости в рублях. */
function getDeclarationFee(customsValueRub: number): number {
  // Постановление Правительства РФ №1637 (в ред. №1638, действует с 01.01.2026).
  // VERIFY_BEFORE_LAUNCH: сверить актуальные пороги перед запуском.
  if (customsValueRub <= 200_000) return 1_067;
  if (customsValueRub <= 450_000) return 2_134;
  if (customsValueRub <= 1_200_000) return 4_269;
  if (customsValueRub <= 2_700_000) return 11_746;
  if (customsValueRub <= 4_200_000) return 16_524;
  if (customsValueRub <= 5_500_000) return 21_344;
  if (customsValueRub <= 7_000_000) return 27_540;
  return 30_000; // и далее по шкале — для очень дорогих авто уточнять отдельно
}

/**
 * ЕТС (единая ставка таможенного платежа) для авто с ДВС/гибрид старше 3 лет —
 * фиксированная ставка в EUR за см³ объёма двигателя.
 * Таблица ниже — известные диапазоны Приложения к Решению Совета ЕЭК №107.
 * VERIFY_BEFORE_LAUNCH.
 */
function getEurPerCm3ForOlderThan3Years(engineVolumeCm3: number): number {
  if (engineVolumeCm3 <= 1000) return 1.5;
  if (engineVolumeCm3 <= 1500) return 1.7;
  if (engineVolumeCm3 <= 1800) return 2.5;
  if (engineVolumeCm3 <= 2300) return 2.7;
  if (engineVolumeCm3 <= 3000) return 3.0;
  return 3.6;
}

function calculateIceOrHybridDuty(
  car: CarForCalculation,
  customsValueRub: number,
  eurToRub: number,
): CalculationNeedsData | { dutyRub: number } {
  if (!car.engineVolumeCm3) {
    return { ok: false, reason: 'Не заполнен объём двигателя — растаможку по ДВС/гибриду посчитать нельзя' };
  }

  if (car.ageYears < 3) {
    // Для машин младше 3 лет пошлина — % от таможенной стоимости с минимумом
    // в EUR/см³. Точные пороговые проценты и минимумы здесь НЕ зашиты —
    // слишком высок риск показать неверную цифру клиенту.
    // VERIFY_BEFORE_LAUNCH: реализовать по актуальной таблице для авто <3 лет
    // (обычно ступени по таможенной стоимости в EUR: 54%/48%/48%/... с минимумом
    // в EUR за см³) или временно исключить такие авто из автоматического расчёта.
    return {
      ok: false,
      reason: 'Авто младше 3 лет — расчёт пошлины по проценту от стоимости пока не реализован, требует ручной проверки брокером',
    };
  }

  const eurPerCm3 = getEurPerCm3ForOlderThan3Years(car.engineVolumeCm3);
  const dutyRub = eurPerCm3 * car.engineVolumeCm3 * eurToRub;
  return { dutyRub };
}

/** Утильсбор — льготный для физлица при личном пользовании, иначе коммерческая сетка. */
function calculateUtilizationFee(car: CarForCalculation): CalculationNeedsData | { feeRub: number } {
  if (car.powerHp == null) {
    return { ok: false, reason: 'Не заполнена мощность (л.с.) — без неё нельзя проверить условие льготы по утильсбору' };
  }

  const qualifiesForDiscount =
    car.powerHp <= 160 && (car.engineVolumeCm3 == null || car.engineVolumeCm3 <= 3000);

  if (qualifiesForDiscount) {
    // Льготные ставки для физлица, личное пользование (действуют с 01.12.2025 по 31.12.2026).
    return { feeRub: car.ageYears < 3 ? 3_400 : 5_200 };
  }

  // Машина не проходит по льготе (>160 л.с. или >3000 см³) — коммерческая
  // сетка, суммы там на порядки выше. Точные коэффициенты k по мощности —
  // VERIFY_BEFORE_LAUNCH, здесь намеренно не зашиты, чтобы не занизить цифру.
  return {
    ok: false,
    reason: 'Авто не проходит по льготному утильсбору (>160 л.с. или >3000 см³) — считается по коммерческой сетке, нужна ручная проверка',
  };
}

/** Электромобили — отдельная схема: пошлина % от стоимости + акциз по батарее + НДС. */
function calculateEvDuty(
  car: CarForCalculation,
  customsValueRub: number,
): CalculationNeedsData | { dutyRub: number } {
  if (car.batteryKwh == null) {
    return { ok: false, reason: 'Не заполнена ёмкость батареи (кВт·ч) — без неё нельзя посчитать акциз для электромобиля' };
  }

  // VERIFY_BEFORE_LAUNCH: ставка пошлины для EV и акциз за кВт·ч периодически
  // меняются (были случаи отмены/восстановления льгот). Здесь заложена
  // консервативная схема "пошлина % от стоимости + НДС 20%", акциз — уточнить.
  return {
    ok: false,
    reason: 'Расчёт для электромобилей требует отдельной проверки актуальных ставок пошлины/акциза перед запуском — пока не автоматизирован',
  };
}

export function calculateTurnkeyPrice(
  car: CarForCalculation,
  rates: Rates,
): CalculationResult | CalculationNeedsData {
  if (car.fuelType === 'unknown') {
    return { ok: false, reason: 'Тип силовой установки не определён — требуется ручная проверка в /admin перед расчётом' };
  }

  const carPriceRub = car.priceCny * rates.cnyToRub;
  const bankCommissionRub = carPriceRub * BANK_COMMISSION_RATE;
  const customsValueRub = carPriceRub; // упрощение: таможенная стоимость = цена по договору

  let dutyResult: CalculationNeedsData | { dutyRub: number };
  let utilResult: CalculationNeedsData | { feeRub: number } = { feeRub: 0 };

  if (car.fuelType === 'ev') {
    dutyResult = calculateEvDuty(car, customsValueRub);
  } else {
    // ice или hybrid — считаются одинаково, по объёму двигателя
    dutyResult = calculateIceOrHybridDuty(car, customsValueRub, rates.eurToRub);
    if ('dutyRub' in dutyResult) {
      utilResult = calculateUtilizationFee(car);
    }
  }

  if (!('dutyRub' in dutyResult)) return dutyResult;
  if (!('feeRub' in utilResult)) return utilResult;

  const declarationFeeRub = getDeclarationFee(customsValueRub);

  const totalRub =
    carPriceRub +
    bankCommissionRub +
    dutyResult.dutyRub +
    utilResult.feeRub +
    declarationFeeRub +
    SBKTS_RUB +
    EPTS_RUB +
    BROKER_FEE_RUB;

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

/** Курс EUR через официальный API ЦБ РФ — без скрапинга, без ключа. */
export async function fetchCbrEurRate(): Promise<number> {
  const res = await fetch('https://www.cbr.ru/scripts/XML_daily.asp');
  const xml = await res.text();

  // Простой парсинг без зависимостей: ищем блок Valute с CharCode EUR.
  const match = xml.match(/<Valute ID="R01239">[\s\S]*?<Value>([\d,]+)<\/Value>/);
  if (!match) throw new Error('Не удалось найти курс EUR в ответе ЦБ РФ');

  return parseFloat(match[1].replace(',', '.'));
}
