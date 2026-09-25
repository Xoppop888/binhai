# BINHAI AUTO - Импорт автомобилей из Китая

Современный веб-сайт для компании BINHAI AUTO (滨海国际汽车) - комплексного поставщика услуг по экспорту автомобилей из Китая.

## 🚀 Возможности

- **Каталог автомобилей** - реальные объявления с сайта-источника bhgjauto.com (фото-галерея, характеристики, описание комплектации)
- **Supabase интеграция** - данные хранятся в облачной базе данных
- **Автоматический парсер** - обновление данных каждые 1-6 часов
- **Кэширование** - ускорение загрузки через localStorage
- **Многоязычность** - поддержка русского и китайского языков
- **Адаптивный дизайн** - оптимизирован для мобильных устройств
- **Премиальный UI** - современный дизайн с анимациями и glassmorphism
- **Админ-панель** (`/admin`) - вход по email/паролю (Supabase Auth), просмотр,
  редактирование и удаление автомобилей, ручное добавление карточки
- **Кнопки связи** - плавающий виджет с Telegram, WhatsApp и WeChat (QR-код)

## 🎨 Дизайн

- **Цветовая схема**: Сине-белая (как на оригинальном сайте BINHAI AUTO)
- **Типографика**: Montserrat, Manrope, JetBrains Mono
- **Стиль**: Минималистичный, премиальный, автомобильная эстетика

## 📦 Технологии

- **Frontend**: React 18 + TypeScript
- **Сборка**: Vite
- **Стили**: Tailwind CSS v4
- **База данных**: Supabase (PostgreSQL)
- **Парсер**: Node.js скрипт
- **Хостинг**: Vercel / Netlify / любой статический хостинг

## 🛠️ Установка

### 1. Клонирование и установка зависимостей

```bash
git clone <repository-url>
cd binhai-auto
npm install
```

### 2. Настройка Supabase

Следуйте подробной инструкции в [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

Кратко:
1. Создайте проект в Supabase
2. Выполните SQL-скрипт из `supabase/schema.sql`
3. Получите API ключи
4. Создайте файл `.env`:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Запуск парсера

Парсер обходит настоящий сайт-источник bhgjauto.com (листинги + карточки
авто) и вытаскивает для каждой машины всю фото-галерею, характеристики
и описание комплектации.

```bash
cd scripts
npm install
npm run install-browser   # один раз: скачивает headless Chromium для Playwright
cp .env.example .env      # Windows cmd.exe: copy .env.example .env
# Отредактируйте .env, добавьте ваши Supabase ключи

npm run parse:dry   # быстрая проверка: 5 карточек, без записи в базу
npm run parse        # полный прогон с записью в Supabase
```

### 4. Запуск dev-сервера

```bash
npm run dev
```

### 5. Сборка для продакшена

```bash
npm run build
```

## 📊 Архитектура

```
┌───────────────────┐
│  bhgjauto.com     │ (сайт-источник, Китай)
│  ershouche.html / │
│  xinche.html +    │
│  Products-Details │
└─────────┬─────────┘
          │
          │ 1. Playwright: обход пагинации листингов → список карточек
          │ 2. axios+cheerio: парсинг каждой карточки (фото, характеристики,
          │    описание комплектации)
          ▼
┌─────────────────┐
│  Parser Script  │ (Node.js)
│  scripts/       │
│  parse-to-      │
│  supabase.js    │
└────────┬────────┘
         │
         │ UPSERT
         ▼
┌─────────────────┐
│   Supabase      │ (PostgreSQL)
│   cars table    │
└────────┬────────┘
         │
         │ REST API (SELECT)
         ▼
┌─────────────────┐
│   Frontend      │ (React + Vite)
│   loadCars()    │
└─────────────────┘
```

## 📱 Разделы сайта

1. **Hero** - главный экран с призывом к действию
2. **Каталог** - сетка автомобилей с фильтрами и поиском
3. **Услуги** - 5 услуг полного цикла (一站式全流程托管)
4. **Преимущества** - 4 ключевых преимущества
5. **Этапы работы** - 5 шагов от заявки до получения авто
6. **О компании** - информация о BINHAI AUTO
7. **FAQ** - частые вопросы и ответы
8. **CTA** - призыв к действию
9. **Footer** - контакты и юридическая информация

## 🎯 Ключевые особенности

### Валюта
- Цены отображаются **только в китайских юанях (¥)**
- Конвертация в рубли через Telegram-бот (@binhai_bot)
- Это решает проблему нестабильного курса и генерирует лиды

### Лидогенерация
- Кнопка "Рассчитать стоимость в ₽" на каждой карточке
- Модальное окно с формой заявки
- Интеграция с Telegram-ботом

### Данные
- Реальные объявления с bhgjauto.com: подержанные и новые автомобили
- Для каждой машины: полная фото-галерея, цена, характеристики
  (VIN/номер кузова, цвет, привод, пробег, объём двигателя, дата
  выпуска, состояние, страховка ОСАГО), текст комплектации и ссылка
  на исходную карточку
- Автоматическая синхронизация по расписанию (см. раздел "Автоматизация парсера")
- Кэширование в localStorage для ускорения

### Fallback механизм
Если Supabase недоступен:
1. Используется кэш из localStorage
2. Используются статические данные (3 машины)

## 🔐 Админ-панель

Доступна по адресу `/admin` (например `https://ваш-сайт.ru/admin`).

### Как создать администратора

Самостоятельной регистрации нет — это сделано намеренно, чтобы посторонние
не могли создать себе доступ. Добавьте пользователя вручную:

1. Supabase Dashboard → **Authentication** → **Users** → **Add user**
2. Укажите email и пароль (или включите magic link — на ваш вкус)
3. Выполните `supabase/migration_003_admin_rls.sql` в SQL Editor —
   он разрешает публичному ключу только чтение, а редактирование/удаление —
   только вошедшим через Supabase Auth (для новых проектов это уже
   включено в `supabase/schema.sql`)

### Что умеет

- Таблица всех автомобилей с поиском по бренду/модели
- Инлайн-редактирование: бренд, модель, год, комплектация, цена,
  пробег, категория (новый/подержанный)
- Удаление карточки
- Ручное добавление автомобиля (для машин, которых нет на сайте-источнике)

Массовая загрузка/обновление данных с bhgjauto.com по-прежнему делается
скриптом `scripts/parse-to-supabase.js` — админ-панель для точечных правок,
а не для замены парсера.

### SPA-роутинг на хостинге

Поскольку `/admin` — это клиентский маршрут (react-router), при прямом
заходе по ссылке или обновлении страницы хостинг должен отдавать
`index.html`. Для этого уже добавлены `vercel.json` (Vercel) и
`public/_redirects` (Netlify) — просто задеплойте проект как обычно.

## 💬 Кнопки связи (Telegram / WhatsApp / WeChat)

В правом нижнем углу сайта — плавающая кнопка, при клике раскрывающая
три канала связи (`src/components/ContactWidget.tsx`):

- **Telegram** — открывает `https://t.me/binhai_bot`
- **WhatsApp** — открывает чат `wa.me` с номером +86 158 4019 9999
- **WeChat** — у WeChat нет универсальной deep-ссылки, поэтому по клику
  показывается QR-код и ID (`13766611716`) с кнопкой "Копировать"

Чтобы поменять контакты, отредактируйте константы в начале файла
`ContactWidget.tsx` (`TELEGRAM_URL`, `WHATSAPP_PHONE`, `WECHAT_ID`).

## 🔄 Автоматизация парсера

### Cron job (Linux/Mac)

```bash
# Запуск каждые 3 часа
0 */3 * * * cd /path/to/project/scripts && /usr/bin/node parse-to-supabase.js >> /var/log/binhai-parser.log 2>&1
```

### GitHub Actions

Создайте `.github/workflows/parse.yml`:

```yaml
name: Parse BINHAI Cars
on:
  schedule:
    - cron: '0 */3 * * *'
  workflow_dispatch:

jobs:
  parse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install and run
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: |
          cd scripts
          npm install
          npm run parse
```

## 🚀 Деплой

### Vercel

```bash
npm i -g vercel
vercel
```

Добавьте переменные окружения:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Netlify

```bash
npm run build
# Загрузите папку dist/ в Netlify
```

### Docker

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
```

## 📚 Документация

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Полная инструкция по настройке Supabase
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Документация API
- **[PARSER_DOCUMENTATION.md](./PARSER_DOCUMENTATION.md)** - Документация парсера

## 📞 Контакты BINHAI AUTO

- **Компания**: 黑龙江滨海国际汽车进出口有限公司
- **Слоган**: 宾客溢四海，贸易连全球 (Гости со всего мира — торговля по всему миру)
- **WhatsApp**: +7 914 070-80-06
- **WeChat**: Arkady_lee
- **Email**: binhaiexport@gmail.com
- **Telegram**: @binhaiauto_ru

## 📄 Лицензия

Проект создан для BINHAI AUTO. Все права на контент и изображения принадлежат компании.

## 🤝 Поддержка

При возникновении вопросов:
- **Email**: 576909777@qq.com
- **Telegram**: @binhai_bot
- **WhatsApp**: +86 158 4019 9999

---

**Создано с ❤️ для BINHAI AUTO**
