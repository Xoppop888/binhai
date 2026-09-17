export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-row">
        <a className="brand" href="#top" aria-label="BINHAI AUTO">
          <span className="brand-mark">BA</span>
          <span>
            <span className="brand-text">BINHAI AUTO</span>
            <span className="brand-sub">滨海国际汽车 · China to the world</span>
          </span>
        </a>
        <nav className="nav" aria-label="Основная навигация">
          <a href="#catalog">Автомобили</a>
          <a href="#about">О компании</a>
          <a href="#contacts">Контакты</a>
        </nav>
        <a className="header-cta" href="https://t.me/binhai_bot" target="_blank" rel="noreferrer">Написать в Telegram ↗</a>
      </div>
    </header>
  );
}
