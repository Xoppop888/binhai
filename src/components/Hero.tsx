import { SiteContacts } from '../data/siteSettings';

export default function Hero({ contacts }: { contacts: SiteContacts }) {
  return <section className="hero-v2" id="top"><div className="hero-overlay" /><div className="container hero-v2-inner">
    <div className="hero-copy-v2"><p className="eyebrow">АВТОМОБИЛИ ИЗ КИТАЯ · BINHAI AUTO</p><h1>Автомобиль из Китая.<br /><em>Доставим до Уссурийска.</em></h1><p className="hero-lead">Подбираем, проверяем и организуем доставку автомобилей. Вы видите реальную машину, понятную стоимость и весь путь сделки.</p><div className="hero-actions"><a className="button-primary" href="#catalog">Смотреть каталог <span>↓</span></a><a className="button-ghost" href={contacts.telegram} target="_blank" rel="noreferrer">Получить расчёт <span>↗</span></a></div><div className="hero-proof"><span><b>01</b> Проверенные авто</span><span><b>02</b> Прозрачная цена</span><span><b>03</b> Доставка до Уссурийска</span></div></div>
    <div className="hero-caption"><strong>BINHAI AUTO</strong><span>International vehicle logistics</span></div>
  </div></section>;
}
