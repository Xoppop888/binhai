import { useRef, useState } from 'react';
import { Car, descriptionFeatures, englishBrand, englishModel, formatCny } from '../data/cars';

interface CarModalProps { car: Car; onClose: () => void; }
const SPEC_LABELS: Record<string, string> = { vin: 'VIN / номер кузова', color: 'Цвет', driveType: 'Привод', releaseDate: 'Дата выпуска', mileageKm: 'Пробег', engineVolume: 'Объём двигателя', keysCount: 'Ключи', bodyCondition: 'Состояние кузова', insuranceUntil: 'Страховка ОСАГО' };

export default function CarModal({ car, onClose }: CarModalProps) {
  const images = car.images?.length ? car.images : [car.image];
  const [activeImage, setActiveImage] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  function goTo(index: number) {
    const next = (index + images.length) % images.length;
    setActiveImage(next);
  }
  function goPrev() { goTo(activeImage - 1); }
  function goNext() { goTo(activeImage + 1); }

  // Свайп пальцем по главному фото на мобильном
  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) delta > 0 ? goPrev() : goNext();
    touchStartX.current = null;
  }

  // Обычное колесо мыши крутит полосу миниатюр по горизонтали (иначе на
  // десктопе её тяжело скроллить — только через узкий скроллбар или Shift+колесо)
  function onThumbsWheel(e: React.WheelEvent) {
    if (!thumbsRef.current) return;
    e.preventDefault();
    thumbsRef.current.scrollLeft += e.deltaY;
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
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 24, flexWrap: 'wrap' }}><a className="button-primary" href={`https://t.me/Binhaiauto_bot?start=${car.id}`} target="_blank" rel="noreferrer">Рассчитать стоимость ↗</a></div>
      </div>
    </div>
  </div>;
}
