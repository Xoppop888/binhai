import { useEffect, useState } from 'react';
import { Car, loadCars } from '../data/cars';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Catalog from '../components/Catalog';
import Footer from '../components/Footer';
import ContactWidget from '../components/ContactWidget';

export default function SitePage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');
  useEffect(() => {
    loadCars().then((result) => { setCars(result.cars); setSource(result.source); }).catch((error) => console.error(error)).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="site-shell"><Header /><main className="section"><div className="container"><p className="section-kicker">BINHAI AUTO</p><h1>Загружаем актуальные автомобили…</h1></div></main></div>;
  return <div className="site-shell"><Header /><main><Hero /><Catalog cars={cars} source={source} /><Footer /></main><ContactWidget /></div>;
}
