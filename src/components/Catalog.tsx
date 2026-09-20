import { useMemo, useState } from 'react';
import { Car, englishBrand, englishModel, formatCny } from '../data/cars';
import CarModal from './CarModal';

interface CatalogProps { cars: Car[]; source: string; }
const PAGE_SIZE = 36;

type SortOption = 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'brand_az';

const SORT_LABELS: Record<SortOption, string> = {
  price_asc: 'Цена: сначала дешевле',
  price_desc: 'Цена: сначала дороже',
  year_desc: 'Год: сначала новее',
  year_asc: 'Год: сначала старше',
  brand_az: 'Марка: А-Я',
};

export default function Catalog({ cars, source }: CatalogProps) {
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'new' | 'used'>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortOption>('price_asc');

  // Список марок — с человеческим (английским) названием, отсортирован А-Я
  const brandOptions = useMemo(() => {
    const set = new Set<string>();
    cars.forEach((car) => set.add(englishBrand(car.brand, car.brandZh)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [cars]);

  // Список моделей зависит от выбранной марки
  const modelOptions = useMemo(() => {
    const set = new Set<string>();
    cars.forEach((car) => {
      const brand = englishBrand(car.brand, car.brandZh);
      if (brandFilter === 'all' || brand === brandFilter) set.add(englishModel(car.model));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [cars, brandFilter]);

  function changeFilter(value: 'all' | 'new' | 'used') { setFilter(value); setPage(1); }
  function changeBrand(value: string) { setBrandFilter(value); setModelFilter('all'); setPage(1); }
  function changeModel(value: string) { setModelFilter(value); setPage(1); }
  function changeSort(value: SortOption) { setSort(value); setPage(1); }

  const filtered = useMemo(() => {
    let result = filter === 'all' ? cars : cars.filter((car) => (car.category || 'used') === filter);
    if (brandFilter !== 'all') result = result.filter((car) => englishBrand(car.brand, car.brandZh) === brandFilter);
    if (modelFilter !== 'all') result = result.filter((car) => englishModel(car.model) === modelFilter);

    const sorted = [...result];
    switch (sort) {
      case 'price_asc': sorted.sort((a, b) => a.priceCny - b.priceCny); break;
      case 'price_desc': sorted.sort((a, b) => b.priceCny - a.priceCny); break;
      case 'year_desc': sorted.sort((a, b) => (b.year || 0) - (a.year || 0)); break;
      case 'year_asc': sorted.sort((a, b) => (a.year || 0) - (b.year || 0)); break;
      case 'brand_az': sorted.sort((a, b) => englishBrand(a.brand, a.brandZh).localeCompare(englishBrand(b.brand, b.brandZh))); break;
    }
    return sorted;
  }, [cars, filter, brandFilter, modelFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleCars = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  function scrollCatalog() { window.scrollTo({ top: document.getElementById('catalog')?.offsetTop ?? 0, behavior: 'smooth' }); }

  return <section className="catalog-section" id="catalog"><div className="container">
    <div className="catalog-heading"><div><p className="eyebrow eyebrow-dark">ВЫБОР BINHAI</p><h2>Автомобили в наличии</h2><p className="catalog-subtitle">Реальные автомобили с доставкой по России. В карточке указана стоимость конкретного маршрута до Уссурийска.</p></div><div className="catalog-count"><strong>{filtered.length}</strong><span>автомобилей<br />в каталоге</span></div></div>
    <div className="catalog-toolbar"><div className="filter-tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => changeFilter('all')}>Все автомобили</button><button className={filter === 'new' ? 'active' : ''} onClick={() => changeFilter('new')}>Новые</button><button className={filter === 'used' ? 'active' : ''} onClick={() => changeFilter('used')}>С пробегом</button></div><span className="catalog-live"><i /> {source === 'supabase' ? 'Каталог обновлён' : 'Каталог доступен'}</span></div>
    <div className="catalog-filters">
      <select value={brandFilter} onChange={(e) => changeBrand(e.target.value)} aria-label="Марка">
        <option value="all">Все марки</option>
        {brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
      </select>
      <select value={modelFilter} onChange={(e) => changeModel(e.target.value)} aria-label="Модель">
        <option value="all">Все модели</option>
        {modelOptions.map((model) => <option key={model} value={model}>{model}</option>)}
      </select>
      <select value={sort} onChange={(e) => changeSort(e.target.value as SortOption)} aria-label="Сортировка">
        {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => <option key={key} value={key}>{SORT_LABELS[key]}</option>)}
      </select>
      {(brandFilter !== 'all' || modelFilter !== 'all') && <button className="page-button" onClick={() => { changeBrand('all'); }}>✕ Сбросить марку/модель</button>}
    </div>
    <div className="car-grid-v2">{visibleCars.map((car) => { const brand = englishBrand(car.brand, car.brandZh); const model = englishModel(car.model); return <article className="car-card-v2" key={car.id}><button className="car-visual" onClick={() => setSelectedCar(car)} aria-label={`Открыть ${brand} ${model}`}><img src={car.image} alt={`${brand} ${model}`} /><span className="car-condition">{car.category === 'new' ? 'NEW' : 'VERIFIED'}</span><span className="car-year">{car.year || '—'}</span></button><div className="car-card-content"><p className="car-brand-v2">{brand}</p><h3>{model}</h3><p className="car-trim-v2">{car.engineVolume || 'Engine'} <span>·</span> {car.driveType || 'Drive'} <span>·</span> {car.mileageKm ? `${car.mileageKm.toLocaleString('ru-RU')} km` : 'Mileage on request'}</p><div className="car-card-footer"><div><small>С доставкой до Уссурийска</small><strong>{formatCny(car.priceCny)}</strong></div><button className="card-arrow" onClick={() => setSelectedCar(car)}>↗</button></div></div></article>; })}</div>
    {visibleCars.length === 0 && <div className="empty-state"><h3>Автомобили не найдены</h3><p>Попробуйте выбрать другой фильтр.</p></div>}
    {pageCount > 1 && <div className="pagination-v2"><button className="page-button" disabled={page === 1} onClick={() => { setPage((v) => v - 1); scrollCatalog(); }}>← Назад</button><span><b>{page}</b> / {pageCount}</span><button className="page-button" disabled={page === pageCount} onClick={() => { setPage((v) => v + 1); scrollCatalog(); }}>Вперёд →</button></div>}
  </div>{selectedCar && <CarModal car={selectedCar} onClose={() => setSelectedCar(null)} />}</section>;
}
