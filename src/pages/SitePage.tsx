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
  const [source, setSource] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await loadCars();
        setCars(result.cars);
        setSource(result.source);
        console.log(`✅ Загружено ${result.cars.length} автомобилей из ${result.source}`);
      } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Загрузка автомобилей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Catalog cars={cars} source={source} />
      <Footer />
      <ContactWidget />
    </div>
  );
}
