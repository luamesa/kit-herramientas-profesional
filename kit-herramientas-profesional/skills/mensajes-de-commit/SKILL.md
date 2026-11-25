---
name: mensajes-de-commit
description: Redacta mensajes de commit claros siguiendo Conventional Commits, a partir de un diff o una descripción de cambios. Úsala cuando pidan un mensaje de commit o ordenar el historial de Git.
---

# Mensajes de commit

Un buen mensaje explica qué cambió y por qué, para que el historial sirva como documentación.

## Formato

```
tipo(ámbito): resumen en imperativo, máximo 72 caracteres

Cuerpo opcional: por qué se hizo el cambio y qué efecto tiene.
```

Tipos: `feat` (función nueva), `fix` (corrección), `docs`, `refactor`, `test`, `chore` (mantenimiento), `security` para cambios que cierran una vulnerabilidad.

## Cómo trabajar

1. Lee el diff (`git diff --staged`) antes de escribir. Describe lo que el código hace, no lo que la persona dice que hizo.
2. Si el diff mezcla cambios sin relación, propón dividirlo en varios commits y da un mensaje para cada uno.
3. El resumen empieza con verbo en infinitivo o imperativo y va en minúscula: `fix(auth): evitar imprimir el token en los logs`.
4. En el cuerpo explica la razón, no repitas el diff. Menciona cualquier acción pendiente (por ejemplo "rotar la clave JWT").

## Ejemplos

- `feat(reviews): permitir editar solo reseñas propias`
- `fix(db): leer MONGODB_URI como indica .env.example`
- `security(repo): dejar de versionar backend/.env`
- `docs: agregar guía de instalación`

## Evita

- Mensajes como "cambios", "arreglos" o "update".
- Resúmenes de más de 72 caracteres.
- Mezclar varios temas en un solo commit.
