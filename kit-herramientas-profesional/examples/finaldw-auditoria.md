# Auditoría de secretos: finaldw

Archivos revisados: 56. Hallazgos: 3 (2 altos, 1 medios).

## [ALTA] Archivo .env subido a Git
- Dónde: `backend/.env`
- Qué pasa: Git lo está siguiendo y contiene valores para: MONGO_URI, JWT_SECRET. Cualquiera que vea el repo puede leerlo.
- Cómo arreglarlo: Revoca esas credenciales, ejecuta `git rm --cached backend/.env`, agrega `.env` al .gitignore y deja solo un .env.example sin valores.

## [ALTA] Se imprime un secreto en los logs
- Dónde: `backend/middlewares/authMiddleware.js:8`
- Qué pasa: console imprime process.env.JWT_SECRET.
- Cómo arreglarlo: Borra ese log: los registros del servidor suelen terminar en servicios de terceros.

## [MEDIA] Se imprime un token de sesión
- Dónde: `backend/middlewares/authMiddleware.js:9`
- Qué pasa: console imprime el token que llegó en la petición.
- Cómo arreglarlo: Borra ese log; un token en los registros permite suplantar al usuario.

