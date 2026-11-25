#!/usr/bin/env node
// readme-gen: genera un README en español a partir de la estructura real del proyecto.
const fs = require("fs");
const path = require("path");
const { listFiles, readText, readJson, assertDir } = require("../lib/repo");
const apiDocs = require("../api-docs");

const TECH = {
  "@angular/core": "Angular", react: "React", vue: "Vue", svelte: "Svelte", next: "Next.js",
  express: "Express", fastify: "Fastify", mongoose: "MongoDB (Mongoose)", pg: "PostgreSQL",
  mysql2: "MySQL", sequelize: "Sequelize", prisma: "Prisma", jsonwebtoken: "JWT",
  bcryptjs: "bcryptjs", bcrypt: "bcrypt", typescript: "TypeScript", tailwindcss: "Tailwind CSS",
  bootstrap: "Bootstrap", jest: "Jest", vitest: "Vitest",
};

function findPackages(root, files) {
  return files
    .filter((f) => /(^|\/)package\.json$/.test(f))
    .map((f) => ({ dir: path.posix.dirname(f), json: readJson(root, f) }))
    .filter((p) => p.json)
    .sort((a, b) => a.dir.length - b.dir.length);
}

function techOf(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return Object.keys(TECH).filter((k) => deps[k]).map((k) => TECH[k]);
}

function tree(root, files, depth = 2) {
  const seen = new Set();
  for (const f of files) {
    const parts = f.split("/");
    for (let i = 1; i <= Math.min(parts.length, depth); i++) {
      seen.add(parts.slice(0, i).join("/") + (i < parts.length ? "/" : ""));
    }
  }
  return [...seen].sort().map((p) => `${"  ".repeat(p.replace(/\/$/, "").split("/").length - 1)}${path.posix.basename(p.replace(/\/$/, ""))}${p.endsWith("/") ? "/" : ""}`);
}

function envVars(root, files) {
  const out = [];
  for (const f of files.filter((x) => /\.env\.(example|sample)$/.test(x))) {
    for (const line of (readText(root, f) || "").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
      if (m) out.push({ name: m[1], file: f });
    }
  }
  return out;
}

function generate(target) {
  const root = assertDir(target);
  const files = listFiles(root);
  const packages = findPackages(root, files);
  const rootPkg = packages.find((p) => p.dir === ".") || null;
  const title = (rootPkg && rootPkg.json.name) || path.basename(root);
  const description = (rootPkg && rootPkg.json.description) || "";
  const allTech = [...new Set(packages.flatMap((p) => techOf(p.json)))];
  const api = apiDocs.extract(root);
  const vars = envVars(root, files);

  const L = [`# ${title}`, ""];
  L.push(description || "_Agrega aquí una descripción de una o dos frases: qué problema resuelve y para quién._", "");

  if (allTech.length) L.push("## Tecnologías", "", ...allTech.map((t) => `- ${t}`), "");

  L.push("## Estructura", "", "```", ...tree(root, files), "```", "");

  L.push("## Instalación", "");
  const runnable = packages.filter((p) => p.json.scripts && Object.keys(p.json.scripts).length);
  if (!runnable.length) L.push("Clona el repositorio y revisa los archivos de cada carpeta.", "");
  for (const p of runnable) {
    const label = p.dir === "." ? "Proyecto" : p.dir;
    const scripts = Object.keys(p.json.scripts);
    L.push(`### ${label}`, "", "```bash", ...(p.dir === "." ? [] : [`cd ${p.dir}`]), "npm install", ...scripts.slice(0, 3).map((s) => `npm run ${s}`), "```", "");
  }

  if (vars.length) {
    L.push("## Variables de entorno", "", "Copia el archivo `.env.example` a `.env` y completa los valores. No subas el `.env` a Git.", "", "| Variable | Definida en |", "|---|---|");
    for (const v of vars) L.push(`| \`${v.name}\` | \`${v.file}\` |`);
    L.push("");
  }

  if (api.endpoints.length) {
    L.push("## API", "", "| Método | Ruta | Autenticación |", "|---|---|---|");
    for (const e of api.endpoints) L.push(`| ${e.method} | \`${e.path}\` | ${e.auth ? "Sí" : "No"} |`);
    L.push("");
  }

  const hasLicense = files.some((f) => /^license(\.\w+)?$/i.test(f));
  L.push("## Licencia", "", hasLicense ? "Consulta el archivo LICENSE." : "_Define una licencia (por ejemplo MIT) y agrégala como LICENSE._", "");
  return L.join("\n");
}

function main(argv) {
  const args = argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Uso: node tools/readme-gen/index.js [carpeta] [--out archivo.md]");
    return 0;
  }
  const outIdx = args.indexOf("--out");
  const outFile = outIdx !== -1 ? args[outIdx + 1] : null;
  const target = args.find((a, i) => !a.startsWith("--") && (outIdx === -1 || i !== outIdx + 1)) || ".";
  try {
    const md = generate(target);
    if (outFile) {
      fs.writeFileSync(outFile, md + "\n");
      console.log(`README escrito en ${outFile}`);
    } else {
      console.log(md);
    }
    return 0;
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return 2;
  }
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { generate };
