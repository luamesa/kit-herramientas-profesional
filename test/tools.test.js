const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const secretAudit = require("../tools/secret-audit");
const apiDocs = require("../tools/api-docs");
const readmeGen = require("../tools/readme-gen");

// Construye un backend Express de ejemplo. Los "secretos" se arman en tiempo de ejecución
// para que este archivo no dispare alertas de escáneres de secretos.
function makeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-test-"));
  const w = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  };
  const fakeUri = ["mongodb+srv://", "user", ":", "p4ssw0rd123", "@cluster.example.net/db"].join("");
  w("backend/.env", `MONGO_URI=${fakeUri}\nJWT_SECRET=supersecretvalue\n`);
  w("backend/.env.example", "MONGO_URI=\nJWT_SECRET=\n");
  w("backend/index.js", `const express = require("express");
const app = express();
app.use("/api/items", require("./routes/itemRoutes"));
`);
  w("backend/routes/itemRoutes.js", `const router = require("express").Router();
const auth = require("../middlewares/auth");
const { list, create } = require("../controllers/itemController");
router.get("/", list);
router.post("/", auth, create);
module.exports = router;
`);
  w("backend/controllers/itemController.js", `exports.list = async (req, res) => res.json([]);
exports.create = async (req, res) => {
  const { name, price } = req.body;
  res.json({ name, price });
};
`);
  const badLog = ["console.log(", '"SECRETO:", ', "process.env.", "JWT_SECRET", ");"].join("");
  w("backend/middlewares/auth.js", `module.exports = (req, res, next) => {
  ${badLog}
  next();
};
`);
  w("backend/package.json", JSON.stringify({ name: "demo-backend", scripts: { dev: "node index.js" }, dependencies: { express: "^5.0.0" } }));
  execFileSync("git", ["init", "-q", dir]);
  execFileSync("git", ["-C", dir, "add", "-A", "-f"]);
  return { dir, fakeUri };
}

test("secret-audit detecta .env versionado, URI con credenciales y logs de secretos", () => {
  const { dir } = makeFixture();
  const result = secretAudit.audit(dir);
  const rules = result.findings.map((f) => f.rule);
  assert.ok(rules.includes("Archivo .env subido a Git"));
  assert.ok(rules.includes("URI de MongoDB con usuario y contraseña"));
  assert.ok(rules.includes("Se imprime un secreto en los logs"));
  assert.ok(result.findings.every((f) => f.file !== "backend/.env.example"), "no debe marcar el .env.example");
});

test("secret-audit nunca imprime el valor completo del secreto", () => {
  const { dir, fakeUri } = makeFixture();
  const report = secretAudit.toMarkdown(secretAudit.audit(dir));
  assert.ok(!report.includes("p4ssw0rd123"));
  assert.ok(!report.includes("supersecretvalue"));
  assert.ok(!report.includes(fakeUri));
});

test("secret-audit informa limpio cuando no hay secretos", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-clean-"));
  fs.writeFileSync(path.join(dir, "app.js"), "console.log('hola');\n");
  const result = secretAudit.audit(dir);
  assert.equal(result.findings.length, 0);
  assert.match(secretAudit.toMarkdown(result), /No se encontraron secretos/);
});

test("secret-audit falla con un mensaje claro si la carpeta no existe", () => {
  assert.throws(() => secretAudit.audit("/no/existe/nada"), /No existe la carpeta/);
});

test("api-docs une el prefijo, detecta autenticación y campos del cuerpo", () => {
  const { dir } = makeFixture();
  const { endpoints } = apiDocs.extract(path.join(dir, "backend"));
  assert.equal(endpoints.length, 2);
  const post = endpoints.find((e) => e.method === "POST");
  assert.equal(post.path, "/api/items");
  assert.equal(post.auth, true);
  assert.deepEqual(post.body, ["name", "price"]);
  const get = endpoints.find((e) => e.method === "GET");
  assert.equal(get.auth, false);
});

test("api-docs avisa cuando no hay endpoints", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kit-empty-"));
  assert.match(apiDocs.toMarkdown(apiDocs.extract(dir)), /No se encontraron endpoints/);
});

test("readme-gen arma tecnologías, instalación, variables y API", () => {
  const { dir } = makeFixture();
  const md = readmeGen.generate(dir);
  assert.match(md, /## Tecnologías/);
  assert.match(md, /- Express/);
  assert.match(md, /cd backend/);
  assert.match(md, /`JWT_SECRET`/);
  assert.match(md, /\/api\/items/);
  assert.ok(!md.includes("supersecretvalue"), "el README no debe filtrar valores del .env");
});
