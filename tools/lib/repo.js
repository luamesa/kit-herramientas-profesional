// Utilidades compartidas por las tres herramientas. Solo usa módulos nativos de Node.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const IGNORED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".angular", "coverage", ".next", ".cache", "__pycache__",
]);
const MAX_FILE_BYTES = 1024 * 1024; // 1 MB

/** Devuelve las rutas relativas (con "/") de todos los archivos del proyecto. */
function listFiles(root) {
  const out = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        out.push(path.relative(root, path.join(dir, entry.name)).split(path.sep).join("/"));
      }
    }
  })(root);
  return out.sort();
}

/** Archivos que Git está siguiendo. Devuelve null si la carpeta no es un repo Git. */
function gitTracked(root) {
  try {
    const out = execFileSync("git", ["-C", root, "ls-files", "-z"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return new Set(out.split("\0").filter(Boolean));
  } catch {
    return null;
  }
}

/** Lee un archivo de texto. Devuelve null si es muy grande o parece binario. */
function readText(root, rel) {
  const full = path.join(root, rel);
  try {
    const stat = fs.statSync(full);
    if (stat.size > MAX_FILE_BYTES) return null;
    const buf = fs.readFileSync(full);
    if (buf.includes(0)) return null;
    return buf.toString("utf8");
  } catch {
    return null;
  }
}

function readJson(root, rel) {
  const text = readText(root, rel);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Valida que la ruta exista y sea una carpeta. Lanza un error claro si no. */
function assertDir(target) {
  const abs = path.resolve(target || ".");
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    throw new Error(`No existe la carpeta: ${abs}`);
  }
  return abs;
}

module.exports = { listFiles, gitTracked, readText, readJson, assertDir };
