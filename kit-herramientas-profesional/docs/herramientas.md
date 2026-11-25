# Herramientas

Las tres herramientas son scripts de Node.js sin dependencias. Reciben la carpeta de un proyecto y escriben el resultado en la terminal.

## secret-audit

Busca secretos expuestos antes de que el proyecto llegue a GitHub.

```bash
node tools/secret-audit/index.js ../mi-proyecto
node tools/secret-audit/index.js ../mi-proyecto --json
```

**Qué detecta**

| Hallazgo | Severidad |
|---|---|
| Archivo `.env` que Git está siguiendo | Alta |
| URI de MongoDB con usuario y contraseña | Alta |
| Claves privadas, claves de AWS, tokens de GitHub y de Telegram | Alta |
| `console.log` que imprime `process.env.*SECRET`, `*TOKEN`, `*PASSWORD`, `*KEY` | Alta |
| Token de sesión impreso en los logs | Media |
| Credenciales escritas en el código | Media |
| `.gitignore` que no excluye `.env` | Media |

**Cómo funciona**

- Pregunta a Git qué archivos sigue (`git ls-files`), así distingue un `.env` ignorado de uno subido.
- Ignora `.env.example`, archivos de bloqueo y Markdown.
- **Nunca imprime el valor completo del secreto.** Solo muestra dos caracteres, el último y la longitud.
- Termina con código de salida `1` si hay hallazgos de severidad alta, así que sirve en un hook de Git o en CI.

**Qué hacer si encuentra un secreto subido:** borrarlo del repo no basta, porque queda en el historial. Revoca la credencial (cambia la contraseña de la base de datos, genera un nuevo `JWT_SECRET`) y luego limpia el repo.

## api-docs

Lee un backend Express y genera una tabla con cada endpoint.

```bash
node tools/api-docs/index.js ../mi-proyecto/backend
```

**Qué extrae**

- Método y ruta completa, uniendo el prefijo de `app.use("/api/x", require("./routes/x"))` con cada `router.get(...)`.
- Si la ruta exige autenticación, según los nombres de los middlewares (`auth`, `protect`, `verify`, `jwt`).
- Campos del cuerpo (`req.body`) que usa la función del controlador.

**Límites:** funciona con el estilo habitual de Express (`router.METHOD(ruta, middlewares, función)`). Si el controlador usa `...req.body`, los campos no se pueden deducir y aparecen con un guion.

## readme-gen

Genera un README en español a partir de lo que realmente hay en el proyecto.

```bash
node tools/readme-gen/index.js ../mi-proyecto
node tools/readme-gen/index.js ../mi-proyecto --out README.generated.md
```

**Qué incluye:** tecnologías detectadas en los `package.json`, estructura de carpetas, comandos de instalación por carpeta, variables de entorno (desde `.env.example`), tabla de la API y estado de la licencia. Lo que no se puede deducir (la descripción del proyecto) queda como una nota para completar.

## Pruebas

```bash
npm test
```

Las pruebas crean un backend de ejemplo en una carpeta temporal y comprueban que las herramientas lo analizan bien, incluido que los secretos nunca aparecen completos en los reportes.
