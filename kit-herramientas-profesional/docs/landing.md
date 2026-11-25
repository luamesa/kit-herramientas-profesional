# Landing y reseñas

La landing es el archivo [`docs/index.html`](index.html): una sola página, sin dependencias de compilación.

## Publicarla con GitHub Pages

1. En el repositorio, entra a **Settings > Pages**.
2. En **Build and deployment**, elige **Deploy from a branch**, la rama `main` y la carpeta `/docs`.
3. Guarda. En un par de minutos queda disponible en `https://luamesa.github.io/kit-herramientas-profesional/`.

## Activar los comentarios y reseñas

Los comentarios usan [giscus](https://giscus.app), que guarda cada reseña como una conversación en **GitHub Discussions** del mismo repositorio. No necesitas servidor ni base de datos.

1. En el repositorio, entra a **Settings > General > Features** y activa **Discussions**.
2. Instala la app de giscus en el repositorio: https://github.com/apps/giscus
3. Abre https://giscus.app, escribe `luamesa/kit-herramientas-profesional`, elige la categoría **Announcements** o una propia y copia los valores `data-repo-id` y `data-category-id` que te muestra.
4. En `docs/index.html`, busca el bloque `GISCUS_CONFIG` y reemplaza `REEMPLAZA_REPO_ID` y `REEMPLAZA_CATEGORY_ID` por esos valores.
5. Haz commit y push. La sección "Reseñas" cargará el cuadro de comentarios.

Mientras esos valores no estén cambiados, la página muestra un enlace directo a Discussions en lugar del cuadro de comentarios, así que nunca se ve rota.

Para dejar una reseña, la persona necesita una cuenta de GitHub. Si quieres aceptar reseñas sin cuenta, puedes sustituir giscus por un formulario de Google Forms enlazado desde la misma sección.

## Compartir

El botón **Compartir** usa el menú de compartir del teléfono cuando existe y, si no, copia el enlace al portapapeles.
