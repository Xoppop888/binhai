export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">BINHAI AUTO</h1>
            <span className="ml-2 text-sm text-slate-500">滨海国际汽车</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#catalog" className="text-slate-700 hover:text-blue-600 transition-colors">
              Каталог
            </a>
            <a href="#about" className="text-slate-700 hover:text-blue-600 transition-colors">
              О нас
            </a>
            <a href="#contacts" className="text-slate-700 hover:text-blue-600 transition-colors">
              Контакты
            </a>
          </nav>
          <a
            href="https://t.me/binhai_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Telegram
          </a>
        </div>
      </div>
    </header>
  );
}
