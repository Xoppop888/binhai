export default function Footer() {
  return (
    <>
      <section className="info-band" id="about">
        <div className="container info-grid">
          <div>
            <p className="section-kicker" style={{ color: '#8edbd4' }}>Почему BINHAI</p>
            <h2>Не просто купить авто.<br />Привезти его правильно.</h2>
            <p>Берём на себя проверку автомобиля, переговоры с продавцом, подготовку документов и логистику. Вы получаете понятный процесс и одного ответственного партнёра.</p>
          </div>
          <div className="info-stat-grid">
            <div className="info-stat"><strong>01</strong><span>Подбор и проверка</span></div>
            <div className="info-stat"><strong>02</strong><span>Сделка и документы</span></div>
            <div className="info-stat"><strong>03</strong><span>Доставка в Россию</span></div>
            <div className="info-stat"><strong>04</strong><span>Поддержка до получения</span></div>
          </div>
        </div>
      </section>
      <footer className="site-footer" id="contacts">
        <div className="container">
          <div className="footer-grid">
            <div><h3>BINHAI AUTO</h3><p>黑龙江滨海国际汽车进出口有限公司</p><p>Международный экспорт автомобилей из Китая для частных клиентов и бизнеса.</p></div>
            <div><h3>Связаться</h3><ul><li><a href="https://t.me/binhai_bot">Telegram: @binhai_bot</a></li><li>WhatsApp: +86 158 4019 9999</li><li>WeChat: 13766611716</li><li><a href="mailto:576909777@qq.com">576909777@qq.com</a></li></ul></div>
            <div><h3>我们的口号</h3><p>宾客溢四海，贸易连全球</p><p>Гости со всего мира — торговля по всему миру</p></div>
          </div>
          <div className="footer-bottom"><span>© 2026 BINHAI AUTO</span><span>Автомобили из Китая под ключ</span></div>
        </div>
      </footer>
    </>
  );
}
