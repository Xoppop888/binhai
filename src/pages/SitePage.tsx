import { useCallback, useEffect, useState } from 'react';
import { Car, loadCars } from '../data/cars';
import { DEFAULT_CONTACTS, loadContacts, SiteContacts } from '../data/siteSettings';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Catalog from '../components/Catalog';
import Footer from '../components/Footer';
import ContactWidget from '../components/ContactWidget';
import AboutSection from '../components/AboutSection';

export default function SitePage() {
  // Не показываем трёхмашинный demo-fallback как настоящий каталог.
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [contacts, setContacts] = useState<SiteContacts>(DEFAULT_CONTACTS);

  const refreshCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [result, siteContacts] = await Promise.all([loadCars(), loadContacts()]);
      if (!result.cars.length || result.source === 'fallback') throw new Error('Полный каталог недоступен');
      setCars(result.cars);
      setSource(result.source);
      setContacts(siteContacts);
    } catch {
      setCars([]);
      setSource('');
      setError('Не удалось загрузить полный каталог. Проверьте соединение и повторите попытку.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  return <div className="site-shell">
    <Header contacts={contacts} />
    <main>
      <Hero contacts={contacts} />
      {error && <div className="container error-banner">{error} <button className="page-button" onClick={() => void refreshCatalog()}>Повторить</button></div>}
      <Catalog cars={cars} source={source} loading={loading} />
      <AboutSection />
      <Footer contacts={contacts} />
    </main>
    <ContactWidget contacts={contacts} />
  </div>;
}
