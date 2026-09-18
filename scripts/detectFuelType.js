/**
 * scripts/detectFuelType.js
 * ---------------------------------------------------------------
 * Парсер bhgjauto.com отдаёт только текстовое значение объёма
 * двигателя (specs.engineVolume) — тип силовой установки (ДВС/
 * гибрид/электро) и мощность он не тянет вообще. Эта функция —
 * черновая эвристика по названию и описанию карточки.
 *
 * ВАЖНО: 'ev' и 'hybrid' по ключевым словам — довольно надёжны
 * (производители явно пишут это в названии модели). А вот 'ice'
 * по умолчанию (когда объём двигателя есть, но явных признаков
 * гибрида в тексте нет) может изредка ошибочно накрыть гибрид,
 * если в конкретном объявлении просто не написали слово "гибрид".
 * Поэтому каждая карточка с проставленным fuel_type должна быть
 * перепроверена человеком в /admin перед тем, как по ней считается
 * растаможка.
 * ---------------------------------------------------------------
 */

const EV_KEYWORDS = [
  /электромобил/i,
  /чисто электр/i,
  /\bev\b/i,
  /battery[\s-]?electric/i,
  /纯电动/,
  /电动汽车/,
];

const HYBRID_KEYWORDS = [
  /гибрид/i,
  /\bhev\b/i,
  /\bphev\b/i,
  /plug-?in hybrid/i,
  /\bhybrid\b/i,
  /混合动力/,
  /插电式混动/,
  /油电混动/,
];

/**
 * @param {{ title?: string, description?: string, engine_volume?: string | number | null }} car
 * @returns {{ fuelType: 'ev' | 'hybrid' | 'ice' | 'unknown', needsReview: boolean }}
 */
export function detectFuelType(car) {
  const text = `${car.title ?? ''} ${car.description ?? ''}`;

  if (EV_KEYWORDS.some((re) => re.test(text))) {
    return { fuelType: 'ev', needsReview: true };
  }

  if (HYBRID_KEYWORDS.some((re) => re.test(text))) {
    return { fuelType: 'hybrid', needsReview: true };
  }

  // engine_volume у нас строка вида "1998 см³" / "2.0L" — просто проверяем,
  // что она вообще есть и не пустая (не пытаемся тут парсить число).
  const hasEngineVolume =
    typeof car.engine_volume === 'string'
      ? car.engine_volume.trim().length > 0
      : Boolean(car.engine_volume);

  if (hasEngineVolume) {
    // Объём двигателя есть, явных признаков гибрида/электро в тексте нет —
    // вероятнее всего обычный ДВС, но всё равно на проверку человеком.
    return { fuelType: 'ice', needsReview: true };
  }

  // Объёма нет и явных признаков EV в тексте тоже нет — не угадываем.
  return { fuelType: 'unknown', needsReview: true };
}
