import { useEffect, useState } from 'react';
import { Car, CARS, loadCars } from '../data/cars';
import { DEFAULT_CONTACTS, loadContacts, SiteContacts } from '../data/siteSettings';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Catalog from '../components/Catalog';
import Footer from '../components/Footer';
import ContactWidget from '../components/ContactWidget';
import AboutSection from '../components/AboutSection';

export default function SitePage() {
  // A complete snapshot renders first. Fresh catalog and contact details arrive in
  // the background, so a slow mobile network never leaves visitors on a white loader.
  const [cars, setCars] = useState<Car[]>(CARS);
  const [error, setError] = useState('');
  const [source, setSource] = useState('fallback');
  const [contacts, setContacts] = useState<SiteContacts>(DEFAULT_CONTACTS);

  useEffect(() => {
    let alive = true;

    Promise.all([loadCars(), loadContacts()])
      .then(([result, siteContacts]) => {
        if (!alive) return;
        setCars(result.cars);
        setSource(result.source);
        setContacts(siteContacts);
      })
      .catch(() => {
        if (alive) setError('Не удалось обновить каталог. Показываем сохранённые данные.');
      });

    return () => {
      alive = false;
    };
  }, []);

  return <div className="site-shell"><Header contacts={contacts} /><main><Hero contacts={contacts} />{error && <div className="container error-banner">{error}</div>}<Catalog cars={cars} source={source} /><AboutSection /><Footer contacts={contacts} /></main><ContactWidget contacts={contacts} /></div>;
}
