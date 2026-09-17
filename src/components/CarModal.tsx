import { useState } from 'react';
import { Car, formatCny } from '../data/cars';

interface CarModalProps { car: Car; onClose: () => void; }
const SPEC_LABELS: Record<string, string> = { vin: 'VIN / номер кузова', color: 'Цвет', driveType: 'Привод', releaseDate: 'Дата выпуска', mileageKm: 'Пробег', engineVolume: 'Объём двигателя', keysCount: 'Ключи', bodyCondition: 'Состояние кузова', insuranceUntil: 'Страховка ОСАГО' };

export default function CarModal({ car, onClose }: CarModalProps) {
  const images = car.images?.length ? car.images : [car.image];
  const [activeImage, setActiveImage] = useState(0);
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

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-head"><h3>{car.brand} {car.model} {car.year || ''}</h3><button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button></div>
      <div className="modal-content">
        <img className="modal-main-image" src={images[activeImage]} alt={`${car.brand} ${car.model}`} />
        {images.length > 1 && <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>{images.map((src, index) => <button key={src + index} onClick={() => setActiveImage(index)} style={{ width: 76, height: 52, padding: 0, border: index === activeImage ? '2px solid #0c6b78' : '2px solid transparent', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}><img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></button>)}</div>}
        <div className="modal-price">{formatCny(car.priceCny)}</div>
        {specRows.length > 0 && <dl className="spec-grid">{specRows.map(([label, value]) => <div className="spec-row" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        {car.description && <p style={{ color: '#65727c', lineHeight: 1.7 }}>{car.description}</p>}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 24, flexWrap: 'wrap' }}><a className="button-primary" href="https://t.me/binhai_bot" target="_blank" rel="noreferrer">Рассчитать стоимость ↗</a>{car.sourceUrl && <a className="button-secondary" href={car.sourceUrl} target="_blank" rel="noreferrer">Источник объявления</a>}</div>
      </div>
    </div>
  </div>;
}
