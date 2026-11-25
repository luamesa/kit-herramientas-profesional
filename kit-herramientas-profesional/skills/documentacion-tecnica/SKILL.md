---
name: documentacion-tecnica
description: Escribe o mejora documentación técnica de un proyecto (README, guía de instalación, documentación de API). Úsala cuando pidan documentar código, un repositorio o una API.
---

# Documentación técnica

Escribe documentación que permita a alguien nuevo ejecutar el proyecto en menos de diez minutos.

## Antes de escribir

1. Revisa el proyecto real: `package.json`, carpetas, rutas y variables de entorno. No documentes lo que no existe.
2. Para el README y la API, ejecuta primero `readme-gen` y `api-docs` del kit y usa su salida como base.
3. Pregunta, solo si no se puede deducir: quién usará la documentación (otros estudiantes, un cliente, un equipo) y qué debe lograr tras leerla.

## Estructura de un README

1. Nombre y una frase que diga qué hace el proyecto y para quién.
2. Tecnologías.
3. Instalación y ejecución, con comandos que se puedan copiar.
4. Variables de entorno: nombre y para qué sirve cada una, nunca los valores reales.
5. Uso o ejemplos: una petición a la API, una captura o un comando.
6. Estructura de carpetas, solo si el proyecto es grande.
7. Licencia y contacto.

## Estilo

- Español claro, frases cortas, verbos en imperativo ("Instala", "Ejecuta").
- Cada bloque de comandos se puede copiar y pegar tal cual.
- Una idea por párrafo. Evita adjetivos de marketing.
- Si un paso puede fallar de una forma conocida, escribe el síntoma y la solución justo debajo.

## Comprobación final

Sigue tus propias instrucciones de instalación como si fueras una persona nueva. Si un paso depende de algo no explicado, agrégalo.
