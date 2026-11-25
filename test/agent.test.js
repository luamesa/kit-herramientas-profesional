const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { handleMessage, newReviewNotices, GITHUB_URL } = require("../agent/handlers");

const fakeFetch = (items, ok = true, status = 200) => async () => ({ ok, status, json: async () => items });

test("/ayuda y /start listan los comandos", async () => {
  assert.match(await handleMessage("/ayuda"), /\/auditar/);
  assert.match(await handleMessage("/start"), /\/resenas/);
});

test("un mensaje desconocido remite a /ayuda", async () => {
  assert.match(await handleMessage("hola"), /\/ayuda/);
});

test("solo se aceptan URLs de GitHub, nunca rutas locales", async () => {
  assert.ok(GITHUB_URL.test("https://github.com/luamesa/FINALDW"));
  assert.ok(!GITHUB_URL.test("/etc/passwd"));
  assert.ok(!GITHUB_URL.test("https://evil.example/luamesa/x"));
  assert.ok(!GITHUB_URL.test("https://github.com/a/b; rm -rf /"));
  const reply = await handleMessage("/auditar /etc");
  assert.match(reply, /No pude completar la tarea/);
});

test("/auditar pide la URL cuando falta", async () => {
  assert.match(await handleMessage("/auditar"), /Indica la URL/);
});

test("/auditar usa el repo clonado y limpia la carpeta temporal", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kit-agent-test-"));
  fs.writeFileSync(path.join(tmp, "app.js"), "console.log('ok');\n");
  let cleaned = false;
  const cloneRepo = async () => ({ dir: tmp, cleanup: () => { cleaned = true; } });
  const reply = await handleMessage("/auditar https://github.com/luamesa/demo", { cloneRepo });
  assert.match(reply, /Auditoría de secretos/);
  assert.ok(cleaned);
});

test("/resenas calcula el promedio y muestra las más recientes", async () => {
  const items = [
    { _id: "1", titulo: "Muy útil", calificacion: 5 },
    { _id: "2", titulo: "Regular", calificacion: 3 },
  ];
  const reply = await handleMessage("/resenas", { env: { REVIEWHUB_API_URL: "http://x" }, fetchImpl: fakeFetch(items) });
  assert.match(reply, /2 reseñas, promedio 4\.0 de 5/);
  assert.match(reply, /Muy útil/);
});

test("/resenas explica qué falta si no hay URL configurada", async () => {
  assert.match(await handleMessage("/resenas", { env: {} }), /REVIEWHUB_API_URL/);
});

test("/resenas traduce un error de la API en un mensaje legible", async () => {
  const reply = await handleMessage("/resenas", { env: { REVIEWHUB_API_URL: "http://x" }, fetchImpl: fakeFetch([], false, 500) });
  assert.match(reply, /error 500/);
});

test("el vigilante avisa solo de reseñas nuevas, no de las que ya existían", async () => {
  const state = {};
  const env = { REVIEWHUB_API_URL: "http://x" };
  const first = await newReviewNotices(state, { env, fetchImpl: fakeFetch([{ _id: "1", titulo: "A", calificacion: 4 }]) });
  assert.deepEqual(first, []);
  const second = await newReviewNotices(state, {
    env,
    fetchImpl: fakeFetch([{ _id: "2", titulo: "B", calificacion: 5 }, { _id: "1", titulo: "A", calificacion: 4 }]),
  });
  assert.deepEqual(second, ["Nueva reseña: B (5/5)"]);
});
