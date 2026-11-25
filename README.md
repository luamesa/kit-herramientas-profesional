# Kit de Herramientas Profesional

Kit para ingeniería informática: tres herramientas de línea de comandos, un agente de Telegram y tres skills que cubren un problema real al publicar proyectos en GitHub: revisar que no se filtren secretos, documentar la API y escribir un README.

Todo funciona con Node.js 20 o superior y **sin instalar dependencias**.

**Landing:** https://luamesa.github.io/kit-herramientas-profesional/

## Qué incluye

| Pieza | Qué hace | Documentación |
|---|---|---|
| `tools/secret-audit` | Busca secretos expuestos (.env en Git, claves, logs con tokens) | [docs/herramientas.md](docs/herramientas.md) |
| `tools/api-docs` | Documenta los endpoints de un backend Express | [docs/herramientas.md](docs/herramientas.md) |
| `tools/readme-gen` | Genera un README en español desde la estructura del proyecto | [docs/herramientas.md](docs/herramientas.md) |
| `agent/` | Bot de Telegram que usa las tres herramientas y avisa de reseñas nuevas | [docs/agente.md](docs/agente.md) |
| `skills/` | Tres skills: revisión de código, documentación técnica y mensajes de commit | [docs/skills.md](docs/skills.md) |
| `docs/index.html` | Landing con enlaces a todo y sección de reseñas | [docs/landing.md](docs/landing.md) |

## Inicio rápido

```bash
git clone https://github.com/luamesa/kit-herramientas-profesional.git
cd kit-herramientas-profesional

npm run audit -- ../mi-proyecto      # auditoría de secretos
npm run api -- ../mi-proyecto/backend # documentación de la API
npm run readme -- ../mi-proyecto      # README generado
npm test                              # 16 pruebas
```

## Ejemplo real

Las herramientas se probaron sobre [ReviewHub (FINALDW)](https://github.com/luamesa/FINALDW), un proyecto Full Stack del mismo autor. Los resultados están en [`examples/`](examples/):

- [Auditoría](examples/finaldw-auditoria.md): encontró un `.env` versionado y logs que imprimen `JWT_SECRET` y el token de sesión.
- [API](examples/finaldw-api.md): 7 endpoints, 3 protegidos.
- [README](examples/finaldw-readme.md): generado en un segundo.

## Estructura

```
agent/      bot de Telegram (handlers.js tiene la lógica, bot.js la conexión)
docs/       landing (index.html) y documentación en Markdown
examples/   salidas reales de las herramientas sobre FINALDW
skills/     tres skills con su SKILL.md
test/       16 pruebas con node:test
tools/      las tres herramientas y una librería compartida
```

## Licencia

MIT. Consulta [LICENSE](LICENSE).
