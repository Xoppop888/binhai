import { useState } from 'react';
import { Car, formatCny } from '../data/cars';

interface CarModalProps {
  car: Car;
  onClose: () => void;
}

const SPEC_LABELS: Record<string, string> = {
  vin: 'VIN / номер кузова',
  color: 'Цвет',
  driveType: 'Привод',
  releaseDate: 'Дата выпуска',
  mileageKm: 'Пробег',
  engineVolume: 'Объём двигателя',
  keysCount: 'Ключи',
  bodyCondition: 'Состояние кузова',
  insuranceUntil: 'Страховка ОСАГО',
};

export default function CarModal({ car, onClose }: CarModalProps) {
  const images = car.images && car.images.length > 0 ? car.images : [car.image];
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

  // Фолбэк: если распознанных полей нет, но есть сырые specs с сайта — покажем их как есть
  if (specRows.length === 0 && car.specs) {
    for (const [key, value] of Object.entries(car.specs)) {
      specRows.push([key, value]);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-slate-900 pr-4">
            {car.brand} {car.model} {car.year || ''}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 text-2xl leading-none px-2"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Галерея */}
          <div>
            <div className="bg-slate-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              <img
                src={images[activeImage]}
                alt={`${car.brand} ${car.model}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e2e8f0" width="400" height="300"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EИзображение недоступно%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 ${
                      i === activeImage ? 'border-blue-600' : 'border-transparent'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Цена + категория */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-3xl font-bold text-blue-600">{formatCny(car.priceCny)}</span>
            {car.category && (
              <span className="text-sm bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                {car.category === 'used' ? 'Подержанный автомобиль' : car.category === 'new' ? 'Новый автомобиль' : car.category}
              </span>
            )}
          </div>

          {/* Характеристики */}
          {specRows.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Характеристики</h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {specRows.map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-slate-100 py-1">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-slate-900 font-medium text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Комплектация */}
          {car.description && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Комплектация</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{car.description}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <a
              href="https://t.me/binhai_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Рассчитать в ₽
            </a>
            {car.sourceUrl && (
              <a
                href={car.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-slate-800 underline"
              >
                Открыть на сайте-источнике
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
