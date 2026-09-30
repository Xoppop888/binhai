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
      // Каталог и контакты независимы: сбой одного не должен стирать другое.
      const [result, contactsResult] = await Promise.allSettled([loadCars(), loadContacts()]);
      if (result.status === 'fulfilled' && result.value.cars.length && result.value.source !== 'fallback') {
        setCars(result.value.cars);
        setSource(result.value.source);
      } else if (result.status === 'rejected') {
        throw result.reason;
      } else if (!cars.length) {
        throw new Error('Каталог временно недоступен');
      }
      if (contactsResult.status === 'fulfilled') setContacts(contactsResult.value);
    } catch {
      // Не очищаем cars: пользователь продолжает видеть последний рабочий каталог.
      setError(cars.length
        ? 'Показываем последний сохранённый каталог. Обновим данные автоматически при следующей попытке.'
        : 'Каталог временно недоступен. Проверьте соединение и повторите попытку.');
    } finally {
      setLoading(false);
    }
  }, [cars.length]);

  useEffect(() => {
    void refreshCatalog();
  }, [refreshCatalog]);

  return <div className="site-shell">
    <Header contacts={contacts} />
    <main>
      <Hero contacts={contacts} />
      {error && <div className="container error-banner">{error} <button className="page-button" onClick={() => void refreshCatalog()}>Повторить</button></div>}
      <Catalog cars={cars} source={source} loading={loading} unavailable={!loading && !cars.length && Boolean(error)} />
      <AboutSection />
      <Footer contacts={contacts} />
    </main>
    <ContactWidget contacts={contacts} />
  </div>;
}
