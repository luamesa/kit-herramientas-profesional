# Skills

Una skill es una carpeta con un archivo `SKILL.md` que le enseña a un asistente de IA cómo hacer bien una tarea. Cada una empieza con un bloque de metadatos (`name` y `description`) y sigue con las instrucciones.

| Skill | Cuándo se usa | Archivo |
|---|---|---|
| Revisión de código | Revisar código o un diff antes de un commit o una entrega | [skills/revision-de-codigo/SKILL.md](../skills/revision-de-codigo/SKILL.md) |
| Documentación técnica | Escribir README, guías de instalación o documentación de API | [skills/documentacion-tecnica/SKILL.md](../skills/documentacion-tecnica/SKILL.md) |
| Mensajes de commit | Redactar commits con Conventional Commits | [skills/mensajes-de-commit/SKILL.md](../skills/mensajes-de-commit/SKILL.md) |

## Cómo apoyan el proceso

Las skills se conectan con las herramientas:

1. `secret-audit` encuentra problemas de seguridad.
2. La skill de **revisión de código** ordena los hallazgos y propone arreglos.
3. La skill de **mensajes de commit** redacta el commit que los corrige.
4. `api-docs` y `readme-gen` producen la base de la documentación, y la skill de **documentación técnica** la completa y la revisa.

## Cómo usarlas

- **En Claude (claude.ai):** comprime la carpeta de la skill en un `.zip` y súbela desde Configuración > Capacidades > Skills.
- **En Claude Code:** copia la carpeta a `~/.claude/skills/` (para todos tus proyectos) o a `.claude/skills/` dentro de un proyecto.
