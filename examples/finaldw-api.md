# API de backend

7 endpoints: 4 públicos y 3 que exigen autenticación.

| Método | Ruta | Autenticación | Campos del cuerpo | Función |
|---|---|---|---|---|
| POST | `/api/auth/login` | No | email, password | `login` |
| POST | `/api/auth/register` | No | username, email, password | `register` |
| GET | `/api/reviews` | No | - | `getReviews` |
| POST | `/api/reviews` | Sí (Bearer token) | - | `createReview` |
| GET | `/api/reviews/:id` | No | - | `getReview` |
| PUT | `/api/reviews/:id` | Sí (Bearer token) | titulo, descripcion, calificacion | `updateReview` |
| DELETE | `/api/reviews/:id` | Sí (Bearer token) | - | `deleteReview` |

Las rutas protegidas esperan el encabezado `Authorization: Bearer <token>`.
