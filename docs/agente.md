# Agente de Telegram

Un bot que hace por ti las tres tareas del kit y que te avisa cuando llega una reseña nueva a ReviewHub.

## Comandos

| Comando | Qué hace |
|---|---|
| `/auditar <url>` | Clona el repo de GitHub, ejecuta `secret-audit` y responde con el reporte |
| `/api <url>` | Documenta los endpoints Express del repo |
| `/readme <url>` | Genera un README en español |
| `/resenas` | Cantidad de reseñas, promedio y las tres más recientes |
| `/ayuda` | Lista los comandos |

Además, cada `WATCH_MINUTES` minutos (5 por defecto) revisa la API de ReviewHub y te escribe si hay reseñas nuevas.

## Puesta en marcha

1. En Telegram, abre [@BotFather](https://t.me/BotFather), escribe `/newbot` y copia el token.
2. Obtén tu id de chat: escribe a [@userinfobot](https://t.me/userinfobot).
3. Crea el archivo de configuración:

   ```bash
   cp agent/.env.example agent/.env
   ```

   y completa:

   ```
   TELEGRAM_BOT_TOKEN=el-token-de-botfather
   TELEGRAM_ALLOWED_CHAT_IDS=tu-id-de-chat
   REVIEWHUB_API_URL=https://tu-api.example.com
   ```

4. Inicia el agente (requiere Node 20.6 o superior):

   ```bash
   npm run agent
   ```

El archivo `agent/.env` está en el `.gitignore`. No lo subas a GitHub.

## Seguridad

- **Lista de chats autorizados.** El bot no arranca sin `TELEGRAM_ALLOWED_CHAT_IDS` y ignora a cualquier otro chat.
- **Solo URLs de GitHub.** `/auditar`, `/api` y `/readme` rechazan rutas locales y cualquier dominio distinto de `github.com`, y ejecutan `git` sin shell.
- **Carpetas temporales.** Cada repo se clona con `--depth 1` en una carpeta temporal que se borra al terminar.
- **Sin secretos en las respuestas.** `secret-audit` enmascara los valores.

## Cómo está organizado

- `agent/handlers.js`: la lógica. Recibe texto y devuelve texto, sin depender de Telegram.
- `agent/bot.js`: la conexión con Telegram (long polling con `fetch`).

Esta separación permite probar el agente sin red: `test/agent.test.js` simula los clones de GitHub y la API de reseñas.
