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
   - `ADMIN_PASSWORD` — ваш пароль админки (обязательно смените).
   - (опционально) `DATA_FILE` — путь к файлу базы, по умолчанию `keys.json` в корне.
5. После деплоя админка будет по адресу: `https://<ваш-сервис>.onrender.com/admin.html`

> ⚠️ На бесплатном тарифе Render файловая система эфемерная: `keys.json` может сбрасываться при рестарте/деплое. Для постоянного хранения подключите диск Render (Persistent Disk) и задайте `DATA_FILE=/data/keys.json`, либо переделайте хранение на внешнюю БД.

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
