#!/usr/bin/env node
// Agente de Telegram. Usa solo fetch (incluido en Node 18+), sin dependencias.
//
// Variables de entorno:
//   TELEGRAM_BOT_TOKEN         token que entrega @BotFather (obligatorio)
//   TELEGRAM_ALLOWED_CHAT_IDS  ids de chat autorizados, separados por coma (obligatorio)
//   REVIEWHUB_API_URL          dirección de tu API de ReviewHub (opcional)
//   WATCH_MINUTES              cada cuántos minutos revisar reseñas nuevas (por defecto 5)
const { handleMessage, newReviewNotices } = require("./handlers");

const token = process.env.TELEGRAM_BOT_TOKEN;
const allowed = new Set((process.env.TELEGRAM_ALLOWED_CHAT_IDS || "").split(",").map((s) => s.trim()).filter(Boolean));

if (!token) {
  console.error("Falta TELEGRAM_BOT_TOKEN. Crea un bot con @BotFather y copia el token en tu archivo .env.");
  process.exit(1);
}
if (!allowed.size) {
  console.error("Falta TELEGRAM_ALLOWED_CHAT_IDS. Sin esa lista, cualquiera podría usar el bot.");
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

async function send(chatId, text) {
  // Telegram limita cada mensaje a 4096 caracteres.
  for (let i = 0; i < text.length; i += 4000) {
    await api("sendMessage", { chat_id: chatId, text: text.slice(i, i + 4000) });
  }
}

async function poll() {
  let offset = 0;
  console.log("Agente en marcha. Esperando mensajes...");
  for (;;) {
    try {
      const res = await api("getUpdates", { offset, timeout: 30, allowed_updates: ["message"] });
      for (const update of res.result || []) {
        offset = update.update_id + 1;
        const msg = update.message;
        if (!msg || !msg.text) continue;
        if (!allowed.has(String(msg.chat.id))) {
          console.log(`Mensaje ignorado del chat ${msg.chat.id} (no autorizado).`);
          continue;
        }
        await send(msg.chat.id, await handleMessage(msg.text));
      }
    } catch (err) {
      console.error("Error de conexión, reintento en 5 s:", err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

function watchReviews() {
  if (!process.env.REVIEWHUB_API_URL) return;
  const minutes = Number(process.env.WATCH_MINUTES) || 5;
  const state = {};
  const check = async () => {
    try {
      for (const notice of await newReviewNotices(state)) {
        for (const id of allowed) await send(id, notice);
      }
    } catch (err) {
      console.error("No pude revisar las reseñas:", err.message);
    }
  };
  check();
  setInterval(check, minutes * 60 * 1000);
}

watchReviews();
poll();
