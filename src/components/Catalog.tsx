import { useState } from 'react';
import { Car, formatCny } from '../data/cars';
import CarModal from './CarModal';

interface CatalogProps {
  cars: Car[];
  source: string;
}

export default function Catalog({ cars, source }: CatalogProps) {
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  return (
    <section id="catalog" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Каталог автомобилей</h2>
          <p className="text-slate-600">
            Загружено {cars.length} автомобилей из {source}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cars.map((car) => (
            <div
              key={car.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-slate-200"
            >
              <button
                onClick={() => setSelectedCar(car)}
                className="relative block w-full aspect-w-16 aspect-h-9 bg-slate-100 group"
              >
                <img
                  src={car.image}
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e2e8f0" width="400" height="300"/%3E%3Ctext fill="%2394a3b8" font-family="sans-serif" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EИзображение недоступно%3C/text%3E%3C/svg%3E';
                  }}
                />
                {car.images && car.images.length > 1 && (
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    📷 {car.images.length}
                  </span>
                )}
                {car.category && (
                  <span className="absolute top-2 left-2 bg-white/90 text-slate-700 text-xs px-2 py-0.5 rounded-full">
                    {car.category === 'used' ? 'Подержанный' : car.category === 'new' ? 'Новый' : car.category}
                  </span>
                )}
              </button>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-600 font-semibold">{car.brandZh}</span>
                  <span className="text-sm text-slate-500">{car.year}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {car.brand} {car.model}
                </h3>
                <p className="text-sm text-slate-600 mb-4">{car.trim}</p>
                {car.mileageKm !== undefined && car.mileageKm > 0 && (
                  <p className="text-xs text-slate-500 mb-4">Пробег: {car.mileageKm.toLocaleString('ru-RU')} км</p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCny(car.priceCny)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCar(car)}
                      className="border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-sm"
                    >
                      Подробнее
                    </button>
                    <a
                      href="https://t.me/binhai_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Рассчитать в ₽
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cars.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600">Нет доступных автомобилей</p>
          </div>
        )}
      </div>

      {selectedCar && <CarModal car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </section>
  );
}
