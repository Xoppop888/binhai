export default function Footer() {
  return (
    <footer id="contacts" className="bg-slate-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">BINHAI AUTO</h3>
            <p className="text-slate-400 mb-4">
              黑龙江滨海国际汽车进出口有限公司
            </p>
            <p className="text-slate-400">
              Хэйлунцзянская международная компания "Бинхай" по импорту и экспорту автомобилей
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Контакты</h3>
            <ul className="space-y-2 text-slate-400">
              <li>📧 Email: 576909777@qq.com</li>
              <li>📱 WhatsApp: +86 158 4019 9999</li>
              <li>💬 WeChat: 13766611716</li>
              <li>✈️ Telegram: @binhai_bot</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Слоган</h3>
            <p className="text-slate-400 mb-2">宾客溢四海，贸易连全球</p>
            <p className="text-slate-400">
              Гости со всего мира — торговля по всему миру
            </p>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
          <p>&copy; 2026 BINHAI AUTO. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
