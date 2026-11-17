# API REST de Productos

API REST construida con **Node.js + Express + Prisma + PostgreSQL**, aplicando N capas, MVC y los patrones Singleton, Repository y Chain of Responsibility.

**Despliegue en Render:** https://api-productos-1hdu.onrender.com/api

## Requisitos

- Node.js >= 18 (probado con Node 26)
- PostgreSQL >= 14 (probado con PostgreSQL 18)
- `npm`

## Instalación

```bash
cd C:\Users\estudiante\Desktop\api-productos
npm install
```

## Configuración

1. Copia `.env.example` a `.env` y ajusta los valores:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://postgres:changeme@localhost:5432/productos_db?schema=public"

JWT_SECRET=change_this_secret
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=10

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

> Si algún valor contiene `#`, escríbelo entre comillas dobles y codifícalo en la URL (`%23`), por ejemplo `postgresql://usuario:pass%23word@localhost:5432/db?schema=public`.

2. Crea la base de datos y aplica las migraciones de Prisma:

```powershell
$env:PGPASSWORD = "tu_password"
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -h localhost -U postgres productos_db
npm run db:migrate
```

`database/schema.sql` se conserva como referencia del esquema original; la fuente de verdad es `prisma/schema.prisma`.

3. Arranca el servidor:

```bash
npm run dev     # recarga automática
npm start       # producción
```

El servidor verifica la conexión a PostgreSQL antes de escuchar. Si falla, termina con un mensaje claro. Al recibir `SIGINT`/`SIGTERM` cierra el servidor y el cliente de Prisma de forma ordenada.

## Arquitectura

```
Cliente → Router → Middlewares (cadena) → Controller → Service → Repository → Model/Database (PostgreSQL)
```

| Capa | Carpetas | Responsabilidad |
|---|---|---|
| Presentación | `src/routes`, `src/controllers` | HTTP y respuesta JSON; sin acceso a datos ni reglas de negocio |
| Middleware | `src/middlewares` | CORS, logs, paginación, hash, JWT, validación y errores |
| Negocio | `src/services` | Reglas y orquestación; no conoce `req`/`res` |
| Acceso a datos | `src/repositories` | Único lugar que llama a Prisma; sin lógica de negocio |
| Modelo / BD | `src/models`, `prisma/` | Entidades, Singleton del `PrismaClient` y esquema/migraciones |

Patrones aplicados:

- **Singleton:** `models/database.js` (único `PrismaClient`), `models/Producto.js`, `models/Usuario.js` y los repositories.
- **Repository:** `BaseRepository` define el contrato; `ProductoRepository` es el único que accede a datos de productos. El `PATCH` envía solo los campos permitidos y recibidos.
- **Chain of Responsibility:** `Handler` + `buildChain`, con `RequiredFieldsHandler → TypeHandler → RangeHandler`. La cadena global se documenta en `src/app.js`.
- **MVC:** Modelo en `models/`, vista = respuesta JSON estandarizada, controlador en `controllers/`.

### Cadena global de middlewares

```
Logger → CORS → Parser JSON → Rutas [Auth → Paginación → Hash* → Validación] → Controller → 404 → Manejador de errores
```

\* Hash solo en el registro de usuarios.

## Respuestas

Éxito:

```json
{
  "success": true,
  "message": "Producto creado correctamente",
  "data": {},
  "pagination": { "page": 1, "limit": 100, "total": 250, "totalPages": 3 }
}
```

`pagination` aparece solo en el listado.

Error:

```json
{
  "success": false,
  "message": "Error de validación",
  "errors": [{ "field": "precio", "message": "Debe ser mayor o igual a 0" }]
}
```

`errors` aparece solo en errores de validación.

## Endpoints

Base local: `http://localhost:3000/api` · Base en Render: `https://api-productos-1hdu.onrender.com/api`

### Autenticación

```bash
# Registrar admin (rol por defecto: editor)
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"nombre\":\"Ana\",\"email\":\"ana@example.com\",\"password\":\"secret123\",\"rol\":\"admin\"}"

# Registrar editor
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"nombre\":\"Luis\",\"email\":\"luis@example.com\",\"password\":\"secret123\",\"rol\":\"editor\"}"

# Registrar lector
curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"nombre\":\"Marta\",\"email\":\"marta@example.com\",\"password\":\"secret123\",\"rol\":\"lector\"}"

# Login (devuelve token JWT)
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"ana@example.com\",\"password\":\"secret123\"}"
```

En PowerShell usa comillas simples en `-d` o un here-string para evitar escapados.

Guarda el token devuelto:

```powershell
$TOKEN = (Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -ContentType "application/json" -Body '{"email":"ana@example.com","password":"secret123"}').data.token
```

### Productos

```powershell
# GET /api/Productos — listado paginado (máx. 100)
Invoke-RestMethod -Uri "http://localhost:3000/api/Productos?page=1&limit=100" -Headers @{Authorization="Bearer $TOKEN"}

# GET /api/Productos/:id
Invoke-RestMethod -Uri "http://localhost:3000/api/Productos/1" -Headers @{Authorization="Bearer $TOKEN"}

# POST /api/Productos — admin o editor
Invoke-RestMethod -Uri "http://localhost:3000/api/Productos" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{"nombre":"Laptop","descripcion":"Portátil 16 GB","precio":999.99,"stock":10,"categoria":"Tecnologia","activo":true}'

# PUT /api/Productos/:id — reemplaza todos los campos (admin o editor)
Invoke-RestMethod -Uri "http://localhost:3000/api/Productos/1" -Method Put -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{"nombre":"Laptop Pro","descripcion":"Portátil 32 GB","precio":1299.99,"stock":5,"categoria":"Tecnologia","activo":true}'

# PATCH /api/Productos/:id — actualización parcial (admin o editor)
Invoke-RestMethod -Uri "http://localhost:3000/api/Productos/1" -Method Patch -ContentType "application/json" -Headers @{Authorization="Bearer $TOKEN"} -Body '{"precio":1099.99}'

# DELETE /api/Productos/:id — solo admin (devuelve 200 con el producto eliminado)
Invoke-RestMethod -Uri "http://localhost:3000/api/Productos/1" -Method Delete -Headers @{Authorization="Bearer $TOKEN"}
```

Equivalentes con `curl` (sustituye `<TOKEN>`):

```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/Productos
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/Productos/1
curl -X POST -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{\"nombre\":\"Laptop\",\"precio\":999.99,\"stock\":10}" http://localhost:3000/api/Productos
curl -X PUT -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{\"nombre\":\"Laptop Pro\",\"precio\":1299.99,\"stock\":5}" http://localhost:3000/api/Productos/1
curl -X PATCH -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{\"precio\":1099.99}" http://localhost:3000/api/Productos/1
curl -X DELETE -H "Authorization: Bearer <TOKEN>" http://localhost:3000/api/Productos/1
```

### Matriz de acceso

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/Productos`, `/api/Productos/:id` | Cualquier usuario autenticado |
| POST, PUT, PATCH | `/api/Productos...` | `admin`, `editor` |
| DELETE | `/api/Productos/:id` | `admin` |

## Decisiones documentadas

- **CommonJS** en todo el proyecto para mantener consistencia.
- **Registro:** se valida el cuerpo antes de hashear la contraseña (evita hashear contraseñas inválidas); el middleware `hash.middleware.js` es el único que hashea antes de guardar.
- **DELETE** responde `200` con JSON estándar y el producto eliminado (la especificación permitía `200` o `204`).
- **Registro abierto:** cualquier persona puede registrarse; los roles válidos son `admin`, `editor` y `lector`. En producción debe restringirse el registro de `admin`.
- **Paginación:** `page=1` y `limit=100` por defecto; `limit > 100` se ajusta a `100`.
- **Validación de `id`:** se ejecuta como handler de la misma cadena antes de consultar.
- **Logs:** se registran método, URL, estado, tiempo e IP; nunca el cuerpo ni cabeceras sensibles.
- **Prisma:** se migró el acceso a datos desde `pg` a Prisma ORM; el `PrismaClient` es un Singleton y las consultas están en los repositories.
- **Health check:** `GET /api/health` responde `200` sin autenticación para el health check de Render.

## Errores mapeados

| Código | HTTP | Significado |
|---|---|---|
| `P2002` / `23505` | 409 | Valor duplicado (email único) |
| `P2003` / `23503` | 409 | Registro referenciado |
| `P2025` | 404 | Registro no encontrado |
| `22P02` | 400 | Formato inválido |
| `23502`, `23514` | 400 | Campo obligatorio / restricción incumplida |

## Criterios de aceptación cubiertos

- Los 5 métodos sobre `/api/Productos` funcionan.
- El listado nunca supera 100 registros.
- BD, modelos y repositories son singletons verificables (`Database.instance`, `Producto.instance`, etc.).
- Ningún controller contiene SQL.
- La validación usa una cadena de handlers (Chain of Responsibility).
- Errores en JSON estándar con códigos centralizados en `utils/httpStatus.js`.
- Rutas protegidas: `401` sin token, `403` con rol insuficiente.
- Contraseñas hasheadas con bcrypt (10 rounds) y nunca devueltas.

## Despliegue en Render

El Web Service usa una base de datos PostgreSQL de Render y hace autodeploy desde `main`.

- **Repo:** `https://github.com/paolita711/ejercicioORM` (rama `main`)
- **Build command:** `npm install && npm run db:migrate`
- **Start command:** `npm start`
- **Health check path:** `/api/health`

> El plan free de Render no ejecuta pre-deploy commands, por eso las migraciones de Prisma se ejecutan durante el build.

Variables de entorno configuradas en Render: `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`, `CORS_ORIGINS`. El `DATABASE_URL` y el `JWT_SECRET` se gestionan como secretos y no se versionan.
