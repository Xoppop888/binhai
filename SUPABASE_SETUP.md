# 🚀 Настройка Supabase для BINHAI AUTO — через CLI, с нуля

Эта инструкция — только про Supabase: связать проект, накатить схему,
получить ключи, всё из командной строки. Про GitHub Actions
(автопарсинг) и деплой сайта — см. README.md.

## Шаг 1: Проект уже создан?

Если проект в Supabase уже создан через дашборд (New Project → имя,
пароль, регион) — переходите к шагу 2. Если ещё нет — сначала
supabase.com → New Project, сохраните пароль базы, дождитесь
поднятия проекта (1-2 минуты).

## Шаг 2: Установить Supabase CLI

Официально npm-пакет глобально ставить не рекомендуют — используйте
локально через `npx`, либо системный менеджер пакетов:

```bash
# вариант 1: как dev-зависимость проекта (работает везде, где есть Node)
npm install supabase --save-dev
npx supabase --version

# вариант 2 (Linux/macOS): через Homebrew
brew install supabase/tap/supabase

# вариант 3 (Windows): через Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

Дальше все команды даю через `npx supabase ...` — если ставили через
brew/scoop, просто уберите `npx `.

## Шаг 3: Войти и привязать проект

```bash
npx supabase login
```

Откроется браузер, войдите в свой аккаунт Supabase — CLI сохранит
токен локально. Если браузера нет под рукой (сервер/CI): создайте
токен на https://supabase.com/dashboard/account/tokens и войдите так:

```bash
npx supabase login --token sbp_ваш_токен
```

Теперь свяжите папку проекта с вашим Supabase-проектом. `<project-ref>`
— это часть URL в дашборде: `https://supabase.com/dashboard/project/<project-ref>`.

```bash
npx supabase init            # создаст supabase/config.toml; ваши schema.sql/migration_*.sql не тронет
npx supabase link --project-ref <project-ref>
# спросит пароль от базы данных — тот, что задавали при создании проекта
```

## Шаг 4: Применить схему через миграцию

CLI работает с папкой `supabase/migrations/`, а не с произвольными
`.sql`-файлами напрямую. Для нового проекта достаточно одной
миграции — всё содержимое уже готового `schema.sql`:

Команда `npx supabase migration new init_schema` создаст файл с
именем вида `supabase/migrations/20260917123456_init_schema.sql`
(число впереди — таймштамп, у вас будет своё). В него нужно
скопировать содержимое `supabase/schema.sql` — способ копирования
зависит от терминала:

```bash
# macOS / Linux / Git Bash
cat supabase/schema.sql > supabase/migrations/*_init_schema.sql
```

```cmd
:: Windows cmd.exe — сначала посмотрите точное имя файла:
dir supabase\migrations
:: подставьте его вместо TIMESTAMP:
copy /Y supabase\schema.sql supabase\migrations\TIMESTAMP_init_schema.sql
```

```powershell
# Windows PowerShell — найдёт файл сам, имя вводить не нужно
Copy-Item supabase\schema.sql (Get-ChildItem supabase\migrations\*_init_schema.sql).FullName -Force
```

Затем в любом терминале:

```
npx supabase db push
```

`db push` применит миграцию к реальной (remote) базе и заведёт
служебную таблицу учёта миграций — при повторных запусках уже
применённые миграции пропускаются.

Это создаст: таблицу `cars` со всеми полями (галерея фото,
характеристики, описание, VIN, пробег и т.д.), индексы, триггер
`updated_at` и политики RLS (читать может кто угодно, писать/удалять —
только авторизованные пользователи и парсер через service_role).

> `migration_002_media.sql` и `migration_003_admin_rls.sql` — только
> для случая, когда таблица `cars` уже существовала по старой схеме
> (обновление задним числом). Для нового проекта их применять не
> нужно — всё, что в них есть, уже включено в `schema.sql`.

Проверить:

```bash
npx supabase migration list   # список применённых миграций
```

Заглянуть в саму таблицу проще всего через **Table Editor** в дашборде
(должна появиться таблица `cars`, 0 строк) — либо через `psql`, если
он у вас установлен: строку подключения возьмите в **Settings →
Database → Connection string**:

```bash
psql "postgresql://postgres:<пароль>@db.<project-ref>.supabase.co:5432/postgres" -c "select count(*) from cars;"
```

## Шаг 5: Получить ключи API

```bash
npx supabase projects api-keys --project-ref <project-ref>
```

Выведет таблицу ключей. Имейте в виду: Supabase в 2026 году переводит
проекты с ключей `anon`/`service_role` на новые `publishable`
(`sb_publishable_...`) и `secret` (`sb_secret_...`) — в новых проектах
CLI может показать именно их. Для наших `.env`-переменных это не
принципиально: публичный ключ (anon/publishable) идёт в
`VITE_SUPABASE_ANON_KEY`, секретный (service_role/secret) — в
`SUPABASE_SERVICE_KEY`, `@supabase/supabase-js` понимает оба формата.

Если что-то в CLI не заладилось — тот же результат даёт
**Settings → API** в дашборде.

⚠️ Секретный ключ (`service_role`/`secret`) обходит все RLS-политики.
Никогда не кладите его во фронтенд, в git-коммит или куда-либо кроме
`scripts/.env` (локально, он в `.gitignore`) и GitHub Secrets.

## Шаг 6: Переменные окружения

**Корень проекта** — `.env` (для сайта, `npm run dev` / деплой):
```bash
cp .env.example .env          # macOS/Linux/PowerShell
```
```cmd
copy .env.example .env        :: Windows cmd.exe
```
```
VITE_SUPABASE_URL=https://ваш-проект.supabase.co
VITE_SUPABASE_ANON_KEY=<публичный ключ>
```

**scripts/.env** (для парсера, только локально):
```bash
cd scripts
cp .env.example .env          # macOS/Linux/PowerShell
```
```cmd
cd scripts
copy .env.example .env        :: Windows cmd.exe
```
```
SUPABASE_URL=https://ваш-проект.supabase.co
SUPABASE_SERVICE_KEY=<секретный ключ>
```

## Шаг 7: Первый запуск парсера (локально)

```bash
cd scripts
npm install
npm run install-browser   # один раз: ставит headless Chromium

npm run parse:dry          # проверка на 5 карточках, без записи в базу
```

Если в консоли видно что-то вроде `OK — 7 фото` для нескольких машин —
парсер работает. Дальше пишем по-настоящему:

```bash
npm run parse
```

Он обойдёт весь сайт bhgjauto.com (подержанные + новые) и запишет все
найденные карточки в Supabase. Сколько именно машин найдётся — зависит
от текущего наполнения сайта-источника, это нормально меняется со
временем.

Проверка: **Table Editor → cars** в дашборде — должны появиться
строки с заполненными `images`, `specs`, `description` (или тем же
`psql`-запросом, что и выше, но теперь count будет больше нуля).

## Шаг 8: Создать администратора сайта

Для входа в `/admin` регистрации нет — пользователей заводите вручную:

**Authentication → Users → Add user** → укажите email и пароль.

Дальше — GitHub, автопарсинг по расписанию и деплой сайта: см. README.md.

## 🔐 Безопасность — коротко

- Публичный ключ (`anon`/`publishable`) — можно спокойно класть в
  переменные окружения хостинга, он ограничен политиками RLS
- Секретный ключ (`service_role`/`secret`) — только `scripts/.env`
  (локально) и GitHub Secrets, никогда в код или во фронтенд
- Оба `.env` файла уже в `.gitignore` — перед первым коммитом в git
  выполните `git status` и убедитесь, что они не попали в staged-файлы

## 🐛 Возможные проблемы

**`supabase link` просит пароль, а я его не помню** — Dashboard →
Project Settings → Database → Reset database password.

**Парсер ничего не находит / 0 карточек** — сайт-источник мог поменять
структуру страниц или временно недоступен. Проверьте вручную, открывается
ли `https://www.bhgjauto.com/ershouche.html` в браузере.

**Ошибка RLS при сохранении в админке** ("new row violates row-level
security policy") — миграция применилась не полностью. Проверьте в
**Database → Policies**, что для `cars` есть политики `cars_admin_insert`,
`cars_admin_update`, `cars_admin_delete` для роли `authenticated`.

**Сайт не видит данные** — проверьте, что в `.env` (не `scripts/.env`!)
стоит публичный ключ, а не секретный по ошибке, и что переменные
добавлены в настройках хостинга (Vercel/Netlify), а не только локально.
