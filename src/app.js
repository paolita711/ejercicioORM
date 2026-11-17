const express = require('express');
const corsMiddleware = require('./middlewares/cors.middleware');
const logger = require('./middlewares/logger.middleware');
const routes = require('./routes');
const AppError = require('./utils/AppError');
const errorHandler = require('./middlewares/errorHandler.middleware');

const app = express();

/*
 * Patrón: Chain of Responsibility — cadena global de middlewares:
 * Logger → CORS → Parser JSON → Rutas [Auth → Paginación → Hash* → Validación]
 * → Controller → 404 → Manejador de errores
 * (*) Hash solo donde aplica: POST /api/auth/register.
 */
app.use(logger.requestLogger);
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

app.use((req, res, next) => {
  next(AppError.notFound(`Ruta ${req.method} ${req.originalUrl} no encontrada`));
});

app.use(errorHandler);

module.exports = app;
