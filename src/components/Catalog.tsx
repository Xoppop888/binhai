import { useState } from 'react';
import { Car, formatCny } from '../data/cars';
import CarModal from './CarModal';

interface CatalogProps { cars: Car[]; source: string; }

export default function Catalog({ cars, source }: CatalogProps) {
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  return (
    <section className="section catalog-section" id="catalog">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="section-kicker">Выбор BINHAI</p>
            <h2>Автомобили в наличии</h2>
          </div>
          <div>
            <p className="section-intro">Каталог обновляется из базы объявлений. Откройте карточку, чтобы увидеть характеристики и галерею.</p>
            <div className="catalog-status"><span className="status-dot" /> Данные: {source === 'supabase' ? 'Supabase' : source === 'cache' ? 'кэш браузера' : 'демо-каталог'}</div>
          </div>
        </div>

        <div className="car-grid">
          {cars.map((car) => (
            <article className="car-card" key={car.id}>
              <button className="car-image-wrap" onClick={() => setSelectedCar(car)} aria-label={`Открыть ${car.brand} ${car.model}`}>
                <img className="car-image" src={car.image} alt={`${car.brand} ${car.model}`} />
                <span className="car-tag">{car.category === 'new' ? 'Новый' : 'Проверен'}</span>
              </button>
              <div className="car-body">
                <div className="car-meta"><span className="car-brand">{car.brandZh || car.brand}</span><span>{car.year || '—'}</span></div>
                <h3>{car.brand} {car.model}</h3>
                <p className="car-trim">{car.trim || 'Комплектация уточняется'}</p>
                <div className="car-bottom">
                  <div className="car-price"><small>Цена в Китае</small><strong>{formatCny(car.priceCny)}</strong></div>
                  <button className="button-outline" onClick={() => setSelectedCar(car)}>Подробнее →</button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {cars.length === 0 && <p>Автомобили пока не загружены.</p>}
      </div>
      {selectedCar && <CarModal car={selectedCar} onClose={() => setSelectedCar(null)} />}
    </section>
  );
}
