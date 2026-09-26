import { useRef, useState } from 'react';
import { Car, descriptionFeatures, englishBrand, englishModel, formatCny } from '../data/cars';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  calculateTurnkeyPrice,
  fetchCbrRatesForBrowser,
  estimateVtbCnyRate,
  parseEngineVolumeCm3,
  type CalculationResult,
  type CalculationNeedsData,
  type FuelType,
} from '../lib/siteCustomsCalculator';

interface CarModalProps { car: Car; onClose: () => void; }
const SPEC_LABELS: Record<string, string> = { vin: 'VIN / номер кузова', color: 'Цвет', driveType: 'Привод', releaseDate: 'Дата выпуска', mileageKm: 'Пробег', engineVolume: 'Объём двигателя', keysCount: 'Ключи', bodyCondition: 'Состояние кузова', insuranceUntil: 'Страховка ОСАГО' };

function fmtRub(n: number): string {
  return Math.round(n).toLocaleString('ru-RU') + ' ₽';
}

export default function CarModal({ car, onClose }: CarModalProps) {
  const images = car.images?.length ? car.images : [car.image];
  const [activeImage, setActiveImage] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const [calcStatus, setCalcStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [calcResult, setCalcResult] = useState<CalculationResult | CalculationNeedsData | null>(null);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadStatus, setLeadStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  function isRussianPhone(value: string): boolean {
    return /^\+7\s?\(?9\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/.test(value.trim());
  }

  function goTo(index: number) {
    const next = (index + images.length) % images.length;
    setActiveImage(next);
  }
  function goPrev() { goTo(activeImage - 1); }
  function goNext() { goTo(activeImage + 1); }

  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) delta > 0 ? goPrev() : goNext();
    touchStartX.current = null;
  }

  function onThumbsWheel(e: React.WheelEvent) {
    if (!thumbsRef.current) return;
    e.preventDefault();
    thumbsRef.current.scrollLeft += e.deltaY;
  }

  async function runCalculation() {
    setCalcStatus('loading');
    try {
      const { eur, cny } = await fetchCbrRatesForBrowser();
      const cnyToRub = estimateVtbCnyRate(cny);
      const result = calculateTurnkeyPrice(
        {
          priceCny: car.priceCny,
          ageYears: Math.max(0, new Date().getFullYear() - (car.year || new Date().getFullYear())),
          modelYear: car.year,
          releaseDate: car.releaseDate,
          fuelType: (car.fuelType as FuelType) || 'unknown',
          engineVolumeCm3: parseEngineVolumeCm3(car.engineVolume),
          powerHp: car.powerHp ?? null,
          batteryKwh: car.batteryKwh ?? null,
        },
        { cnyToRub, eurToRub: eur },
      );
      setCalcResult(result);
      setCalcStatus('done');
    } catch {
      setCalcStatus('error');
    }
  }

  async function submitLead() {
    if (!supabase || !isRussianPhone(leadPhone)) return;
    setLeadStatus('sending');

    const carTitle = `${englishBrand(car.brand, car.brandZh)} ${englishModel(car.model)}${car.year ? `, ${car.year}` : ''}`;
    const isCalculated = calcResult?.ok === true;

    const { error } = await supabase.from('leads').insert({
      car_title: carTitle,
      status: isCalculated ? 'calculated' : 'manual_review',
      total_rub: isCalculated ? (calcResult as CalculationResult).totalRub : null,
      reason: !isCalculated && calcResult ? (calcResult as CalculationNeedsData).reason : null,
      source: 'web',
      contact_name: leadName.trim() || null,
      contact_phone: leadPhone.trim(),
      vin: car.vin || null,
    });

    if (error) {
      setLeadStatus('error');
      return;
    }

    const { error: emailError } = await supabase.functions.invoke('send-lead-email', {
      body: {
        carTitle,
        status: isCalculated ? 'calculated' : 'manual_review',
        totalRub: isCalculated ? (calcResult as CalculationResult).totalRub : null,
        reason: !isCalculated && calcResult ? (calcResult as CalculationNeedsData).reason : null,
        source: 'web',
        contactName: leadName.trim() || null,
        contactPhone: leadPhone.trim(),
        vin: car.vin || null,
      },
    });

    setLeadStatus(emailError ? 'error' : 'sent');
  }

  const specRows: [string, string][] = [];
  if (car.vin) specRows.push([SPEC_LABELS.vin, car.vin]);
  if (car.color) specRows.push([SPEC_LABELS.color, car.color]);
  if (car.driveType) specRows.push([SPEC_LABELS.driveType, car.driveType]);
  if (car.releaseDate) specRows.push([SPEC_LABELS.releaseDate, car.releaseDate]);
  if (car.mileageKm) specRows.push([SPEC_LABELS.mileageKm, `${car.mileageKm.toLocaleString('ru-RU')} км`]);
  if (car.engineVolume) specRows.push([SPEC_LABELS.engineVolume, car.engineVolume]);
  if (car.keysCount) specRows.push([SPEC_LABELS.keysCount, car.keysCount]);
  if (car.bodyCondition) specRows.push([SPEC_LABELS.bodyCondition, car.bodyCondition]);
  if (car.insuranceUntil) specRows.push([SPEC_LABELS.insuranceUntil, car.insuranceUntil]);
  if (!specRows.length && car.specs) Object.entries(car.specs).forEach(([key, value]) => specRows.push([key, value]));
  const features = descriptionFeatures(car.description);

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-head"><h3>{englishBrand(car.brand, car.brandZh)} {englishModel(car.model)} {car.year || ''}</h3><button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button></div>
      <div className="modal-content">
        <div style={{ position: 'relative' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <img className="modal-main-image" src={images[activeImage]} alt={`${englishBrand(car.brand, car.brandZh)} ${englishModel(car.model)}`} />
          {images.length > 1 && <>
            <button onClick={goPrev} aria-label="Предыдущее фото" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', border: 0, background: 'rgba(21,37,43,.55)', color: '#fff', fontSize: 20, cursor: 'pointer' }}>‹</button>
            <button onClick={goNext} aria-label="Следующее фото" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', border: 0, background: 'rgba(21,37,43,.55)', color: '#fff', fontSize: 20, cursor: 'pointer' }}>›</button>
            <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', color: '#fff', fontSize: 12, textShadow: '0 1px 3px rgba(0,0,0,.6)' }}>{activeImage + 1} / {images.length}</div>
          </>}
        </div>
        {images.length > 1 && <div ref={thumbsRef} onWheel={onThumbsWheel} style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>{images.map((src, index) => <button key={src + index} onClick={() => goTo(index)} style={{ width: 76, height: 52, padding: 0, border: index === activeImage ? '2px solid #0c6b78' : '2px solid transparent', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}><img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></button>)}</div>}
        <div style={{ marginTop: 20, color: '#7a878d', fontSize: 12 }}>Стоимость с доставкой до Уссурийска</div><div className="modal-price">{formatCny(car.priceCny)}</div>
        {specRows.length > 0 && <dl className="spec-grid">{specRows.map(([label, value]) => <div className="spec-row" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        {features.length > 0 && <div style={{ marginTop: 26 }}><h4 style={{ margin: '0 0 12px', fontFamily: 'Manrope, sans-serif' }}>Комплектация автомобиля</h4><ul className="feature-list">{features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul></div>}

        {/* Расчёт стоимости под ключ прямо на сайте */}
        <div style={{ marginTop: 26, padding: 18, background: '#f6f9f8', borderRadius: 10 }}>
          {calcStatus === 'idle' && <button className="button-primary" onClick={runCalculation}>Рассчитать стоимость под ключ</button>}

          {calcStatus === 'loading' && <p style={{ margin: 0, color: '#7a878d' }}>Считаю по актуальному курсу ЦБ...</p>}

          {calcStatus === 'error' && <>
            <p style={{ margin: '0 0 10px', color: '#b44a4a' }}>Не удалось получить курс валют. Попробуйте ещё раз чуть позже.</p>
            <button className="page-button" onClick={runCalculation}>Повторить</button>
          </>}

          {calcStatus === 'done' && calcResult && (
            <>
              {calcResult.ok ? (
                <div>
                  <h4 style={{ margin: '0 0 12px', fontFamily: 'Manrope, sans-serif' }}>Расчёт под ключ</h4>
                  <dl className="spec-grid">
                    <div className="spec-row"><dt>Цена авто</dt><dd>{fmtRub(calcResult.breakdown.carPriceRub)}</dd></div>
                    <div className="spec-row"><dt>Комиссия банка за инвойс</dt><dd>{fmtRub(calcResult.breakdown.bankCommissionRub)}</dd></div>
                    <div className="spec-row"><dt>Таможенная пошлина</dt><dd>{fmtRub(calcResult.breakdown.customsDutyRub)}</dd></div>
                    <div className="spec-row"><dt>Утильсбор</dt><dd>{fmtRub(calcResult.breakdown.utilizationFeeRub)}</dd></div>
                    <div className="spec-row"><dt>Сборы (оформление + СБКТС + ЭПТС)</dt><dd>{fmtRub(calcResult.breakdown.declarationFeeRub + calcResult.breakdown.sbktsRub + calcResult.breakdown.eptsRub)}</dd></div>
                    <div className="spec-row"><dt>Услуги брокера</dt><dd>{fmtRub(calcResult.breakdown.brokerFeeRub)}</dd></div>
                  </dl>
                  <div className="modal-price" style={{ marginTop: 14 }}>Итого: {fmtRub(calcResult.totalRub)}</div>
                  <p style={{ fontSize: 11, color: '#94a0a2', marginTop: 8 }}>{calcResult.disclaimer}</p>
                </div>
              ) : (
                <p style={{ margin: 0, color: '#88613a' }}>Не могу посчитать автоматически: {calcResult.reason}. Оставьте контакт ниже — менеджер посчитает вручную.</p>
              )}

              {/* Форма заявки — доступна и после успешного расчёта, и когда нужна ручная проверка */}
              {isSupabaseConfigured && leadStatus !== 'sent' && (
                <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid #e4ecea' }}>
                  <h4 style={{ margin: '0 0 12px', fontFamily: 'Manrope, sans-serif' }}>Оставить заявку на эту машину</h4>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input placeholder="Имя" value={leadName} onChange={(e) => setLeadName(e.target.value)} style={{ flex: '1 1 160px', padding: 10, borderRadius: 6, border: '1px solid #d6e1de' }} />
                    <input type="tel" inputMode="tel" placeholder="Телефон* +7 999 123-45-67" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} aria-invalid={leadPhone.length > 0 && !isRussianPhone(leadPhone)} style={{ flex: '1 1 220px', padding: 10, borderRadius: 6, border: `1px solid ${leadPhone.length > 0 && !isRussianPhone(leadPhone) ? '#b44a4a' : '#d6e1de'}` }} />
                  </div>
                  {leadPhone.length > 0 && !isRussianPhone(leadPhone) && <p style={{ color: '#b44a4a', fontSize: 12, margin: '8px 0 0' }}>Введите российский номер в формате +7 999 123-45-67.</p>}
                  {car.vin && <p style={{ color: '#7a878d', fontSize: 12, margin: '8px 0 0' }}>VIN автомобиля будет отправлен менеджеру: {car.vin}</p>}
                  <button className="button-primary" style={{ marginTop: 12 }} onClick={submitLead} disabled={!isRussianPhone(leadPhone) || leadStatus === 'sending'}>
                    {leadStatus === 'sending' ? 'Отправляю...' : 'Отправить заявку'}
                  </button>
                  {leadStatus === 'error' && <p style={{ color: '#b44a4a', fontSize: 12, marginTop: 8 }}>Не удалось отправить, попробуйте ещё раз.</p>}
                </div>
              )}
              {leadStatus === 'sent' && <p style={{ marginTop: 18, color: '#226c63', fontWeight: 700 }}>Спасибо! Заявка отправлена, менеджер свяжется с вами.</p>}
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 24, flexWrap: 'wrap' }}><a className="button-ghost" style={{ color: '#0d6470', border: '1px solid #0d6470' }} href={`https://t.me/Binhaiauto_bot?start=${car.id}`} target="_blank" rel="noreferrer">Или через Telegram-бота ↗</a></div>
      </div>
    </div>
  </div>;
}
