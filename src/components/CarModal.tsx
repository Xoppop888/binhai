import { useState } from 'react';
import { Car, descriptionFeatures, englishBrand, englishModel, formatCny } from '../data/cars';

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
  const features = descriptionFeatures(car.description);

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-head"><h3>{englishBrand(car.brand, car.brandZh)} {englishModel(car.model)} {car.year || ''}</h3><button className="modal-close" onClick={onClose} aria-label="Закрыть">×</button></div>
      <div className="modal-content">
        <img className="modal-main-image" src={images[activeImage]} alt={`${englishBrand(car.brand, car.brandZh)} ${englishModel(car.model)}`} />
        {images.length > 1 && <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>{images.map((src, index) => <button key={src + index} onClick={() => setActiveImage(index)} style={{ width: 76, height: 52, padding: 0, border: index === activeImage ? '2px solid #0c6b78' : '2px solid transparent', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}><img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></button>)}</div>}
        <div style={{ marginTop: 20, color: '#7a878d', fontSize: 12 }}>Стоимость с доставкой до Уссурийска</div><div className="modal-price">{formatCny(car.priceCny)}</div>
        {specRows.length > 0 && <dl className="spec-grid">{specRows.map(([label, value]) => <div className="spec-row" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
        {features.length > 0 && <div style={{ marginTop: 26 }}><h4 style={{ margin: '0 0 12px', fontFamily: 'Manrope, sans-serif' }}>Комплектация автомобиля</h4><ul className="feature-list">{features.map((feature) => <li key={feature}>✓ {feature}</li>)}</ul></div>}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 24, flexWrap: 'wrap' }}><a className="button-primary" href={`https://t.me/Binhaiauto_bot?start=${car.id}`} target="_blank" rel="noreferrer">Рассчитать стоимость ↗</a></div>
      </div>
    </div>
  </div>;
}
