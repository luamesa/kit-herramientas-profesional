# finaldw

_Agrega aquí una descripción de una o dos frases: qué problema resuelve y para quién._

## Tecnologías

- Express
- MongoDB (Mongoose)
- JWT
- bcryptjs
- Angular
- TypeScript
- Vitest

## Estructura

```
README.md
backend/
  .env
  .env.example
  .gitignore
  config/
  controllers/
  index.js
  middlewares/
  models/
  package-lock.json
  package.json
  routes/
frontend/
  .editorconfig
  .gitignore
  README.md
  angular.json
  package-lock.json
  package.json
  public/
  src/
  tsconfig.app.json
  tsconfig.json
  tsconfig.spec.json
```

## Instalación

### backend

```bash
cd backend
npm install
npm run dev
```

### frontend

```bash
cd frontend
npm install
npm run ng
npm run start
npm run build
```

## Variables de entorno

Copia el archivo `.env.example` a `.env` y completa los valores. No subas el `.env` a Git.

| Variable | Definida en |
|---|---|
| `PORT` | `backend/.env.example` |
| `MONGODB_URI` | `backend/.env.example` |
| `JWT_SECRET` | `backend/.env.example` |

## API

| Método | Ruta | Autenticación |
|---|---|---|
| POST | `/api/auth/login` | No |
| POST | `/api/auth/register` | No |
| GET | `/api/reviews` | No |
| POST | `/api/reviews` | Sí |
| GET | `/api/reviews/:id` | No |
| PUT | `/api/reviews/:id` | Sí |
| DELETE | `/api/reviews/:id` | Sí |

## Licencia

_Define una licencia (por ejemplo MIT) y agrégala como LICENSE._

