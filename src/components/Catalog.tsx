import { useMemo, useState } from 'react';
import { Car, englishBrand, englishModel, formatCny } from '../data/cars';
import CarModal from './CarModal';

interface CatalogProps { cars: Car[]; source: string; }
const PAGE_SIZE = 36;

export default function Catalog({ cars, source }: CatalogProps) {
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'new' | 'used'>('all');
  const filtered = useMemo(() => filter === 'all' ? cars : cars.filter((car) => (car.category || 'used') === filter), [cars, filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleCars = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  function changeFilter(value: 'all' | 'new' | 'used') { setFilter(value); setPage(1); }
  function scrollCatalog() { window.scrollTo({ top: document.getElementById('catalog')?.offsetTop ?? 0, behavior: 'smooth' }); }
  return <section className="catalog-section" id="catalog"><div className="container">
    <div className="catalog-heading"><div><p className="eyebrow eyebrow-dark">ВЫБОР BINHAI</p><h2>Автомобили в наличии</h2><p className="catalog-subtitle">Реальные автомобили с доставкой до Уссурийска. Выберите подходящий вариант — детали и галерея внутри карточки.</p></div><div className="catalog-count"><strong>{filtered.length}</strong><span>автомобилей<br />в каталоге</span></div></div>
    <div className="catalog-toolbar"><div className="filter-tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => changeFilter('all')}>Все автомобили</button><button className={filter === 'new' ? 'active' : ''} onClick={() => changeFilter('new')}>Новые</button><button className={filter === 'used' ? 'active' : ''} onClick={() => changeFilter('used')}>С пробегом</button></div><span className="catalog-live"><i /> {source === 'supabase' ? 'Каталог обновлён' : 'Каталог доступен'}</span></div>
    <div className="car-grid-v2">{visibleCars.map((car) => { const brand = englishBrand(car.brand, car.brandZh); const model = englishModel(car.model); return <article className="car-card-v2" key={car.id}><button className="car-visual" onClick={() => setSelectedCar(car)} aria-label={`Открыть ${brand} ${model}`}><img src={car.image} alt={`${brand} ${model}`} /><span className="car-condition">{car.category === 'new' ? 'NEW' : 'VERIFIED'}</span><span className="car-year">{car.year || '—'}</span></button><div className="car-card-content"><p className="car-brand-v2">{brand}</p><h3>{model}</h3><p className="car-trim-v2">{car.engineVolume || 'Engine'} <span>·</span> {car.driveType || 'Drive'} <span>·</span> {car.mileageKm ? `${car.mileageKm.toLocaleString('ru-RU')} km` : 'Mileage on request'}</p><div className="car-card-footer"><div><small>С доставкой до Уссурийска</small><strong>{formatCny(car.priceCny)}</strong></div><button className="card-arrow" onClick={() => setSelectedCar(car)}>↗</button></div></div></article>; })}</div>
    {visibleCars.length === 0 && <div className="empty-state"><h3>Автомобили не найдены</h3><p>Попробуйте выбрать другой фильтр.</p></div>}
    {pageCount > 1 && <div className="pagination-v2"><button className="page-button" disabled={page === 1} onClick={() => { setPage((v) => v - 1); scrollCatalog(); }}>← Назад</button><span><b>{page}</b> / {pageCount}</span><button className="page-button" disabled={page === pageCount} onClick={() => { setPage((v) => v + 1); scrollCatalog(); }}>Вперёд →</button></div>}
  </div>{selectedCar && <CarModal car={selectedCar} onClose={() => setSelectedCar(null)} />}</section>;
}
