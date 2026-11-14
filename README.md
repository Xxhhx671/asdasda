# forev.ext key server (for Render + GitHub)

Мини-сайт/сервер для генерации и проверки ключей лоадера.

## Возможности
- **Генерация ключей** через админ-страницу `/admin.html` (пароль `ADMIN_PASSWORD`).
- **Проверка ключа** для лоадера: `GET/POST /api/validate` с параметрами `key` и `hwid`.
- **Привязка HWID** при первой успешной активации (повторная активация только с тем же HWID).
- Срок действия (дни) или бессрочные ключи, отзыв ключей.

## Деплой на Render
1. Залейте содержимое этой папки в GitHub-репозиторий.
2. На [Render](https://render.com): **New → Web Service**, подключите репозиторий.
3. Настройки:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. **Environment Variables:**
   - `ADMIN_PASSWORD` — пароль админки (**обязательно смените**, по умолчанию `change-me`).
   - `KEEPALIVE_URL` *(рекомендуется)* — URL для автопинга, чтобы сервис реже засыпал, например `https://<ваш-сервис>.onrender.com/health`.
   - `KEEPALIVE_INTERVAL_MIN` *(опционально)* — интервал автопинга в минутах (по умолчанию `5`).
   - `DATA_FILE` *(опционально)* — путь к файлу базы ключей, по умолчанию `keys.json` в корне (для Persistent Disk укажите, например, `/data/keys.json`).
   - `PORT` — задаётся Render автоматически, вручную указывать не нужно.
5. После деплоя админка будет по адресу: `https://<ваш-сервис>.onrender.com/admin.html`

> ⚠️ На бесплатном тарифе Render файловая система эфемерная: `keys.json` может сбрасываться при рестарте/деплое. Для постоянного хранения подключите диск Render (Persistent Disk) и задайте `DATA_FILE=/data/keys.json`, либо переделайте хранение на внешнюю БД.

## Чтобы сервер не засыпал (Render Free)
- **Встроенный keep-alive:** задайте `KEEPALIVE_URL=https://<ваш-сервис>.onrender.com/health` (и при желании `KEEPALIVE_INTERVAL_MIN=5`). Это пингует сервис, пока он запущен.
- **Важно:** если сервис уже «уснул», сам себя он разбудить не может. Для надёжного пробуждения/поддержания добавьте бесплатный внешний мониторинг (например, [UptimeRobot](https://uptimerobot.com/)) с HTTP-проверкой `https://<ваш-сервис>.onrender.com/health` каждые 5 минут. Это лучший вариант против ошибки «нет связи с сервером» в лоадере.

## API для лоадера
`GET /api/validate?key=FOREV-XXXX-XXXX-XXXX&hwid=<HWID>`

Ответ:
```json
{ "valid": true, "reason": "ok", "expiresAt": null }
```
или `{ "valid": false, "reason": "not_found|revoked|expired|hwid_mismatch|missing_params" }`.

## Локальный запуск
```bash
npm install
set ADMIN_PASSWORD=yourpass   # Windows (PowerShell: $env:ADMIN_PASSWORD="yourpass")
npm start
```
Откройте http://localhost:3000/admin.html
