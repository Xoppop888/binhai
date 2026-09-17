export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-slate-900 mb-6">
            Автомобили из Китая
            <span className="block text-blue-600 mt-2">под ключ</span>
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Гости со всего мира — торговля по всему миру. Комплексный поставщик услуг по экспорту 
            подержанных и новых автомобилей из Китая.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#catalog"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Перейти в каталог
            </a>
            <a
              href="https://t.me/binhai_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
            >
              Рассчитать стоимость в ₽
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
