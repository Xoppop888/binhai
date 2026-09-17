# 🚀 Быстрый старт

Подробная инструкция по Supabase (создание проекта, схема через CLI,
ключи, первый запуск парсера) — в **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**.

Про GitHub (репозиторий, секреты, автопарсинг по расписанию) и деплой
сайта (Vercel/Netlify, админ-панель) — в **[README.md](./README.md)**.

Коротко, если Supabase уже настроен:

```bash
# фронтенд
npm install
cp .env.example .env   # заполнить VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev             # http://localhost:3000

# парсер (в отдельном терминале)
cd scripts
npm install
npm run install-browser
cp .env.example .env    # заполнить SUPABASE_URL / SUPABASE_SERVICE_KEY
npm run parse
```
