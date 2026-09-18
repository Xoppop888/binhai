import { SiteContacts } from '../data/siteSettings';

export default function Header({ contacts }: { contacts: SiteContacts }) {
  return <header className="site-header"><div className="container header-row">
    <a className="brand" href="#top" aria-label="BINHAI AUTO"><span className="brand-mark">BA</span><span><strong>BINHAI AUTO</strong><small>CHINA → RUSSIA</small></span></a>
    <nav className="nav" aria-label="Основная навигация"><a href="#catalog">Автомобили</a><a href="#about">О нас</a><a href="#process">Как работаем</a><a href="#contacts">Контакты</a></nav>
    <a className="header-cta" href={contacts.telegram} target="_blank" rel="noreferrer">Получить расчёт <span>↗</span></a>
  </div></header>;
}
