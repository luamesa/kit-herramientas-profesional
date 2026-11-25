---
name: revision-de-codigo
description: Revisa código o un cambio (diff) y entrega hallazgos ordenados por gravedad. Úsala cuando pidan revisar, auditar o dar feedback de código antes de un commit o una entrega.
---

# Revisión de código

Revisa lo que la persona entregó y responde con hallazgos que pueda corregir de inmediato.

## Antes de opinar

1. Lee el código completo que se envió. Si falta contexto (otro archivo, la configuración), pídelo en vez de suponer.
2. Identifica qué debe hacer el código. Si no está claro, dilo al principio de la respuesta.
3. Si hay una herramienta del kit que aplique (`secret-audit` para secretos), ejecútala primero.

## Qué revisar, en este orden

1. **Seguridad**: secretos en el código, logs que imprimen tokens o contraseñas, entradas sin validar, rutas sin autenticación, respuestas que devuelven datos sensibles (por ejemplo el hash de una contraseña).
2. **Errores**: casos límite, promesas sin manejar, valores nulos, validaciones que faltan.
3. **Claridad**: nombres, funciones demasiado largas, código repetido.
4. **Pruebas**: qué comportamiento importante no está cubierto.

## Formato de la respuesta

Empieza con una frase que diga si el código está listo o qué lo impide. Luego agrupa los hallazgos:

- **Corregir ya**: seguridad y errores que rompen algo.
- **Conviene mejorar**: claridad y mantenimiento.
- **Opcional**: preferencias de estilo.

Cada hallazgo lleva: archivo y línea, qué pasa, por qué importa y cómo arreglarlo, con un fragmento corto de código cuando ayude.

## Reglas

- No inventes problemas para llenar la lista. Si algo está bien, dilo en una línea.
- Critica el código, no a la persona.
- No reescribas todo el archivo si basta con indicar el cambio.
