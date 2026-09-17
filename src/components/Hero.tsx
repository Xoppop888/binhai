import { CARS } from '../data/cars';

export default function Hero() {
  const heroImage = CARS[0]?.image;

  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div>
          <div className="eyebrow">Импорт автомобилей из Китая</div>
          <h1>Автомобиль,<br /><span>который едет к вам.</span></h1>
          <p className="hero-copy">Подбираем, проверяем и доставляем автомобили из Китая. Прозрачная цена в юанях, живые фотографии и сопровождение до получения машины.</p>
          <div className="hero-actions">
            <a className="button-primary" href="#catalog">Смотреть каталог ↓</a>
            <a className="button-secondary" href="https://t.me/binhai_bot" target="_blank" rel="noreferrer">Рассчитать стоимость ↗</a>
          </div>
          <p className="hero-note">滨海国际汽车 · Гости со всего мира — торговля по всему миру</p>
        </div>
        <div className="hero-art" aria-label="Автомобиль BINHAI AUTO">
          {heroImage && <img className="hero-car" src={heroImage} alt="Автомобиль для импорта из Китая" />}
          <div className="hero-stamp"><strong>10+</strong><span>лет в международной торговле</span></div>
        </div>
      </div>
    </section>
  );
}
