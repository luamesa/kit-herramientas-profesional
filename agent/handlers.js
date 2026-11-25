// Lógica del agente, separada de Telegram para poder probarla sin red.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const secretAudit = require("../tools/secret-audit");
const apiDocs = require("../tools/api-docs");
const readmeGen = require("../tools/readme-gen");

const run = promisify(execFile);

// Solo se aceptan URLs de GitHub con este formato exacto. Nunca rutas locales.
const GITHUB_URL = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?\/?$/;

const AYUDA = [
  "Soy el agente del Kit de Herramientas Profesional. Comandos:",
  "",
  "/auditar <url de GitHub>  busca secretos expuestos en el repo",
  "/api <url de GitHub>  documenta los endpoints Express",
  "/readme <url de GitHub>  genera un README en español",
  "/resenas  resumen de las reseñas de ReviewHub",
  "/ayuda  muestra este mensaje",
].join("\n");

/** Clona un repo público de GitHub en una carpeta temporal. Devuelve { dir, cleanup }. */
async function cloneRepo(url) {
  const m = GITHUB_URL.exec(url);
  if (!m) throw new Error("Envía una URL con el formato https://github.com/usuario/repositorio");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-agent-"));
  const dest = path.join(dir, m[2]);
  try {
    await run("git", ["clone", "--depth", "1", "--quiet", `https://github.com/${m[1]}/${m[2]}.git`, dest], {
      timeout: 120000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0", GIT_LFS_SKIP_SMUDGE: "1" },
    });
  } catch {
    fs.rmSync(dir, { recursive: true, force: true });
    throw new Error("No pude clonar ese repositorio. Revisa que sea público y que la URL esté bien escrita.");
  }
  return { dir: dest, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

async function withRepo(url, deps, fn) {
  const { dir, cleanup } = await (deps.cloneRepo || cloneRepo)(url);
  try {
    return fn(dir);
  } finally {
    cleanup();
  }
}

async function resenas(deps) {
  const base = (deps.env.REVIEWHUB_API_URL || "").replace(/\/$/, "");
  if (!base) return "Falta configurar REVIEWHUB_API_URL con la dirección de tu API de ReviewHub.";
  const res = await (deps.fetchImpl || fetch)(`${base}/api/reviews`);
  if (!res.ok) throw new Error(`La API respondió con error ${res.status}.`);
  const items = await res.json();
  if (!Array.isArray(items) || !items.length) return "Todavía no hay reseñas.";
  const avg = items.reduce((s, r) => s + (Number(r.calificacion) || 0), 0) / items.length;
  const latest = items.slice(0, 3).map((r) => `- ${r.titulo} (${r.calificacion}/5)`);
  return [`${items.length} reseñas, promedio ${avg.toFixed(1)} de 5.`, "", "Las más recientes:", ...latest].join("\n");
}

/** Procesa un mensaje de texto y devuelve la respuesta. Nunca lanza: los errores se vuelven texto. */
async function handleMessage(text, deps = {}) {
  deps = { env: process.env, ...deps };
  const [cmdRaw, ...rest] = String(text || "").trim().split(/\s+/);
  const cmd = cmdRaw.toLowerCase().replace(/@\w+$/, "");
  const arg = rest[0] || "";
  try {
    switch (cmd) {
      case "/start":
      case "/ayuda":
        return AYUDA;
      case "/auditar":
        if (!arg) return "Indica la URL del repo. Ejemplo: /auditar https://github.com/usuario/repo";
        return await withRepo(arg, deps, (dir) => secretAudit.toMarkdown(secretAudit.audit(dir)));
      case "/api":
        if (!arg) return "Indica la URL del repo. Ejemplo: /api https://github.com/usuario/repo";
        return await withRepo(arg, deps, (dir) => apiDocs.toMarkdown(apiDocs.extract(dir)));
      case "/readme":
        if (!arg) return "Indica la URL del repo. Ejemplo: /readme https://github.com/usuario/repo";
        return await withRepo(arg, deps, (dir) => readmeGen.generate(dir));
      case "/resenas":
        return await resenas(deps);
      default:
        return "No entendí ese mensaje. Escribe /ayuda para ver los comandos.";
    }
  } catch (err) {
    return `No pude completar la tarea: ${err.message}`;
  }
}

/** Revisa la API y devuelve los avisos de reseñas nuevas desde la última revisión. */
async function newReviewNotices(state, deps = {}) {
  const base = ((deps.env || process.env).REVIEWHUB_API_URL || "").replace(/\/$/, "");
  if (!base) return [];
  const res = await (deps.fetchImpl || fetch)(`${base}/api/reviews`);
  if (!res.ok) return [];
  const items = await res.json();
  if (!Array.isArray(items)) return [];
  const ids = new Set(items.map((r) => r._id));
  const fresh = state.seen ? items.filter((r) => !state.seen.has(r._id)) : []; // la primera vez solo memoriza
  state.seen = ids;
  return fresh.map((r) => `Nueva reseña: ${r.titulo} (${r.calificacion}/5)`);
}

module.exports = { handleMessage, newReviewNotices, GITHUB_URL, AYUDA };
