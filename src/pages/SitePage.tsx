import { useEffect, useState } from 'react';
import { Car, loadCars } from '../data/cars';
import { DEFAULT_CONTACTS, loadContacts, SiteContacts } from '../data/siteSettings';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Catalog from '../components/Catalog';
import Footer from '../components/Footer';
import ContactWidget from '../components/ContactWidget';

export default function SitePage() {
  const [cars, setCars] = useState<Car[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [source, setSource] = useState(''); const [contacts, setContacts] = useState<SiteContacts>(DEFAULT_CONTACTS);
  useEffect(() => { let alive = true; Promise.all([loadCars(), loadContacts()]).then(([result, siteContacts]) => { if (!alive) return; setCars(result.cars); setSource(result.source); setContacts(siteContacts); }).catch(() => { if (alive) setError('Не удалось загрузить каталог. Показываем сохранённые данные.'); }).finally(() => alive && setLoading(false)); return () => { alive = false; }; }, []);
  if (loading) return <div className="site-shell"><Header contacts={contacts} /><main className="loading-screen"><div className="loader-ring" /><p>Подготавливаем каталог BINHAI AUTO</p></main></div>;
  return <div className="site-shell"><Header contacts={contacts} /><main><Hero contacts={contacts} />{error && <div className="container error-banner">{error}</div>}<Catalog cars={cars} source={source} /><Footer contacts={contacts} /></main><ContactWidget contacts={contacts} /></div>;
}
