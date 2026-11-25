#!/usr/bin/env node
// secret-audit: busca secretos expuestos en un proyecto antes de subirlo a GitHub.
// Nunca imprime el valor completo de un secreto: solo una versión enmascarada.
const path = require("path");
const { listFiles, gitTracked, readText, assertDir } = require("../lib/repo");

const SKIP_FILES = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/;
const EXAMPLE_ENV = /\.(example|sample|template)$/i;
const ENV_FILE = /(^|\/)\.env(\.[\w-]+)?$/;

const SECRET_KEYS = /(SECRET|TOKEN|PASSWORD|PASSWD|API_?KEY|PRIVATE_?KEY|MONGO(DB)?_URI|DATABASE_URL)/i;

// Cada regla: nombre, expresión, severidad. El grupo 1 (o 0) es el valor sensible.
const PATTERNS = [
  { name: "URI de MongoDB con usuario y contraseña", re: /(mongodb(?:\+srv)?:\/\/[^\s:@/'"]+:[^\s@/'"]+@[^\s'"]+)/g, severity: "alta" },
  { name: "Clave privada", re: /(-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----)/g, severity: "alta" },
  { name: "Clave de acceso de AWS", re: /\b(AKIA[0-9A-Z]{16})\b/g, severity: "alta" },
  { name: "Token de GitHub", re: /\b(gh[pousr]_[A-Za-z0-9]{36,})\b/g, severity: "alta" },
  { name: "Token de bot de Telegram", re: /\b(\d{8,10}:[A-Za-z0-9_-]{35})\b/g, severity: "alta" },
  {
    name: "Credencial escrita en el código",
    re: /\b(?:password|passwd|secret|api_?key|token)\w*\s*[:=]\s*["'`]([^"'`\s]{8,})["'`]/gi,
    severity: "media",
  },
];

function mask(value) {
  const v = String(value);
  if (v.length <= 6) return "***";
  return `${v.slice(0, 2)}***${v.slice(-1)} (${v.length} caracteres)`;
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

function audit(target) {
  const root = assertDir(target);
  const files = listFiles(root);
  const tracked = gitTracked(root); // null si no es un repo Git
  const findings = [];
  const add = (f) => findings.push(f);

  const isTracked = (rel) => (tracked ? tracked.has(rel) : null);

  // 1. Archivos .env reales
  for (const rel of files.filter((f) => ENV_FILE.test(f) && !EXAMPLE_ENV.test(f))) {
    const t = isTracked(rel);
    const text = readText(root, rel) || "";
    const keys = text
      .split("\n")
      .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)$/))
      .filter((m) => m && SECRET_KEYS.test(m[1]) && m[2].trim() !== "")
      .map((m) => m[1]);
    if (t === true) {
      add({
        severity: "alta",
        rule: "Archivo .env subido a Git",
        file: rel,
        detail: `Git lo está siguiendo${keys.length ? ` y contiene valores para: ${keys.join(", ")}` : ""}. Cualquiera que vea el repo puede leerlo.`,
        fix: `Revoca esas credenciales, ejecuta \`git rm --cached ${rel}\`, agrega \`.env\` al .gitignore y deja solo un .env.example sin valores.`,
      });
    } else if (t === null && keys.length) {
      add({
        severity: "media",
        rule: "Archivo .env con secretos",
        file: rel,
        detail: `No se pudo comprobar si Git lo sigue (la carpeta no es un repo). Contiene: ${keys.join(", ")}.`,
        fix: "Confirma que .env está en el .gitignore antes de hacer commit.",
      });
    }
  }

  // 2. Patrones de secretos en el código y la configuración
  for (const rel of files) {
    if (SKIP_FILES.test(rel) || EXAMPLE_ENV.test(rel) || /\.md$/i.test(rel)) continue;
    const text = readText(root, rel);
    if (!text) continue;
    for (const p of PATTERNS) {
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(text))) {
        add({
          severity: p.severity,
          rule: p.name,
          file: rel,
          line: lineOf(text, m.index),
          detail: `Valor detectado: ${mask(m[1] || m[0])}`,
          fix: "Muévelo a una variable de entorno y rota la credencial si ya estuvo en Git.",
        });
      }
    }
  }

  // 3. console.log que imprime variables sensibles
  const logRe = /console\.\w+\([^)]*process\.env\.(\w+)[^)]*\)/g;
  for (const rel of files.filter((f) => /\.(js|ts|mjs|cjs)$/.test(f))) {
    const text = readText(root, rel);
    if (!text) continue;
    let m;
    while ((m = logRe.exec(text))) {
      if (SECRET_KEYS.test(m[1])) {
        add({
          severity: "alta",
          rule: "Se imprime un secreto en los logs",
          file: rel,
          line: lineOf(text, m.index),
          detail: `console imprime process.env.${m[1]}.`,
          fix: "Borra ese log: los registros del servidor suelen terminar en servicios de terceros.",
        });
      }
    }
    const tokenLog = /console\.\w+\(\s*["'`][^"'`]*(?:TOKEN|JWT)[^"'`]*["'`]\s*,\s*(?:token|jwt)\b/gi;
    while ((m = tokenLog.exec(text))) {
      add({
        severity: "media",
        rule: "Se imprime un token de sesión",
        file: rel,
        line: lineOf(text, m.index),
        detail: "console imprime el token que llegó en la petición.",
        fix: "Borra ese log; un token en los registros permite suplantar al usuario.",
      });
    }
  }

  // 4. .gitignore sin .env
  const gitignores = files.filter((f) => /(^|\/)\.gitignore$/.test(f));
  const hasEnvFiles = files.some((f) => ENV_FILE.test(f) && !EXAMPLE_ENV.test(f));
  const ignoresEnv = gitignores.some((g) => /^\s*\.env\b/m.test(readText(root, g) || ""));
  if (hasEnvFiles && !ignoresEnv) {
    add({
      severity: "media",
      rule: ".gitignore no excluye .env",
      file: gitignores[0] || ".gitignore",
      detail: "Hay archivos .env y ningún .gitignore los excluye.",
      fix: "Agrega una línea `.env` al .gitignore.",
    });
  }

  const order = { alta: 0, media: 1, baja: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity] || a.file.localeCompare(b.file));
  return { root, scanned: files.length, gitRepo: tracked !== null, findings };
}

function toMarkdown(result) {
  const name = path.basename(result.root);
  const { findings } = result;
  const count = (s) => findings.filter((f) => f.severity === s).length;
  const lines = [`# Auditoría de secretos: ${name}`, ""];
  lines.push(`Archivos revisados: ${result.scanned}. Hallazgos: ${findings.length} (${count("alta")} altos, ${count("media")} medios).`, "");
  if (!findings.length) {
    lines.push("No se encontraron secretos expuestos.");
    return lines.join("\n");
  }
  for (const f of findings) {
    const where = f.line ? `${f.file}:${f.line}` : f.file;
    lines.push(`## [${f.severity.toUpperCase()}] ${f.rule}`, `- Dónde: \`${where}\``, `- Qué pasa: ${f.detail}`, `- Cómo arreglarlo: ${f.fix}`, "");
  }
  return lines.join("\n");
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Uso: node tools/secret-audit/index.js [carpeta] [--json]\nSale con código 1 si hay hallazgos de severidad alta.");
    return 0;
  }
  const json = args.includes("--json");
  const target = args.find((a) => !a.startsWith("--")) || ".";
  try {
    const result = audit(target);
    console.log(json ? JSON.stringify(result, null, 2) : toMarkdown(result));
    return result.findings.some((f) => f.severity === "alta") ? 1 : 0;
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return 2;
  }
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { audit, toMarkdown, mask };
