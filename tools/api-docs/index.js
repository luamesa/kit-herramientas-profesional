#!/usr/bin/env node
// api-docs: lee un backend Express y genera la documentación de sus endpoints.
const path = require("path");
const { listFiles, readText, assertDir } = require("../lib/repo");

const METHODS = "get|post|put|patch|delete";
const AUTH_NAME = /auth|protect|verify|jwt|token|guard|session/i;

/** Busca `app.use("/prefijo", require("./routes/x"))` y variantes con variable. */
function findMounts(root, files) {
  const mounts = []; // { prefix, routeFile (nombre sin extensión) }
  for (const rel of files.filter((f) => /\.(js|ts|mjs|cjs)$/.test(f))) {
    const text = readText(root, rel);
    if (!text || !/\.use\(/.test(text)) continue;

    const vars = {}; // variable -> nombre del archivo de rutas
    const varRe = /(?:const|let|var)\s+(\w+)\s*=\s*require\(\s*["'`]\.{1,2}\/(?:[\w-]+\/)*([\w.-]+?)(?:\.js)?["'`]\s*\)/g;
    let m;
    while ((m = varRe.exec(text))) vars[m[1]] = m[2];

    const inlineRe = /\.use\(\s*["'`]([^"'`]+)["'`]\s*,\s*require\(\s*["'`]\.{1,2}\/(?:[\w-]+\/)*([\w.-]+?)(?:\.js)?["'`]\s*\)\s*\)/g;
    while ((m = inlineRe.exec(text))) mounts.push({ prefix: m[1], routeFile: m[2] });

    const varUseRe = /\.use\(\s*["'`]([^"'`]+)["'`]\s*,\s*(\w+)\s*\)/g;
    while ((m = varUseRe.exec(text))) {
      if (vars[m[2]]) mounts.push({ prefix: m[1], routeFile: vars[m[2]] });
    }
  }
  return mounts;
}

/** Devuelve el cuerpo de la función `name` dentro de un archivo de controladores. */
function handlerBody(text, name) {
  const re = new RegExp(`(?:exports\\.${name}|(?:const|let|var)\\s+${name})\\s*=`);
  const start = text.search(re);
  if (start === -1) return null;
  const rest = text.slice(start + 1);
  const next = rest.search(/\n(?:exports\.\w+|(?:const|let|var)\s+\w+)\s*=/);
  return next === -1 ? rest : rest.slice(0, next);
}

function bodyFields(body) {
  if (!body) return [];
  const fields = new Set();
  let m;
  const destructure = /(?:const|let|var)\s*\{([^}]+)\}\s*=\s*req\.body/g;
  while ((m = destructure.exec(body))) {
    m[1].split(",").map((s) => s.split(":")[0].trim()).filter(Boolean).forEach((f) => fields.add(f));
  }
  const direct = /req\.body\.(\w+)/g;
  while ((m = direct.exec(body))) fields.add(m[1]);
  return [...fields];
}

function extract(target) {
  const root = assertDir(target);
  const files = listFiles(root);
  const mounts = findMounts(root, files);
  const controllers = files
    .filter((f) => /controller/i.test(f) && /\.(js|ts)$/.test(f))
    .map((f) => readText(root, f) || "");

  const routeRe = new RegExp(`\\b(?:router|app)\\.(${METHODS})\\(\\s*["'\`]([^"'\`]+)["'\`]\\s*((?:,[^)]*)?)\\)`, "g");
  const endpoints = [];

  for (const rel of files.filter((f) => /\.(js|ts|mjs|cjs)$/.test(f))) {
    const text = readText(root, rel);
    if (!text) continue;
    const base = path.basename(rel).replace(/\.[jt]s$/, "");
    const isRouteFile = /route/i.test(rel) || /Router\(\)/.test(text);
    if (!isRouteFile) continue;
    const mount = mounts.find((x) => x.routeFile === base);
    let m;
    routeRe.lastIndex = 0;
    while ((m = routeRe.exec(text))) {
      const args = m[3].split(",").map((s) => s.trim()).filter(Boolean);
      const handler = args[args.length - 1] || "";
      const middlewares = args.slice(0, -1);
      const body = bodyFields(controllers.map((c) => handlerBody(c, handler)).find(Boolean));
      endpoints.push({
        method: m[1].toUpperCase(),
        path: ((mount ? mount.prefix : "") + (m[2] === "/" ? "" : m[2])) || "/",
        auth: middlewares.some((x) => AUTH_NAME.test(x)),
        handler: handler || "(en línea)",
        body,
        file: rel,
      });
    }
  }
  const order = { GET: 0, POST: 1, PUT: 2, PATCH: 3, DELETE: 4 };
  endpoints.sort((a, b) => a.path.localeCompare(b.path) || order[a.method] - order[b.method]);
  return { root, endpoints, mountsFound: mounts.length };
}

function toMarkdown(result) {
  const name = path.basename(result.root);
  const eps = result.endpoints;
  const lines = [`# API de ${name}`, ""];
  if (!eps.length) {
    lines.push("No se encontraron endpoints de Express en esta carpeta.");
    return lines.join("\n");
  }
  const prot = eps.filter((e) => e.auth).length;
  lines.push(`${eps.length} endpoints: ${eps.length - prot} públicos y ${prot} que exigen autenticación.`, "");
  lines.push("| Método | Ruta | Autenticación | Campos del cuerpo | Función |", "|---|---|---|---|---|");
  for (const e of eps) {
    lines.push(`| ${e.method} | \`${e.path}\` | ${e.auth ? "Sí (Bearer token)" : "No"} | ${e.body.length ? e.body.join(", ") : "-"} | \`${e.handler}\` |`);
  }
  lines.push("", "Las rutas protegidas esperan el encabezado `Authorization: Bearer <token>`.");
  return lines.join("\n");
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Uso: node tools/api-docs/index.js [carpeta-del-backend] [--json]");
    return 0;
  }
  const target = args.find((a) => !a.startsWith("--")) || ".";
  try {
    const result = extract(target);
    console.log(args.includes("--json") ? JSON.stringify(result, null, 2) : toMarkdown(result));
    return 0;
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return 2;
  }
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { extract, toMarkdown };
